from __future__ import annotations

from .models import Article
from .utils.timezone import is_today_or_yesterday_in_kst, now_in_tz


class DateValidator:
    def __init__(self, tz_name: str = "Asia/Seoul") -> None:
        self.tz_name = tz_name

    def split_valid_invalid(self, articles: list[Article]) -> tuple[list[Article], list[Article]]:
        now_kst = now_in_tz(self.tz_name)
        valid: list[Article] = []
        rejected: list[Article] = []
        for article in articles:
            try:
                published_kst = article.published_at.astimezone(now_kst.tzinfo)
            except Exception:
                article.rejection_reason = "missing_or_invalid_date"
                rejected.append(article)
                continue

            if is_today_or_yesterday_in_kst(published_kst, now_kst):
                article.published_at = published_kst
                valid.append(article)
            else:
                article.rejection_reason = "too_old_or_out_of_range"
                rejected.append(article)
        return valid, rejected
