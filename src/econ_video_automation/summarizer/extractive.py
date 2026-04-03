from __future__ import annotations

from ..models import Article, Story
from .base import Summarizer


class ExtractiveSummarizer(Summarizer):
    def summarize(self, ranked_articles: list[Article]) -> list[Story]:
        stories: list[Story] = []
        for i, a in enumerate(ranked_articles, start=1):
            headline = a.title.strip()
            points = [
                (a.content or "세부 내용은 원문을 확인하세요.")[:160],
                f"출처: {a.publisher}",
            ]
            stories.append(
                Story(
                    id=f"story_{i}",
                    headline=headline,
                    key_points=points,
                    why_it_matters="시장 변동성과 정책 기대에 영향을 줄 수 있는 이슈입니다.",
                    source_article_ids=[a.id],
                )
            )
        return stories
