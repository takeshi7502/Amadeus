from __future__ import annotations

import json
import math
import re
import unicodedata
from collections import Counter
from pathlib import Path

RESOURCES = Path(__file__).parent / "resources"
STOP = set("va la cua cac mot nhung cho voi trong khi thi co khong duoc toi cau ban nay do ve o a di nhu the nao gi da dang se hay at the of and is to in you i".split())


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text.casefold().replace("đ", "d"))
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def tokens(text: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9]+", normalize(text)) if t not in STOP and len(t) > 1]


class KnowledgeBase:
    """Small local BM25 index; no embedding key or runtime web scrape required."""

    def __init__(self, path: Path = RESOURCES / "canon.json"):
        data = json.loads(path.read_text(encoding="utf-8"))
        self.sources = data["sources"]
        self.entries = data["entries"]
        self.core = data["core"]
        self.counts = [Counter(tokens(" ".join([e["title"], " ".join(e["tags"])]) * 3 + " " + e["content"])) for e in self.entries]
        self.lengths = [sum(c.values()) for c in self.counts]
        self.average = sum(self.lengths) / len(self.lengths)
        self.df = Counter(t for counts in self.counts for t in counts)

    def search(self, query: str, limit: int = 5) -> list[dict]:
        terms = set(tokens(query))
        results = []
        for entry, counts, length in zip(self.entries, self.counts, self.lengths):
            score = 0.0
            for term in terms:
                tf = counts[term]
                if tf:
                    idf = math.log(1 + (len(self.entries) - self.df[term] + 0.5) / (self.df[term] + 0.5))
                    score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * length / self.average))
            if score > 0:
                results.append((score, entry))
        return [entry for _, entry in sorted(results, key=lambda item: item[0], reverse=True)[:limit]]

    def public_entry(self, entry: dict) -> dict:
        return {**entry, "sources": [self.sources[s] for s in entry["source_ids"]]}
