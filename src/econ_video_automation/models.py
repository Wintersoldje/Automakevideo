from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


@dataclass
class Article:
    id: str
    title: str
    publisher: str
    url: str
    published_at: datetime
    retrieved_at: datetime
    content: str | None = None
    summary: str | None = None
    relevance_score: float = 0.0
    duplicate_of: str | None = None
    rejection_reason: str | None = None


@dataclass
class Story:
    id: str
    headline: str
    key_points: list[str]
    why_it_matters: str
    source_article_ids: list[str]


@dataclass
class ScriptBundle:
    shorts_script: str
    long_script: str
    subtitle_lines_shorts: list[str]
    subtitle_lines_long: list[str]
    statement_source_map: list[dict]


@dataclass
class ImageAsset:
    story_id: str
    path: Path
    source_url: str | None
    attribution: str
    is_fallback: bool


@dataclass
class VideoBuildResult:
    format: str
    output_path: Path
    duration_sec: float


@dataclass
class UploadResult:
    format: str
    status: str
    video_id: str | None = None
    video_url: str | None = None
    error: str | None = None


@dataclass
class RunContext:
    run_id: str
    run_dir: Path
    started_at: datetime
    selected_articles: list[Article] = field(default_factory=list)
    rejected_articles: list[Article] = field(default_factory=list)
