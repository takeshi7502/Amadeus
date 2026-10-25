"""Explicit, bounded web lookup. Only the current query leaves the application."""
from __future__ import annotations

import asyncio
from urllib.parse import urlsplit

from ddgs import DDGS


def safe_url(value: str) -> bool:
    try:
        url = urlsplit(value)
        return url.scheme in {"http", "https"} and bool(url.hostname) and not url.username and not url.password
    except ValueError:
        return False


def _lookup(query: str) -> list[dict]:
    results = DDGS(timeout=8).text(query[:500], max_results=4, backend="duckduckgo")
    sources = []
    for item in results:
        url = str(item.get("href", ""))
        if safe_url(url) and not any(s["url"] == url for s in sources):
            sources.append({"title": str(item.get("title", ""))[:180], "url": url,
                            "snippet": str(item.get("body", ""))[:1200]})
    return sources[:4]


async def search_web(query: str) -> list[dict]:
    # The worker has its own network timeout; callers never wait indefinitely.
    return await asyncio.wait_for(asyncio.to_thread(_lookup, query), timeout=15)
