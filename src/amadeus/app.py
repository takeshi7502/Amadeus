from __future__ import annotations

import asyncio
import contextlib
import hashlib
import hmac
import json
import logging
import mimetypes
import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .chat import ChatError, ChatService
from .config import Mode, Settings, load_settings
from .knowledge import KnowledgeBase
from .provider import ModelClient
from .storage import Store

STATIC = Path(__file__).parent / "static"
log = logging.getLogger("amadeus")
ADMIN_OWNER = "web:admin"

# Minimal Linux runtimes may lack these entries in their system MIME database.
# FileResponse must identify these assets correctly even on the API fallback.
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("font/ttf", ".ttf")


class NewSession(BaseModel):
    mode: Mode | None = None


class ChatInput(BaseModel):
    text: str = Field(min_length=1, max_length=6000)
    request_id: UUID
    web_search: bool = False
    language: Literal["vi", "en"] = "vi"

    @field_validator("text")
    @classmethod
    def not_blank(cls, value):
        if not value.strip():
            raise ValueError("Tin nhắn không được để trống.")
        return value.strip()


class MemoryInput(BaseModel):
    content: str = Field(min_length=1, max_length=1000)

    @field_validator("content")
    @classmethod
    def not_blank(cls, value):
        if not value.strip():
            raise ValueError("Ký ức không được để trống.")
        return value.strip()


class LoginInput(BaseModel):
    password: str = Field(max_length=1000)


class GuestMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=20000)


class GuestChatInput(ChatInput):
    mode: Mode = "amadeus"
    history: list[GuestMessage] = Field(default_factory=list, max_length=24)
    memories: list[MemoryInput] = Field(default_factory=list, max_length=50)

    @field_validator("history")
    @classmethod
    def complete_turns(cls, value):
        if len(value) % 2 or any(item.role != ("user" if i % 2 == 0 else "assistant") for i, item in enumerate(value)):
            raise ValueError("Lịch sử phải gồm các cặp tin nhắn và câu trả lời hoàn chỉnh.")
        return value


def create_app(settings: Settings | None = None, *, model=None) -> FastAPI:
    settings = settings or load_settings()
    store = Store(settings.data_dir / "amadeus.db", turso_url=settings.turso_url, turso_token=settings.turso_token)
    kb = KnowledgeBase()

    @asynccontextmanager
    async def lifespan(app):
        await store.initialize()
        if settings.signing_secret:
            app.state.signing_key = hashlib.sha256(settings.signing_secret.encode()).digest()
        else:
            keyfile = settings.data_dir / "session.key"
            keyfile.parent.mkdir(parents=True, exist_ok=True)
            try:
                fd = os.open(keyfile, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                with os.fdopen(fd, "wb") as file:
                    file.write(secrets.token_bytes(32))
            except FileExistsError:
                pass
            app.state.signing_key = keyfile.read_bytes()
        if len(app.state.signing_key) < 32:
            raise RuntimeError("data/session.key không hợp lệ; cần ít nhất 32 byte.")
        app.state.model = model or ModelClient(settings)
        app.state.chat = ChatService(settings, store, app.state.model, kb)
        task = None
        if settings.telegram_enabled:
            from .telegram import TelegramBot
            task = asyncio.create_task(TelegramBot(settings, app.state.chat).run())
        try:
            yield
        finally:
            if task:
                task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await task
            await app.state.model.close()

    app = FastAPI(title="Amadeus", version="0.1.0", lifespan=lifespan, docs_url=None, redoc_url=None)
    app.state.store = store
    app.state.settings = settings
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

    def sign(value: str) -> str:
        return hmac.new(app.state.signing_key, value.encode(), hashlib.sha256).hexdigest()

    def admin_value() -> str:
        stamp = hashlib.sha256(settings.web_password.encode()).hexdigest()[:16]
        return "admin.v1." + stamp

    def legacy_owner(request: Request) -> str | None:
        cookie = request.cookies.get("amadeus_session", "")
        if len(cookie) >= 300:
            return None
        value, _, signature = cookie.rpartition(".")
        parts = value.split(".")
        stamp = hashlib.sha256(settings.web_password.encode()).hexdigest()[:16]
        if len(parts) == 2 and parts[0].startswith("web:") and hmac.compare_digest(signature, sign(value)) and hmac.compare_digest(parts[1], stamp):
            return parts[0]
        return None

    @app.middleware("http")
    async def browser_session(request: Request, call_next):
        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            origin = request.headers.get("origin")
            if origin and (urlsplit(origin).netloc != request.url.netloc or urlsplit(origin).scheme != request.url.scheme):
                return JSONResponse({"detail": "Nguồn yêu cầu không hợp lệ."}, status_code=403)
            if request.headers.get("sec-fetch-site") == "cross-site":
                return JSONResponse({"detail": "Yêu cầu từ trang khác bị từ chối."}, status_code=403)
            try:
                limit = 262144 if request.url.path == "/api/guest/messages" else 64000
                if int(request.headers.get("content-length", "0")) > limit:
                    return JSONResponse({"detail": "Yêu cầu quá lớn."}, status_code=413)
            except ValueError:
                return JSONResponse({"detail": "Yêu cầu không hợp lệ."}, status_code=400)
        cookie = request.cookies.get("amadeus_admin", "")
        value, _, signature = cookie.rpartition(".")
        authenticated = bool(settings.web_password and cookie and len(cookie) < 200
                             and hmac.compare_digest(value, admin_value()) and hmac.compare_digest(signature, sign(value)))
        request.state.owner = ADMIN_OWNER if authenticated else None
        visitor, fresh = "", False
        if request.url.path.startswith("/api/"):
            cookie = request.cookies.get("amadeus_visitor", "")
            token, _, signature = cookie.rpartition(".")
            valid = 24 <= len(token) <= 96 and token.isascii() and token.replace("-", "").replace("_", "").isalnum()
            if not valid or not hmac.compare_digest(signature, sign("guest." + token)):
                token, fresh = secrets.token_urlsafe(24), True
            visitor = token
        request.state.visitor = visitor
        response = await call_next(request)
        if fresh:
            response.set_cookie("amadeus_visitor", visitor + "." + sign("guest." + visitor), httponly=True,
                                samesite="strict", secure=settings.secure_cookie, max_age=60 * 60 * 24 * 365)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    async def owner(request: Request) -> str:
        if not request.state.owner:
            raise HTTPException(401, "Đăng nhập admin để mở lịch sử lưu trên máy chủ.")
        return request.state.owner

    @app.exception_handler(ChatError)
    async def chat_error(request, error):
        return JSONResponse({"detail": str(error)}, status_code=error.status)

    @app.exception_handler(ValueError)
    async def value_error(request, error):
        return JSONResponse({"detail": str(error)}, status_code=400)

    @app.get("/health")
    async def health():
        return {"ok": True}

    @app.get("/api/status")
    async def status(request: Request):
        return {"name": "Amadeus", "authenticated": bool(request.state.owner), "password_required": False,
                "role": "admin" if request.state.owner else "guest", "admin_available": bool(settings.web_password),
                "storage": "server" if request.state.owner else "browser", "model_ready": app.state.model.ready,
                "default_mode": settings.default_mode, "canon_entries": len(kb.entries), "spoilers": "S;G + S;G 0",
                "web_search_enabled": settings.web_search_enabled}

    @app.post("/api/login")
    async def login(body: LoginInput, request: Request):
        await app.state.chat.check_rate("login:" + (request.client.host if request.client else "local"))
        if not settings.web_password:
            raise HTTPException(503, "Chưa đặt mật khẩu admin trên máy chủ.")
        if not hmac.compare_digest(body.password.encode(), settings.web_password.encode()):
            raise HTTPException(401, "Mật khẩu chưa đúng.")
        previous = legacy_owner(request)
        if previous and previous != ADMIN_OWNER:
            await store.merge_owner(previous, ADMIN_OWNER)
        value = admin_value()
        response = JSONResponse({"ok": True, "role": "admin"})
        response.set_cookie("amadeus_admin", value + "." + sign(value), httponly=True, samesite="strict",
                            secure=settings.secure_cookie, max_age=60 * 60 * 24 * 30)
        response.delete_cookie("amadeus_session", secure=settings.secure_cookie, httponly=True, samesite="strict")
        return response

    @app.post("/api/logout")
    async def logout():
        response = JSONResponse({"ok": True, "role": "guest"})
        response.delete_cookie("amadeus_admin", secure=settings.secure_cookie, httponly=True, samesite="strict")
        response.delete_cookie("amadeus_session", secure=settings.secure_cookie, httponly=True, samesite="strict")
        return response

    def stream_events(events):
        async def stream():
            try:
                async with contextlib.aclosing(events) as source:
                    async for kind, payload in source:
                        yield f"event: {kind}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"
            except ChatError as error:
                yield f"event: error\ndata: {json.dumps({'message': str(error), 'status': error.status}, ensure_ascii=False)}\n\n"
            except Exception as error:
                log.error("Chat failed (%s)", type(error).__name__)
                yield 'event: error\ndata: {"message":"Không hoàn thành được lượt này. Hãy thử lại."}\n\n'
        return StreamingResponse(stream(), media_type="text/event-stream", headers={"X-Accel-Buffering": "no"})

    @app.post("/api/guest/messages")
    async def guest_message(body: GuestChatInput, request: Request):
        return stream_events(app.state.chat.guest_events(
            request.state.visitor, request.client.host if request.client else "local", body.mode, body.text, str(body.request_id),
            [message.model_dump() for message in body.history], [note.model_dump() for note in body.memories],
            web_search=body.web_search, language=body.language))

    @app.get("/api/sessions")
    async def sessions(identity=Depends(owner)):
        return [{k: v for k, v in session.items() if k != "owner"} for session in await store.sessions(identity)]

    @app.post("/api/sessions", status_code=201)
    async def new_session(body: NewSession, identity=Depends(owner)):
        return await store.create_session(identity, body.mode or settings.default_mode)

    @app.get("/api/sessions/{sid}")
    async def get_session(sid: UUID, identity=Depends(owner)):
        session = await app.state.chat.require_session(identity, str(sid))
        return {**session, "messages": await store.messages(str(sid))}

    @app.delete("/api/sessions/{sid}")
    async def delete_session(sid: UUID, identity=Depends(owner)):
        async with app.state.chat.guard(str(sid)):
            await app.state.chat.require_session(identity, str(sid))
            await store.delete_session(identity, str(sid))
        return {"ok": True}

    @app.get("/api/sessions/{sid}/export")
    async def export_session(sid: UUID, identity=Depends(owner)):
        session = await app.state.chat.require_session(identity, str(sid))
        return JSONResponse({"title": session["title"], "mode": session["mode"], "messages": await store.messages(str(sid), limit=-1)},
                            headers={"Content-Disposition": f'attachment; filename="amadeus-{sid}.json"'})

    @app.get("/api/sessions/{sid}/requests/{rid}")
    async def completed_request(sid: UUID, rid: UUID, identity=Depends(owner)):
        await app.state.chat.require_session(identity, str(sid))
        record = await store.completed(str(sid), str(rid))
        return {"completed": bool(record)}

    @app.post("/api/sessions/{sid}/messages")
    async def message(sid: UUID, body: ChatInput, identity=Depends(owner)):
        await app.state.chat.require_session(identity, str(sid))
        return stream_events(app.state.chat.events(identity, str(sid), body.text, str(body.request_id),
                                                   web_search=body.web_search, language=body.language))

    @app.get("/api/memories")
    async def memories(identity=Depends(owner)):
        return await store.memories(identity)

    @app.post("/api/memories", status_code=201)
    async def remember(body: MemoryInput, identity=Depends(owner)):
        return await store.remember(identity, body.content)

    @app.delete("/api/memories/{mid}")
    async def forget(mid: UUID, identity=Depends(owner)):
        await store.forget(identity, str(mid))
        return {"ok": True}

    @app.get("/api/canon")
    async def canon(q: str = ""):
        if len(q) > 300:
            raise HTTPException(400, "Từ khóa tối đa 300 ký tự.")
        entries = kb.search(q, limit=20) if q.strip() else kb.entries
        return [kb.public_entry(e) for e in entries]

    app.mount("/assets", StaticFiles(directory=STATIC), name="assets")
    if not settings.serverless:
        settings.assets_dir.mkdir(parents=True, exist_ok=True)
    # Keep a source-backed route as well as public/ CDN output. A clean Git
    # deployment must still serve runtime assets if CDN promotion is unavailable.
    app.mount("/runtime", StaticFiles(directory=settings.assets_dir, check_dir=not settings.serverless), name="runtime")

    @app.get("/")
    async def index():
        return FileResponse(STATIC / "index.html")

    return app
