from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import requests

from ..models import Article
from ..utils.retry import with_retry
from .base import NewsFetcher


class NewsAPIFetcher(NewsFetcher):
    def __init__(self, api_key: str, query: str, limit: int = 50) -> None:
        self.api_key = api_key
        self.query = query
        self.limit = limit

    @with_retry(3)
    def fetch(self) -> list[Article]:
        since = datetime.now(timezone.utc) - timedelta(days=2)
        resp = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": self.query,
                "language": "en",
                "sortBy": "publishedAt",
                "from": since.isoformat(),
                "pageSize": min(100, self.limit),
                "apiKey": self.api_key,
            },
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        now = datetime.now(timezone.utc)

        articles: list[Article] = []
        for item in data.get("articles", []):
            published = item.get("publishedAt")
            if not published:
                continue
            articles.append(
                Article(
                    id=str(uuid4()),
                    title=item.get("title", "(untitled)"),
                    publisher=item.get("source", {}).get("name", "unknown"),
                    url=item.get("url", ""),
                    published_at=datetime.fromisoformat(published.replace("Z", "+00:00")),
                    retrieved_at=now,
                    content=item.get("description") or item.get("content"),
                )
            )
        return articles
