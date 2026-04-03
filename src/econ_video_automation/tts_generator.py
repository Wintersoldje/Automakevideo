from __future__ import annotations

from pathlib import Path

from gtts import gTTS


class TTSGenerator:
    def __init__(self, provider: str = "gtts", language: str = "ko") -> None:
        self.provider = provider
        self.language = language

    def synthesize(self, text: str, output_path: Path) -> Path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        if self.provider == "gtts":
            tts = gTTS(text=text, lang=self.language)
            tts.save(str(output_path))
            return output_path
        raise ValueError(f"Unsupported TTS provider: {self.provider}")
