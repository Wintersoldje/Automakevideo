from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import feedparser

from ..models import Article
from ..utils.timezone import parse_to_tz
from .base import NewsFetcher


class RSSFetcher(NewsFetcher):
    def __init__(self, feeds: tuple[str, ...], tz_name: str = "Asia/Seoul") -> None:
        self.feeds = feeds
        self.tz_name = tz_name

    def fetch(self) -> list[Article]:
        now = datetime.now(timezone.utc)
        results: list[Article] = []
        for feed_url in self.feeds:
            parsed = feedparser.parse(feed_url)
            publisher = parsed.feed.get("title", "unknown-rss")
            for entry in parsed.entries:
                published = entry.get("published") or entry.get("updated")
                if not published:
                    continue
                try:
                    published_dt = parse_to_tz(published, self.tz_name)
                except Exception:
                    continue
                results.append(
                    Article(
                        id=str(uuid4()),
                        title=entry.get("title", "(untitled)"),
                        publisher=publisher,
                        url=entry.get("link", ""),
                        published_at=published_dt,
                        retrieved_at=now,
                        content=entry.get("summary"),
                    )
                )
        return results
