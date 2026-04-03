from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    timezone: str = os.getenv("KST_TIMEZONE", "Asia/Seoul")
    output_root: Path = Path(os.getenv("OUTPUT_ROOT", "outputs"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    newsapi_key: str | None = os.getenv("NEWSAPI_KEY")
    newsapi_query: str = os.getenv(
        "NEWSAPI_QUERY",
        "(economy OR inflation OR interest rates OR central bank OR employment OR market)",
    )
    news_fetch_limit: int = int(os.getenv("NEWS_FETCH_LIMIT", "50"))
    rss_feeds: tuple[str, ...] = tuple(
        feed.strip() for feed in os.getenv("RSS_FEEDS", "").split(",") if feed.strip()
    )

    summarizer_provider: str = os.getenv("SUMMARIZER_PROVIDER", "extractive")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    tts_provider: str = os.getenv("TTS_PROVIDER", "gtts")
    tts_language: str = os.getenv("TTS_LANGUAGE", "ko")

    image_provider: str = os.getenv("IMAGE_PROVIDER", "none")
    pexels_api_key: str | None = os.getenv("PEXELS_API_KEY")

    youtube_client_secret_file: str = os.getenv(
        "YOUTUBE_CLIENT_SECRET_FILE", "secrets/client_secret.json"
    )
    youtube_token_file: str = os.getenv(
        "YOUTUBE_TOKEN_FILE", "secrets/youtube_token.json"
    )
    youtube_category_id: str = os.getenv("YOUTUBE_CATEGORY_ID", "25")
    youtube_privacy_status: str = os.getenv("YOUTUBE_PRIVACY_STATUS", "public")
    youtube_default_tags: tuple[str, ...] = tuple(
        tag.strip() for tag in os.getenv("YOUTUBE_DEFAULT_TAGS", "경제뉴스").split(",") if tag.strip()
    )
    youtube_channel_language: str = os.getenv("YOUTUBE_CHANNEL_LANGUAGE", "ko")

    run_daily: bool = os.getenv("RUN_DAILY", "true").lower() == "true"
    run_time_kst: str = os.getenv("RUN_TIME_KST", "07:00")
