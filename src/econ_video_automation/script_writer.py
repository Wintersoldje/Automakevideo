from __future__ import annotations

from .models import ScriptBundle, Story


class ScriptWriter:
    def build(self, stories: list[Story]) -> ScriptBundle:
        shorts_lines: list[str] = ["오늘의 핵심 경제 뉴스 브리핑입니다."]
        long_lines: list[str] = ["안녕하세요. 오늘과 어제 발표된 경제 이슈를 정리해드립니다."]
        map_rows: list[dict] = []

        for s in stories:
            short_line = f"{s.headline}. {s.key_points[0]}"
            long_line = (
                f"[{s.headline}] "
                f"핵심: {' '.join(s.key_points)} "
                f"의미: {s.why_it_matters}"
            )
            shorts_lines.append(short_line)
            long_lines.append(long_line)
            map_rows.append(
                {
                    "statement": long_line,
                    "story_id": s.id,
                    "source_article_ids": s.source_article_ids,
                }
            )

        shorts_script = "\n".join(shorts_lines)
        long_script = "\n\n".join(long_lines)

        return ScriptBundle(
            shorts_script=shorts_script,
            long_script=long_script,
            subtitle_lines_shorts=shorts_lines,
            subtitle_lines_long=long_lines,
            statement_source_map=map_rows,
        )
