from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from .config import Settings
from .date_validator import DateValidator
from .image_manager import ImageManager
from .models import RunContext
from .news_fetcher.newsapi_fetcher import NewsAPIFetcher
from .news_fetcher.rss_fetcher import RSSFetcher
from .script_writer import ScriptWriter
from .source_logger import SourceLogger
from .story_ranker import StoryRanker
from .summarizer.extractive import ExtractiveSummarizer
from .summarizer.openai_summarizer import OpenAISummarizer
from .tts_generator import TTSGenerator
from .video_builder import VideoBuilder
from .youtube_uploader import YouTubeUploader, build_youtube_metadata

logger = logging.getLogger(__name__)


def _make_run_context(settings: Settings) -> RunContext:
    now_kst = datetime.now(ZoneInfo(settings.timezone))
    run_id = now_kst.strftime("%Y%m%d_%H%M%S")
    run_dir = settings.output_root / now_kst.strftime("%Y-%m-%d") / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    return RunContext(run_id=run_id, run_dir=run_dir, started_at=now_kst)


def run_once(settings: Settings | None = None) -> Path:
    settings = settings or Settings()
    logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))

    ctx = _make_run_context(settings)
    logger.info("Starting run_id=%s", ctx.run_id)
    errors: list[str] = []

    fetchers = []
    if settings.newsapi_key:
        fetchers.append(NewsAPIFetcher(settings.newsapi_key, settings.newsapi_query, settings.news_fetch_limit))
    if settings.rss_feeds:
        fetchers.append(RSSFetcher(settings.rss_feeds, settings.timezone))

    all_articles = []
    for fetcher in fetchers:
        try:
            all_articles.extend(fetcher.fetch())
        except Exception as e:
            msg = f"fetcher_failed:{fetcher.__class__.__name__}:{e}"
            logger.exception(msg)
            errors.append(msg)

    validator = DateValidator(settings.timezone)
    valid, rejected = validator.split_valid_invalid(all_articles)

    ranker = StoryRanker()
    selected = ranker.rank(valid, top_n=8)

    selected_ids = {a.id for a in selected}
    for a in valid:
        if a.id not in selected_ids:
            a.rejection_reason = a.rejection_reason or "low_relevance"
            rejected.append(a)

    ctx.selected_articles = selected
    ctx.rejected_articles = rejected

    if settings.summarizer_provider == "openai" and settings.openai_api_key:
        summarizer = OpenAISummarizer(settings.openai_api_key, settings.openai_model)
    else:
        summarizer = ExtractiveSummarizer()

    stories = summarizer.summarize(selected)

    script_writer = ScriptWriter()
    scripts = script_writer.build(stories)

    image_manager = ImageManager(settings.image_provider, settings.pexels_api_key)
    image_assets = image_manager.fetch_story_images(stories, ctx.run_dir / "images")

    tts = TTSGenerator(settings.tts_provider, settings.tts_language)
    shorts_audio = tts.synthesize(scripts.shorts_script, ctx.run_dir / "audio/shorts.mp3")
    long_audio = tts.synthesize(scripts.long_script, ctx.run_dir / "audio/long.mp3")

    builder = VideoBuilder()
    shorts_video = builder.build_shorts(
        image_assets,
        shorts_audio,
        scripts.subtitle_lines_shorts,
        ctx.run_dir / "videos/shorts.mp4",
    )
    long_video = builder.build_long_form(
        image_assets,
        long_audio,
        scripts.subtitle_lines_long,
        ctx.run_dir / "videos/long.mp4",
    )

    uploader = YouTubeUploader(settings)
    date_label = ctx.started_at.strftime("%Y-%m-%d")
    source_urls = [a.url for a in selected]
    meta_short = build_youtube_metadata(date_label, scripts.subtitle_lines_shorts[0], source_urls, is_shorts=True)
    meta_long = build_youtube_metadata(date_label, scripts.subtitle_lines_long[0], source_urls, is_shorts=False)

    up_short = uploader.upload(
        shorts_video.output_path,
        meta_short["title"],
        meta_short["description"],
        meta_short["tags"] + list(settings.youtube_default_tags),
        is_shorts=True,
    )
    up_long = uploader.upload(
        long_video.output_path,
        meta_long["title"],
        meta_long["description"],
        meta_long["tags"] + list(settings.youtube_default_tags),
        is_shorts=False,
    )

    source_logger = SourceLogger(ctx.run_dir)
    source_logger.write_article_logs(ctx.selected_articles, ctx.rejected_articles)
    source_logger.write_script_logs(scripts)
    source_logger.write_run_summary(
        ctx,
        uploads=[up_short, up_long],
        errors=errors,
        limited_coverage=len(selected) < 3,
    )

    logger.info("Run completed: %s", ctx.run_dir)
    return ctx.run_dir
