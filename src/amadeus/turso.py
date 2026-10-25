"""Small async SQLite connection adapter for Turso's documented Hrana HTTP API.

Connections retain the server baton so BEGIN/COMMIT and bound parameters have
the same semantics as local SQLite. Streams are explicitly closed on exit.
"""
from __future__ import annotations

import base64
import contextlib
import sqlite3
from urllib.parse import urlsplit, urlunsplit

import httpx


def database_url(url: str) -> str:
    parts = urlsplit(url)
    if parts.scheme not in {"libsql", "turso", "https"} or not parts.hostname or parts.username or parts.password or parts.query or parts.fragment:
        raise ValueError("TURSO_DATABASE_URL phải là URL libsql:// hoặc https://, không chứa token.")
    return urlunsplit(("https", parts.netloc, parts.path.rstrip("/") + "/v2/pipeline", "", ""))


def encode(value):
    if value is None:
        return {"type": "null"}
    if isinstance(value, int):
        return {"type": "integer", "value": str(value)}
    if isinstance(value, float):
        return {"type": "float", "value": value}
    if isinstance(value, bytes):
        return {"type": "blob", "base64": base64.b64encode(value).decode()}
    return {"type": "text", "value": str(value)}


def decode(value):
    kind = value["type"]
    if kind == "null":
        return None
    if kind == "integer":
        return int(value["value"])
    if kind == "blob":
        return base64.b64decode(value["base64"])
    return value["value"]


class Row(dict):
    def __getitem__(self, key):
        return list(self.values())[key] if isinstance(key, int) else super().__getitem__(key)


class Cursor:
    def __init__(self, result):
        names = [col["name"] for col in result.get("cols", [])]
        self.rows = [Row(zip(names, map(decode, row))) for row in result.get("rows", [])]
        self.rowcount = result.get("affected_row_count", 0)

    async def fetchone(self):
        return self.rows[0] if self.rows else None

    async def fetchall(self):
        return self.rows


class Connection:
    def __init__(self, url, token, *, transport=None):
        self.url = database_url(url)
        self.client = httpx.AsyncClient(headers={"Authorization": "Bearer " + token}, timeout=15, transport=transport)
        self.baton = None
        self.transaction = False

    async def request(self, request):
        try:
            response = await self.client.post(self.url, json={"baton": self.baton, "requests": [request]})
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise sqlite3.OperationalError("Không kết nối được database cloud.") from exc
        self.baton = data["baton"]
        if data.get("base_url"):
            self.url = database_url(data["base_url"])
        result = data["results"][0]
        if result["type"] == "error":
            info = result["error"]
            kind = sqlite3.IntegrityError if info.get("code", "").startswith("SQLITE_CONSTRAINT") else sqlite3.OperationalError
            raise kind(info.get("message", "Database query failed"))
        return result["response"]

    async def execute(self, sql, args=()):
        result = await self.request({"type": "execute", "stmt": {"sql": sql, "args": [encode(value) for value in args], "want_rows": True}})
        if sql.lstrip().upper().startswith("BEGIN"):
            self.transaction = True
        if sql.lstrip().upper() in {"COMMIT", "ROLLBACK"}:
            self.transaction = False
        return Cursor(result.get("result", {}))

    async def executemany(self, sql, rows):
        for args in rows:
            await self.execute(sql, args)

    async def executescript(self, sql):
        await self.request({"type": "sequence", "sql": sql})

    async def commit(self):
        if self.transaction:
            await self.execute("COMMIT")

    async def close(self):
        try:
            if self.baton:
                with contextlib.suppress(Exception):
                    await self.request({"type": "close"})
        finally:
            await self.client.aclose()
