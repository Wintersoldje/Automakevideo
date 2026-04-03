from __future__ import annotations

import json

import requests

from ..models import Article, Story
from .base import Summarizer


class OpenAISummarizer(Summarizer):
    def __init__(self, api_key: str, model: str) -> None:
        self.api_key = api_key
        self.model = model

    def summarize(self, ranked_articles: list[Article]) -> list[Story]:
        payload_articles = [
            {
                "id": a.id,
                "title": a.title,
                "publisher": a.publisher,
                "url": a.url,
                "published_at": a.published_at.isoformat(),
                "content": a.content,
            }
            for a in ranked_articles
        ]
        prompt = (
            "다음 경제 기사 목록을 한국어 뉴스 스크립트용 스토리로 요약하세요. "
            "반드시 사실 기반으로만 작성하고 story별 source_article_ids를 유지하세요."
        )
        resp = requests.post(
            "https://api.openai.com/v1/responses",
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            json={
                "model": self.model,
                "input": [
                    {"role": "system", "content": "당신은 경제 뉴스 에디터입니다."},
                    {"role": "user", "content": prompt + "\n" + json.dumps(payload_articles, ensure_ascii=False)},
                ],
                "text": {
                    "format": {
                        "type": "json_schema",
                        "name": "stories",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "stories": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "id": {"type": "string"},
                                            "headline": {"type": "string"},
                                            "key_points": {"type": "array", "items": {"type": "string"}},
                                            "why_it_matters": {"type": "string"},
                                            "source_article_ids": {"type": "array", "items": {"type": "string"}},
                                        },
                                        "required": ["id", "headline", "key_points", "why_it_matters", "source_article_ids"],
                                    },
                                }
                            },
                            "required": ["stories"],
                        },
                    }
                },
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        raw = data["output"][0]["content"][0]["text"]
        parsed = json.loads(raw)
        return [Story(**item) for item in parsed["stories"]]
