"""Published reference library and revision-checked editorial drafts.

Bundled records remain the baseline; SQLite/Turso stores only editorial changes.
Public methods never return drafts. This module never fetches source URLs.
"""
from __future__ import annotations

import json
import re
from typing import Literal
from urllib.parse import urlsplit

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator

from .archive_seed import PAGES, RELATIONS, TIMELINE
from .archive_images import ARCHIVE_IMAGE_PATHS

SLUG = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class Text(BaseModel):
    model_config = ConfigDict(extra="forbid")
    vi: str = Field(min_length=1, max_length=16000)
    en: str = Field(min_length=1, max_length=16000)

    @field_validator("vi", "en")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("Nội dung không được để trống.")
        return value.strip()


class Source(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=180)
    url: str = Field(max_length=500)
    locator: str = Field(min_length=1, max_length=240)

    @field_validator("url")
    @classmethod
    def safe_url(cls, value):
        parsed = urlsplit(value)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or any(c.isspace() for c in value):
            raise ValueError("Nguồn cần URL HTTPS hợp lệ, không chứa thông tin đăng nhập.")
        return value


class Page(BaseModel):
    model_config = ConfigDict(extra="forbid")
    slug: str = Field(max_length=70, pattern=SLUG)
    category: Literal["character", "concept", "organization", "place", "device", "event"]
    scope: Literal["shared", "sg", "sg0"]
    kind: Literal["canon", "interpretation"] = "canon"
    spoiler: int = Field(ge=0, le=2)
    title: Text
    summary: Text
    body: Text
    sources: list[Source] = Field(min_length=1, max_length=8)
    related: list[str] = Field(default_factory=list, max_length=12)
    image: str = Field(default="", max_length=200)
    ai_reference: bool = True

    @field_validator("image")
    @classmethod
    def bundled_image(cls, value):
        if value not in ARCHIVE_IMAGE_PATHS:
            raise ValueError("Ảnh phải thuộc danh sách tài nguyên đã đóng gói.")
        return value

    @field_validator("title", "summary")
    @classmethod
    def short_text(cls, value, info):
        limit = 120 if info.field_name == "title" else 500
        if max(len(value.vi), len(value.en)) > limit:
            raise ValueError(f"{info.field_name}: tối đa {limit} ký tự mỗi ngôn ngữ.")
        return value

    @field_validator("related")
    @classmethod
    def valid_links(cls, value):
        if len(set(value)) != len(value) or any(len(slug) > 70 or not re.fullmatch(SLUG, slug) for slug in value):
            raise ValueError("Liên kết hồ sơ không hợp lệ hoặc bị trùng.")
        return value


class Draft(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=0)
    page: Page


class Revision(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=0)


class Archives:
    def __init__(self, store):
        self.store = store
        self.seed = {p["slug"]: Page.model_validate(p).model_dump() for p in PAGES}

    async def records(self):
        async with self.store.db() as db:
            return [dict(row) for row in await (await db.execute("SELECT * FROM archive_pages ORDER BY slug LIMIT 500")).fetchall()]

    async def published(self, spoiler: int = 2, *, summaries: bool = False):
        pages = {slug: {k: v for k, v in p.items() if not summaries or k != "body"} for slug, p in self.seed.items()}
        # The public index does not read draft text or transfer article bodies.
        expression = "json_remove(published,'$.body')" if summaries else "published"
        async with self.store.db() as db:
            rows = await (await db.execute(f"SELECT slug,visibility,{expression} AS published FROM archive_pages WHERE visibility<>'seed' LIMIT 500")).fetchall()
        for row in rows:
            if row["visibility"] == "hidden":
                pages.pop(row["slug"], None)
            elif row["visibility"] == "published":
                pages[row["slug"]] = json.loads(row["published"]) if summaries else Page.model_validate_json(row["published"]).model_dump()
        return [p for p in pages.values() if p["spoiler"] <= spoiler]

    async def entry(self, slug, spoiler=2):
        async with self.store.db() as db:
            row = await (await db.execute("SELECT visibility,published FROM archive_pages WHERE slug=?", (slug,))).fetchone()
        page = self.seed.get(slug)
        if row:
            if row["visibility"] == "hidden":
                return None
            if row["visibility"] == "published":
                page = Page.model_validate_json(row["published"]).model_dump()
        return page if page and page["spoiler"] <= spoiler else None

    async def editorial(self):
        records = {r["slug"]: r for r in await self.records()}
        output = []
        for slug in sorted(set(self.seed) | set(records)):
            row = records.get(slug)
            output.append({"page": json.loads(row["draft"]) if row else self.seed[slug],
                           "revision": row["revision"] if row else 0,
                           "visibility": row["visibility"] if row else "seed",
                           "updated_at": row["updated_at"] if row else None})
        return output

    async def change(self, slug, revision, *, page=None, action="save"):
        async with self.store.db() as db:
            await db.execute("BEGIN IMMEDIATE")
            row = await (await db.execute("SELECT * FROM archive_pages WHERE slug=?", (slug,))).fetchone()
            if (row["revision"] if row else 0) != revision:
                raise HTTPException(409, "Hồ sơ đã thay đổi ở tab khác. Tải lại bản mới trước khi lưu.")
            if not row:
                count = (await (await db.execute("SELECT count(*) FROM archive_pages")).fetchone())[0]
                if count >= 500:
                    raise HTTPException(409, "Kho đã đủ 500 hồ sơ biên tập.")
                seed = self.seed.get(slug)
                if page is None and seed is None:
                    raise HTTPException(404, "Không tìm thấy hồ sơ.")
                draft = page or seed
                await db.execute("INSERT INTO archive_pages(slug,draft,visibility,revision) VALUES(?,?,?,0)",
                                 (slug, json.dumps(draft, ensure_ascii=False), "seed" if seed else "hidden"))
            draft = page if page is not None else json.loads(row["draft"]) if row else self.seed[slug]
            serialized = json.dumps(draft, ensure_ascii=False)
            if action == "publish":
                known = set(self.seed) | {r["slug"] for r in await (await db.execute("SELECT slug FROM archive_pages")).fetchall()}
                if any(s not in known or s == slug for s in draft["related"]):
                    raise HTTPException(422, "Liên kết liên quan phải trỏ tới hồ sơ đã tồn tại và khác chính nó.")
                await db.execute("UPDATE archive_pages SET published=?,visibility='published' WHERE slug=?", (serialized, slug))
            elif action == "unpublish":
                await db.execute("UPDATE archive_pages SET published=NULL,visibility='hidden' WHERE slug=?", (slug,))
            await db.execute("UPDATE archive_pages SET draft=?,revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE slug=?",
                             (serialized, slug))
            await db.commit()
        return {"revision": revision + 1, "ok": True}

    async def reference(self, slug, language):
        page = await self.entry(slug)
        if not page or not page["ai_reference"]:
            raise HTTPException(404, "Hồ sơ chưa xuất bản hoặc chưa bật tham khảo AI.")
        lang = "en" if language == "en" else "vi"
        return {"title": page["title"][lang], "scope": page["scope"], "kind": page["kind"],
                "content": page["body"][lang][:10000], "sources": page["sources"]}

def register_archives(app, store, owner):
    from fastapi import Depends, Query
    library = Archives(store)
    app.state.archives = library

    @app.get("/api/archives")
    async def pages(spoiler: int = Query(default=2, ge=0, le=2)):
        return {"pages": await library.published(spoiler, summaries=True), "timeline": [e for e in TIMELINE if e["spoiler"] <= spoiler],
                "relations": [r for r in RELATIONS if r["spoiler"] <= spoiler]}

    @app.get("/api/archives/{slug}")
    async def page(slug: str, spoiler: int = Query(default=2, ge=0, le=2)):
        result = await library.entry(slug, spoiler)
        if not result:
            raise HTTPException(404, "Không tìm thấy hồ sơ trong phạm vi spoiler đã chọn.")
        return result

    @app.get("/api/admin/archives")
    async def drafts(identity=Depends(owner)):
        return await library.editorial()

    @app.put("/api/admin/archives/{slug}")
    async def save(slug: str, body: Draft, identity=Depends(owner)):
        if slug != body.page.slug:
            raise HTTPException(422, "Slug trong URL và hồ sơ phải giống nhau.")
        await app.state.chat.check_rate("editor:" + identity)
        return await library.change(slug, body.revision, page=body.page.model_dump())

    @app.post("/api/admin/archives/{slug}/publish")
    async def publish(slug: str, body: Revision, identity=Depends(owner)):
        await app.state.chat.check_rate("editor:" + identity)
        return await library.change(slug, body.revision, action="publish")

    @app.post("/api/admin/archives/{slug}/unpublish")
    async def unpublish(slug: str, body: Revision, identity=Depends(owner)):
        await app.state.chat.check_rate("editor:" + identity)
        return await library.change(slug, body.revision, action="unpublish")

    return library
