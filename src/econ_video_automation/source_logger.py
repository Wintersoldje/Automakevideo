from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from .models import Article, RunContext, ScriptBundle, UploadResult


class SourceLogger:
    def __init__(self, run_dir: Path) -> None:
        self.run_dir = run_dir
        self.logs_dir = run_dir / "logs"
        self.logs_dir.mkdir(parents=True, exist_ok=True)

    def write_article_logs(self, selected: list[Article], rejected: list[Article]) -> None:
        def serialize_article(a: Article) -> dict:
            return {
                "id": a.id,
                "title": a.title,
                "publisher": a.publisher,
                "url": a.url,
                "publication_datetime": a.published_at.isoformat(),
                "retrieval_timestamp": a.retrieved_at.isoformat(),
                "summary_used": a.summary,
                "relevance_score": a.relevance_score,
                "duplicate_of": a.duplicate_of,
                "rejection_reason": a.rejection_reason,
            }

        (self.logs_dir / "selected_articles.json").write_text(
            json.dumps([serialize_article(a) for a in selected], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        (self.logs_dir / "rejected_articles.json").write_text(
            json.dumps([serialize_article(a) for a in rejected], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def write_script_logs(self, script_bundle: ScriptBundle) -> None:
        (self.run_dir / "scripts").mkdir(parents=True, exist_ok=True)
        (self.run_dir / "scripts/shorts_script.txt").write_text(script_bundle.shorts_script, encoding="utf-8")
        (self.run_dir / "scripts/long_script.txt").write_text(script_bundle.long_script, encoding="utf-8")
        (self.logs_dir / "statement_source_map.json").write_text(
            json.dumps(script_bundle.statement_source_map, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def write_run_summary(
        self,
        ctx: RunContext,
        uploads: list[UploadResult],
        errors: list[str],
        limited_coverage: bool,
    ) -> None:
        summary = {
            "run_id": ctx.run_id,
            "run_started": ctx.started_at.isoformat(),
            "run_finished": datetime.utcnow().isoformat() + "Z",
            "selected_story_count": len(ctx.selected_articles),
            "rejected_story_count": len(ctx.rejected_articles),
            "limited_coverage": limited_coverage,
            "uploads": [u.__dict__ for u in uploads],
            "errors": errors,
        }
        (self.logs_dir / "run_summary.json").write_text(
            json.dumps(summary, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        readable = [
            f"Run ID: {ctx.run_id}",
            f"Selected: {len(ctx.selected_articles)} / Rejected: {len(ctx.rejected_articles)}",
            f"Limited coverage: {limited_coverage}",
            "Upload results:",
        ]
        readable.extend([f"- {u.format}: {u.status} ({u.video_url or u.error})" for u in uploads])
        if errors:
            readable.append("Errors:")
            readable.extend([f"- {e}" for e in errors])
        (self.logs_dir / "run_summary.txt").write_text("\n".join(readable), encoding="utf-8")
