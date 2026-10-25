from __future__ import annotations

import json
import asyncio
import sqlite3
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import aiosqlite


class Store:
    def __init__(self, path: Path, *, turso_url: str = "", turso_token: str = "", transport=None):
        self.path = path
        self.turso_url, self.turso_token, self.transport = turso_url, turso_token, transport

    @asynccontextmanager
    async def db(self):
        if self.turso_url:
            from .turso import Connection
            db = Connection(self.turso_url, self.turso_token, transport=self.transport)
            try:
                await db.execute("PRAGMA foreign_keys=ON")
                yield db
            finally:
                await db.close()
            return
        async with aiosqlite.connect(self.path, timeout=15) as db:
            db.row_factory = aiosqlite.Row
            await db.execute("PRAGMA foreign_keys=ON")
            yield db

    async def initialize(self):
        if not self.turso_url:
            self.path.parent.mkdir(parents=True, exist_ok=True)
        async with self.db() as db:
            if not self.turso_url:
                await db.execute("PRAGMA journal_mode=WAL")
            await db.executescript("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY, owner TEXT NOT NULL, title TEXT NOT NULL,
                    mode TEXT NOT NULL CHECK(mode IN ('amadeus','lab')),
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
                    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                );
                CREATE INDEX IF NOT EXISTS sessions_owner ON sessions(owner, updated_at);
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                    role TEXT NOT NULL CHECK(role IN ('user','assistant')), content TEXT NOT NULL,
                    metadata TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                );
                CREATE INDEX IF NOT EXISTS messages_session ON messages(session_id, id);
                CREATE TABLE IF NOT EXISTS completions (
                    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                    request_id TEXT NOT NULL, input TEXT NOT NULL, result TEXT NOT NULL,
                    PRIMARY KEY(session_id,request_id)
                );
                CREATE TABLE IF NOT EXISTS memories (
                    id TEXT PRIMARY KEY, owner TEXT NOT NULL, content TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                );
                CREATE INDEX IF NOT EXISTS memories_owner ON memories(owner);
                CREATE TABLE IF NOT EXISTS runtime (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS leases (key TEXT PRIMARY KEY, token TEXT NOT NULL, expires_at INTEGER NOT NULL);
                CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, window INTEGER NOT NULL, count INTEGER NOT NULL);
            """)
            columns = {row[1] for row in await (await db.execute("PRAGMA table_info(messages)")).fetchall()}
            if "metadata" not in columns:
                try:
                    await db.execute("ALTER TABLE messages ADD COLUMN metadata TEXT NOT NULL DEFAULT '{}'")
                except sqlite3.OperationalError:
                    columns = {row[1] for row in await (await db.execute("PRAGMA table_info(messages)")).fetchall()}
                    if "metadata" not in columns:
                        raise
            await db.commit()

    @asynccontextmanager
    async def lease(self, key: str, ttl: int):
        """Cross-instance lock; never keep a database transaction open during AI I/O."""
        token = str(uuid.uuid4())
        acquired = False
        for _ in range(20):
            async with self.db() as db:
                cursor = await db.execute("INSERT INTO leases VALUES(?,?,unixepoch()+?) ON CONFLICT(key) DO UPDATE SET token=excluded.token, expires_at=excluded.expires_at WHERE leases.expires_at<unixepoch()", (key, token, ttl))
                acquired = cursor.rowcount == 1
                await db.commit()
            if acquired:
                break
            await asyncio.sleep(0.25)
        if not acquired:
            raise TimeoutError("Cuộc hội thoại đang xử lý ở phiên khác. Thử lại sau vài giây.")
        try:
            yield
        finally:
            async with self.db() as db:
                await db.execute("DELETE FROM leases WHERE key=? AND token=?", (key, token))
                await db.commit()

    async def allow_request(self, key: str, limit: int = 12) -> bool:
        async with self.db() as db:
            cursor = await db.execute("INSERT INTO rate_limits VALUES(?,unixepoch()/60,1) ON CONFLICT(key) DO UPDATE SET window=excluded.window, count=CASE WHEN rate_limits.window=excluded.window THEN rate_limits.count+1 ELSE 1 END RETURNING count", (key,))
            count = (await cursor.fetchone())[0]
            await db.execute("DELETE FROM rate_limits WHERE window < unixepoch()/60-2")
            await db.commit()
        return count <= limit

    async def sessions(self, owner: str) -> list[dict]:
        async with self.db() as db:
            cursor = await db.execute("SELECT * FROM sessions WHERE owner=? ORDER BY updated_at DESC, rowid DESC LIMIT 100", (owner,))
            return [dict(row) for row in await cursor.fetchall()]

    async def session(self, owner: str, sid: str) -> dict | None:
        async with self.db() as db:
            row = await (await db.execute("SELECT * FROM sessions WHERE id=? AND owner=?", (sid, owner))).fetchone()
            return dict(row) if row else None

    async def create_session(self, owner: str, mode: str) -> dict:
        sid = str(uuid.uuid4())
        async with self.db() as db:
            await db.execute("BEGIN IMMEDIATE")
            count = (await (await db.execute("SELECT count(*) FROM sessions WHERE owner=?", (owner,))).fetchone())[0]
            if count >= 100:
                raise ValueError("Bạn đã có 100 cuộc hội thoại. Xóa bớt một cuộc trước khi tạo mới.")
            await db.execute("INSERT INTO sessions(id,owner,title,mode) VALUES(?,?,?,?)", (sid, owner, "Cuộc trò chuyện mới", mode))
            await db.commit()
        return await self.session(owner, sid)

    async def messages(self, sid: str, *, limit: int = 400) -> list[dict]:
        async with self.db() as db:
            rows = await (await db.execute("SELECT * FROM messages WHERE session_id=? ORDER BY id DESC LIMIT ?", (sid, limit))).fetchall()
            messages = []
            for row in reversed(rows):
                item = dict(row)
                metadata = json.loads(item.pop("metadata", "{}"))
                item.update({"knowledge": metadata.get("knowledge", []), "sources": metadata.get("sources", [])})
                messages.append(item)
            return messages

    async def completed(self, sid: str, rid: str) -> dict | None:
        async with self.db() as db:
            row = await (await db.execute("SELECT input,result FROM completions WHERE session_id=? AND request_id=?", (sid, rid))).fetchone()
            return {"input": row[0], "result": json.loads(row[1])} if row else None

    async def commit_turn(self, sid: str, rid: str, text: str, result: dict):
        async with self.db() as db:
            await db.execute("BEGIN IMMEDIATE")
            await db.execute("INSERT INTO completions VALUES(?,?,?,?)", (sid, rid, text, json.dumps(result, ensure_ascii=False)))
            metadata = json.dumps({"knowledge": result.get("knowledge", []), "sources": result.get("sources", [])}, ensure_ascii=False)
            await db.executemany("INSERT INTO messages(session_id,role,content,metadata) VALUES(?,?,?,?)", [
                (sid, "user", text, "{}"), (sid, "assistant", result["text"], metadata),
            ])
            title = " ".join(text.split())[:64]
            await db.execute("UPDATE sessions SET title=CASE WHEN title='Cuộc trò chuyện mới' THEN ? ELSE title END, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", (title, sid))
            await db.commit()

    async def delete_session(self, owner: str, sid: str):
        async with self.db() as db:
            await db.execute("DELETE FROM sessions WHERE id=? AND owner=?", (sid, owner))
            await db.commit()

    async def memories(self, owner: str) -> list[dict]:
        async with self.db() as db:
            rows = await (await db.execute("SELECT * FROM memories WHERE owner=? ORDER BY created_at,id", (owner,))).fetchall()
            return [dict(row) for row in rows]

    async def remember(self, owner: str, content: str) -> dict:
        mid = str(uuid.uuid4())
        async with self.db() as db:
            await db.execute("BEGIN IMMEDIATE")
            count = (await (await db.execute("SELECT count(*) FROM memories WHERE owner=?", (owner,))).fetchone())[0]
            if count >= 50:
                raise ValueError("Bộ nhớ có tối đa 50 ghi chú. Xóa bớt trước khi thêm.")
            await db.execute("INSERT INTO memories(id,owner,content) VALUES(?,?,?)", (mid, owner, content))
            await db.commit()
        return {"id": mid, "content": content}

    async def forget(self, owner: str, mid: str):
        async with self.db() as db:
            await db.execute("DELETE FROM memories WHERE id=? AND owner=?", (mid, owner))
            await db.commit()

    async def get_runtime(self, key: str, default: str = "") -> str:
        async with self.db() as db:
            row = await (await db.execute("SELECT value FROM runtime WHERE key=?", (key,))).fetchone()
            return row[0] if row else default

    async def set_runtime(self, key: str, value: str):
        async with self.db() as db:
            await db.execute("INSERT INTO runtime VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, value))
            await db.commit()
