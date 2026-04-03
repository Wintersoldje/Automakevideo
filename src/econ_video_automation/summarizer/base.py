from __future__ import annotations

from abc import ABC, abstractmethod

from ..models import Article, Story


class Summarizer(ABC):
    @abstractmethod
    def summarize(self, ranked_articles: list[Article]) -> list[Story]:
        raise NotImplementedError
