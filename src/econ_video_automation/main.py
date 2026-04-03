from __future__ import annotations

import argparse

from .config import Settings
from .pipeline import run_once
from .scheduler import DailyScheduler


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Economic news to YouTube automation")
    parser.add_argument("--once", action="store_true", help="Run once immediately")
    parser.add_argument("--schedule", action="store_true", help="Run forever with daily scheduler")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    settings = Settings()

    if args.once:
        run_once(settings)
    elif args.schedule or settings.run_daily:
        DailyScheduler(settings).run_forever()
    else:
        run_once(settings)


if __name__ == "__main__":
    main()
