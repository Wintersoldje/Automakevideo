from __future__ import annotations

import time
from datetime import datetime
from zoneinfo import ZoneInfo

from .config import Settings
from .pipeline import run_once


class DailyScheduler:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def run_forever(self) -> None:
        tz = ZoneInfo(self.settings.timezone)
        target_hour, target_minute = [int(v) for v in self.settings.run_time_kst.split(":")]

        while True:
            now = datetime.now(tz)
            if now.hour == target_hour and now.minute == target_minute:
                run_once(self.settings)
                time.sleep(65)
            time.sleep(20)
