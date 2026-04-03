from __future__ import annotations

import re
from collections import defaultdict

from .models import Article


KEYWORDS = {
    "central_bank": ["fed", "ecb", "boj", "central bank", "interest rate", "rate hike", "rate cut"],
    "inflation": ["inflation", "cpi", "ppi", "employment", "jobless", "wage"],
    "markets": ["stock", "bond", "yield", "fx", "dollar", "won", "kospi", "s&p"],
    "policy": ["government", "policy", "treasury", "budget", "stimulus", "tariff"],
    "earnings": ["earnings", "guidance", "revenue", "profit"],
}


class StoryRanker:
    def rank(self, articles: list[Article], top_n: int = 8) -> list[Article]:
        deduped = self._deduplicate(articles)
        for a in deduped:
            a.relevance_score = self._score(a)
        return sorted(deduped, key=lambda x: x.relevance_score, reverse=True)[:top_n]

    def _score(self, article: Article) -> float:
        text = f"{article.title} {article.content or ''}".lower()
        score = 0.0
        for words in KEYWORDS.values():
            if any(w in text for w in words):
                score += 1.0
        # recency boost within today's/yesterday's set
        if "reuters" in article.publisher.lower() or "bloomberg" in article.publisher.lower() or "cnbc" in article.publisher.lower():
            score += 0.5
        return score

    def _deduplicate(self, articles: list[Article]) -> list[Article]:
        seen = defaultdict(list)
        result: list[Article] = []
        for article in articles:
            normalized = re.sub(r"[^a-z0-9가-힣 ]", "", article.title.lower())
            key = " ".join(normalized.split()[:8])
            if seen[key]:
                article.duplicate_of = seen[key][0].id
                article.rejection_reason = "duplicate_story"
                continue
            seen[key].append(article)
            result.append(article)
        return result
