from __future__ import annotations

import subprocess
from pathlib import Path

from .models import ImageAsset, VideoBuildResult


class VideoBuilder:
    def __init__(self, ffmpeg_bin: str = "ffmpeg") -> None:
        self.ffmpeg_bin = ffmpeg_bin

    def build_shorts(
        self,
        images: list[ImageAsset],
        audio_path: Path,
        subtitle_lines: list[str],
        output_path: Path,
    ) -> VideoBuildResult:
        return self._build(
            images=images,
            audio_path=audio_path,
            output_path=output_path,
            width=1080,
            height=1920,
            duration_per_slide=6,
            fmt="shorts",
        )

    def build_long_form(
        self,
        images: list[ImageAsset],
        audio_path: Path,
        subtitle_lines: list[str],
        output_path: Path,
    ) -> VideoBuildResult:
        return self._build(
            images=images,
            audio_path=audio_path,
            output_path=output_path,
            width=1920,
            height=1080,
            duration_per_slide=12,
            fmt="long",
        )

    def _build(
        self,
        images: list[ImageAsset],
        audio_path: Path,
        output_path: Path,
        width: int,
        height: int,
        duration_per_slide: int,
        fmt: str,
    ) -> VideoBuildResult:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        concat_file = output_path.parent / f"{fmt}_concat.txt"
        lines = []
        for image in images:
            lines.append(f"file '{image.path.resolve()}'")
            lines.append(f"duration {duration_per_slide}")
        if images:
            lines.append(f"file '{images[-1].path.resolve()}'")
        concat_file.write_text("\n".join(lines), encoding="utf-8")

        cmd = [
            self.ffmpeg_bin,
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_file),
            "-i",
            str(audio_path),
            "-vf",
            f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-shortest",
            str(output_path),
        ]
        subprocess.run(cmd, check=True)
        return VideoBuildResult(format=fmt, output_path=output_path, duration_sec=0.0)
