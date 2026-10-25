from __future__ import annotations

import asyncio
import contextlib
import logging
import uuid

import httpx

from .chat import ChatError, ChatService
from .config import Settings

log = logging.getLogger("amadeus.telegram")
HELP = """Amadeus / Makise Kurisu
Mô phỏng nhân vật fan từ Steins;Gate & Steins;Gate 0 (có spoiler).

Gửi văn bản để trò chuyện riêng với Kurisu.
/new — tạo cuộc trò chuyện mới
/search <câu hỏi> — tra cứu mạng rồi trả lời
/mode amadeus hoặc /mode lab — đổi vai, bắt đầu cuộc mới
/remember <nội dung> — lưu một ghi chú cá nhân
/memories — xem các ghi chú đã lưu
/forget <ID> — xóa ghi chú
/reset — xóa cuộc trò chuyện hiện tại
/help — xem hướng dẫn

Lịch sử và ghi chú Telegram tách riêng với trình duyệt web.
"""


def split_text(text: str, limit: int = 3800) -> list[str]:
    """Telegram counts UTF-16 units; leave space below the platform limit."""
    chunks, current, units = [], [], 0
    for char in text:
        size = 2 if ord(char) > 0xFFFF else 1
        if units + size > limit:
            chunks.append("".join(current))
            current, units = [], 0
        current.append(char)
        units += size
    if current:
        chunks.append("".join(current))
    return chunks


class TelegramAPIError(Exception):
    def __init__(self, code: int):
        self.code = code


class TelegramBot:
    def __init__(self, settings: Settings, chat: ChatService, *, transport=None):
        self.settings, self.chat, self.store = settings, chat, chat.store
        self.client = httpx.AsyncClient(timeout=httpx.Timeout(45, connect=10), transport=transport)
        self.base = f"https://api.telegram.org/bot{settings.telegram_token}/"

    async def call(self, method: str, **body):
        # Do not log URLs: Telegram embeds its token in the path.
        response = await self.client.post(self.base + method, json=body)
        if response.status_code >= 400:
            raise TelegramAPIError(response.status_code)
        result = response.json()
        if not result.get("ok"):
            raise TelegramAPIError(result.get("error_code", 500))
        return result.get("result")

    async def send(self, chat_id: int, text: str):
        for chunk in split_text(text):
            await self.call("sendMessage", chat_id=chat_id, text=chunk)

    async def current(self, owner: str):
        sid = await self.store.get_runtime("active:" + owner)
        session = await self.store.session(owner, sid) if sid else None
        if session:
            return session
        session = await self.store.create_session(owner, self.settings.default_mode)
        await self.store.set_runtime("active:" + owner, session["id"])
        return session

    async def handle(self, message: dict):
        user = message.get("from", {})
        group = message.get("chat", {})
        if group.get("type") != "private" or user.get("is_bot") or not user.get("id"):
            return
        uid, cid = user["id"], group["id"]
        if self.settings.telegram_allowed_users and uid not in self.settings.telegram_allowed_users:
            await self.send(cid, "Phiên Amadeus này chỉ mở cho các tài khoản được cấu hình cho phép.")
            return
        text = message.get("text", "").strip()
        if not text:
            await self.send(cid, "Hiện tôi chỉ đọc được văn bản. Cậu mô tả nội dung đó được không?")
            return
        owner = f"telegram:{uid}"
        command, _, arg = text.partition(" ")
        command = command.split("@")[0].lower()
        arg = arg.strip()
        if command in {"/start", "/help"}:
            await self.send(cid, HELP)
            return
        if command in {"/new", "/mode"}:
            mode = arg if command == "/mode" else (await self.current(owner))["mode"]
            if mode not in {"amadeus", "lab"}:
                await self.send(cid, "Chọn /mode amadeus hoặc /mode lab. Mỗi chế độ có một mốc ký ức riêng.")
                return
            session = await self.store.create_session(owner, mode)
            await self.store.set_runtime("active:" + owner, session["id"])
            await self.send(cid, "Đã mở cuộc trò chuyện mới. Chế độ: " + mode + ". Cậu muốn nói về chuyện gì?")
            return
        if command == "/remember":
            if not arg or len(arg) > 1000:
                await self.send(cid, "Dùng /remember <ghi chú từ 1 đến 1000 ký tự>.")
                return
            memory = await self.store.remember(owner, arg)
            await self.send(cid, "Đã lưu ghi chú. ID để xóa: " + memory["id"])
            return
        if command == "/memories":
            notes = await self.store.memories(owner)
            await self.send(cid, "\n\n".join(f"{m['id']}\n{m['content']}" for m in notes) or "Chưa có ghi chú cá nhân nào được lưu.")
            return
        if command == "/forget":
            try:
                mid = str(uuid.UUID(arg))
            except ValueError:
                await self.send(cid, "Dùng /forget <ID ghi chú>. Xem ID bằng /memories.")
                return
            await self.store.forget(owner, mid)
            await self.send(cid, "Ghi chú đã được xóa nếu có trong bộ nhớ của cậu.")
            return
        if command == "/reset":
            session = await self.current(owner)
            async with self.chat.guard(session["id"]):
                await self.store.delete_session(owner, session["id"])
            await self.store.set_runtime("active:" + owner, "")
            await self.send(cid, "Đã xóa cuộc trò chuyện hiện tại. Ghi chú riêng vẫn còn; dùng /forget để xóa từng ghi chú.")
            return
        web_search = command == "/search"
        if web_search:
            if not arg:
                await self.send(cid, "Dùng /search <câu hỏi cần tra cứu>.")
                return
            text = arg
        if text.startswith("/") and not web_search:
            await self.send(cid, "Lệnh này chưa có. Dùng /help để xem các lệnh.")
            return
        if len(text) > 6000:
            await self.send(cid, "Mỗi lượt tối đa 6000 ký tự. Cậu chia câu hỏi thành hai phần nhé.")
            return
        session = await self.current(owner)
        # Stable across update re-delivery and restarts, scoped by the private chat.
        rid = str(uuid.uuid5(uuid.NAMESPACE_URL, f"amadeus:telegram:{cid}:{message['message_id']}"))
        await self.call("sendChatAction", chat_id=cid, action="typing")
        try:
            async for kind, payload in self.chat.events(owner, session["id"], text, rid, web_search=web_search):
                if kind == "done":
                    # Deliver only a completed, durable answer; never re-run the AI after a send failure.
                    refs = "\n\nNguồn tra cứu:\n" + "\n".join(s["url"] for s in payload.get("sources", [])) if payload.get("sources") else ""
                    await self.send(cid, payload["text"] + refs)
        except ChatError as error:
            await self.send(cid, str(error))

    async def run(self):
        # Stable ID, not the token, scopes durable polling state to this bot.
        bot_id = self.settings.telegram_token.partition(":")[0]
        key = "telegram_offset:" + bot_id
        offset = int(await self.store.get_runtime(key, "0"))
        try:
            me = await self.call("getMe")
            log.info("Telegram connected: @%s", me.get("username", "Amadeus"))
            while True:
                try:
                    updates = await self.call("getUpdates", offset=offset, timeout=30, allowed_updates=["message"])
                    for update in updates:
                        try:
                            if "message" in update:
                                await self.handle(update["message"])
                        except (httpx.HTTPError, TelegramAPIError):
                            # Delivery may have succeeded. Advance the offset; do not duplicate sends.
                            log.warning("Telegram delivery uncertain; skipped automatic resend")
                        except Exception as error:
                            log.error("Telegram update failed (%s)", type(error).__name__)
                            if "message" in update:
                                with contextlib.suppress(Exception):
                                    await self.send(update["message"]["chat"]["id"], "Chưa xử lý được lượt này. Thử lại sau một lát.")
                        offset = update["update_id"] + 1
                        await self.store.set_runtime(key, str(offset))
                except (httpx.HTTPError, TelegramAPIError) as error:
                    code = error.code if isinstance(error, TelegramAPIError) else None
                    if code in {401, 404, 409}:
                        log.error("Telegram stopped (HTTP %s). Check token, webhook or another poller.", code)
                        return
                    log.warning("Telegram polling interrupted; reconnecting in 5 seconds")
                    await asyncio.sleep(5)
        except TelegramAPIError as error:
            log.error("Telegram startup failed (HTTP %s)", error.code)
        except httpx.HTTPError:
            log.error("Telegram connection unavailable at startup")
        finally:
            await self.client.aclose()
