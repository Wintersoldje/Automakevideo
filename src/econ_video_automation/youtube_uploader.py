from __future__ import annotations

import json
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from .config import Settings
from .models import UploadResult

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


class YouTubeUploader:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def upload(self, video_path: Path, title: str, description: str, tags: list[str], is_shorts: bool) -> UploadResult:
        try:
            service = self._build_service()
            request_body = {
                "snippet": {
                    "title": title,
                    "description": description,
                    "tags": tags,
                    "categoryId": self.settings.youtube_category_id,
                    "defaultLanguage": self.settings.youtube_channel_language,
                },
                "status": {"privacyStatus": self.settings.youtube_privacy_status},
            }
            media = MediaFileUpload(str(video_path), chunksize=-1, resumable=True)
            req = service.videos().insert(part="snippet,status", body=request_body, media_body=media)
            response = req.execute()
            vid = response.get("id")
            return UploadResult(
                format="shorts" if is_shorts else "long",
                status="uploaded",
                video_id=vid,
                video_url=f"https://www.youtube.com/watch?v={vid}",
            )
        except Exception as e:
            return UploadResult(format="shorts" if is_shorts else "long", status="failed", error=str(e))

    def _build_service(self):
        token_file = Path(self.settings.youtube_token_file)
        creds = None
        if token_file.exists():
            creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(self.settings.youtube_client_secret_file, SCOPES)
                creds = flow.run_local_server(port=0)
            token_file.parent.mkdir(parents=True, exist_ok=True)
            token_file.write_text(creds.to_json(), encoding="utf-8")
        return build("youtube", "v3", credentials=creds)


def build_youtube_metadata(date_label: str, short_summary: str, source_urls: list[str], is_shorts: bool) -> dict:
    suffix = "#Shorts" if is_shorts else ""
    title = f"[{date_label}] 오늘의 경제 뉴스 요약 {suffix}".strip()
    description = (
        f"{short_summary}\n\n"
        f"발행일(한국): {date_label}\n"
        "[면책] 본 영상은 정보 제공 목적이며 투자 조언이 아닙니다.\n\n"
        "[출처]\n" + "\n".join(source_urls)
    )
    hashtags = ["#경제뉴스", "#시장브리핑", "#오늘뉴스"]
    tags = ["경제", "뉴스", "금리", "인플레이션"]
    return {"title": title, "description": description, "hashtags": hashtags, "tags": tags}
