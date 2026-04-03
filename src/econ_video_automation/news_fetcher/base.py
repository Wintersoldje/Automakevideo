from __future__ import annotations

from abc import ABC, abstractmethod

from ..models import Article


class NewsFetcher(ABC):
    @abstractmethod
    def fetch(self) -> list[Article]:
        raise NotImplementedError
