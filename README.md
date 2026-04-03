# Economic News → YouTube Automation (KST 07:00 Daily)

A production-oriented Python automation pipeline that, every day at **07:00 Asia/Seoul**, does the following:

1. Collects major economic news.
2. Strictly keeps only articles published on **today or yesterday (KST)**.
3. Ranks and summarizes key stories in Korean.
4. Generates two videos from the same story set:
   - **YouTube Shorts** (`1080x1920`, <60s target)
   - **Long-form YouTube** (`1920x1080`, 5–10 min target)
5. Uploads both to YouTube automatically.
6. Stores full source/audit logs and artifacts.

---

## 1) Architecture proposal

### Pipeline modules

- `news_fetcher`
  - `NewsAPIFetcher`: pulls economic stories via NewsAPI (swappable).
  - `RSSFetcher`: pulls from trusted business RSS feeds (Reuters/CNBC configurable).
- `date_validator`
  - Converts publication timestamps to **Asia/Seoul**.
  - Strictly rejects anything outside `{today, yesterday}` in KST.
  - Rejects records with unverifiable dates.
- `story_ranker`
  - Deduplicates overlapping headlines.
  - Scores by macro relevance (rates/CPI/employment/markets/policy/earnings).
- `summarizer`
  - Provider abstraction:
    - `ExtractiveSummarizer` (default, no paid dependency)
    - `OpenAISummarizer` (optional, JSON-schema constrained output)
- `script_writer`
  - Builds Korean shorts + long scripts.
  - Produces `statement_source_map.json` for traceability.
- `image_manager`
  - Optional Pexels adapter.
  - Fallback template images if story-specific visuals unavailable.
- `tts_generator`
  - TTS provider abstraction (`gtts` default; easy to extend).
- `video_builder`
  - ffmpeg concat + scale/pad for shorts/long formats.
- `youtube_uploader`
  - Uses YouTube Data API v3 OAuth.
  - Uploads shorts + long-form; captures URL/status.
- `source_logger`
  - JSON + readable logs:
    - selected/rejected stories
    - rejection reasons
    - scripts and source map
    - upload status and errors
- `scheduler`
  - Continuous daily scheduler for 07:00 KST.

---

## 2) Project structure

```text
.
├── .env.example
├── pyproject.toml
├── requirements.txt
├── README.md
├── scripts/
│   └── run_daily.sh
├── examples/
│   └── source_log_example.json
└── src/econ_video_automation/
    ├── __init__.py
    ├── config.py
    ├── models.py
    ├── main.py
    ├── pipeline.py
    ├── scheduler.py
    ├── date_validator.py
    ├── story_ranker.py
    ├── script_writer.py
    ├── image_manager.py
    ├── tts_generator.py
    ├── video_builder.py
    ├── youtube_uploader.py
    ├── source_logger.py
    ├── news_fetcher/
    │   ├── base.py
    │   ├── newsapi_fetcher.py
    │   └── rss_fetcher.py
    ├── summarizer/
    │   ├── base.py
    │   ├── extractive.py
    │   └── openai_summarizer.py
    └── utils/
        ├── retry.py
        └── timezone.py
```

---

## 3) Setup

### Requirements
- Python 3.11+
- `ffmpeg` in PATH

### Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .
```

### Configure environment

```bash
cp .env.example .env
# then edit .env
```

You must fill:
- `NEWSAPI_KEY` (if using NewsAPI)
- `YOUTUBE_CLIENT_SECRET_FILE`, `YOUTUBE_TOKEN_FILE`
- Optional: `OPENAI_API_KEY`, `PEXELS_API_KEY`

---

## 4) Run

### Single run

```bash
python -m econ_video_automation.main --once
```

### Scheduler mode

```bash
python -m econ_video_automation.main --schedule
```

Default schedule is **07:00 KST** from `.env`:
- `KST_TIMEZONE=Asia/Seoul`
- `RUN_TIME_KST=07:00`

---

## 5) Cron deployment (recommended)

Because cron itself runs in server local time, set timezone explicitly:

```cron
# Run every day at 07:00 Asia/Seoul
CRON_TZ=Asia/Seoul
0 7 * * * /workspace/Automakevideo/scripts/run_daily.sh >> /workspace/Automakevideo/cron.log 2>&1
```

---

## 6) Strict date filtering policy (critical)

At runtime:
1. Current datetime is read in `Asia/Seoul`.
2. Every article publication timestamp is normalized to `Asia/Seoul`.
3. Only if `pub_date in {today_kst, yesterday_kst}` the article is kept.
4. Missing/unparseable dates are rejected.
5. Anything older than yesterday is rejected and logged (`too_old_or_out_of_range`).

---

## 7) Output artifacts (per run)

Each run creates:

```text
outputs/YYYY-MM-DD/YYYYMMDD_HHMMSS/
├── audio/
│   ├── shorts.mp3
│   └── long.mp3
├── images/
├── scripts/
│   ├── shorts_script.txt
│   └── long_script.txt
├── videos/
│   ├── shorts.mp4
│   └── long.mp4
└── logs/
    ├── selected_articles.json
    ├── rejected_articles.json
    ├── statement_source_map.json
    ├── run_summary.json
    └── run_summary.txt
```

---

## 8) YouTube metadata

Generated automatically:
- title
- description (includes digest date, disclaimer, source credits)
- hashtags/tags

Upload result captures:
- status
- video ID
- video URL
- errors (if any)

---

## 9) Swappable paid/free providers

Designed with adapters so providers can be replaced:
- Summarizer: `extractive` ↔ `openai`
- Images: `none`/fallback ↔ `pexels`
- TTS: `gtts` (default) with extension point for cloud providers
- News: NewsAPI and RSS combined; can add GDELT/Serp/other connectors

---

## 10) Credentials and security notes

Never commit real keys/tokens.
Store:
- YouTube OAuth secret JSON in `secrets/`
- token JSON in `secrets/` (auto-written after first auth)
- API keys in `.env`

Use server secret manager (GCP Secret Manager, AWS Secrets Manager, etc.) for production.

---

## 11) Example source log format

See:
- `examples/source_log_example.json`

This includes per-story source metadata, rejected reasons, upload URLs, and errors.

