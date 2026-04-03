from __future__ import annotations

from pathlib import Path

import requests
from PIL import Image, ImageDraw

from .models import ImageAsset, Story


class ImageManager:
    def __init__(self, provider: str, pexels_api_key: str | None) -> None:
        self.provider = provider
        self.pexels_api_key = pexels_api_key

    def fetch_story_images(self, stories: list[Story], out_dir: Path) -> list[ImageAsset]:
        out_dir.mkdir(parents=True, exist_ok=True)
        assets: list[ImageAsset] = []
        for story in stories:
            if self.provider == "pexels" and self.pexels_api_key:
                asset = self._fetch_pexels(story, out_dir)
            else:
                asset = None
            if not asset:
                asset = self._create_fallback(story, out_dir)
            assets.append(asset)
        return assets

    def _fetch_pexels(self, story: Story, out_dir: Path) -> ImageAsset | None:
        resp = requests.get(
            "https://api.pexels.com/v1/search",
            headers={"Authorization": self.pexels_api_key or ""},
            params={"query": story.headline, "per_page": 1},
            timeout=20,
        )
        if resp.status_code != 200:
            return None
        photos = resp.json().get("photos", [])
        if not photos:
            return None
        photo = photos[0]
        image_url = photo["src"]["large"]
        image_data = requests.get(image_url, timeout=20)
        image_data.raise_for_status()

        out_path = out_dir / f"{story.id}.jpg"
        out_path.write_bytes(image_data.content)
        return ImageAsset(
            story_id=story.id,
            path=out_path,
            source_url=photo.get("url"),
            attribution=f"Pexels / {photo.get('photographer', 'unknown')}",
            is_fallback=False,
        )

    def _create_fallback(self, story: Story, out_dir: Path) -> ImageAsset:
        out_path = out_dir / f"{story.id}_fallback.png"
        img = Image.new("RGB", (1920, 1080), color=(24, 28, 39))
        draw = ImageDraw.Draw(img)
        draw.text((80, 140), "ECONOMIC NEWS", fill=(170, 190, 255))
        draw.text((80, 260), story.headline[:80], fill=(255, 255, 255))
        draw.text((80, 340), "출처는 설명란 참조", fill=(190, 190, 190))
        img.save(out_path)
        return ImageAsset(
            story_id=story.id,
            path=out_path,
            source_url=None,
            attribution="Fallback template",
            is_fallback=True,
        )
