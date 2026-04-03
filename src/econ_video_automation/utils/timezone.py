from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from dateutil import parser


def now_in_tz(tz_name: str) -> datetime:
    return datetime.now(ZoneInfo(tz_name))


def parse_to_tz(value: str | datetime, tz_name: str) -> datetime:
    if isinstance(value, datetime):
        dt = value
    else:
        dt = parser.parse(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))
    return dt.astimezone(ZoneInfo(tz_name))


def is_today_or_yesterday_in_kst(published: datetime, kst_now: datetime) -> bool:
    pub_date = published.date()
    today = kst_now.date()
    yesterday = (kst_now - timedelta(days=1)).date()
    return pub_date in {today, yesterday}
