# NEWNEEK 데일리 자동화 (대본/음성/자막/MP4)

오늘 도착한 NEWNEEK 데일리 메일을 읽어 **숏폼/롱폼 대본과 자막, TTS 음성, 이미지 슬라이드, 자막 번인 mp4**를 자동 생성하는 웹 프로젝트입니다.

## 주요 기능
- Gmail에서 오늘 도착한 NEWNEEK 데일리 메일 1건을 읽어 핵심 뉴스 3개 추출
- 숏폼(1분 이내) / 롱폼(5~6분) 대본 생성 + 자막용 라인브레이크 버전 생성
- Google Cloud TTS로 음성 생성
- Pexels 이미지 3장(실패 시 ffmpeg 컬러 배경 fallback) 수집
- ffmpeg로 이미지 슬라이드 + 음성 + drawtext 자막 번인 mp4 생성

## 사전 준비
- Node.js 18 이상
- ffmpeg / ffprobe (Homebrew 설치)
- Google Gmail API OAuth 토큰 발급
- Google Cloud TTS 서비스 계정

## 설치
```bash
npm install
```

## 환경 변수
`.env` 파일을 만들어 다음 값을 설정하세요.

```bash
# Gmail OAuth
GMAIL_CREDENTIALS_JSON='{"installed":{...}}'
GMAIL_TOKEN_JSON='{"access_token":"...","refresh_token":"..."}'

# Google Cloud TTS 서비스 계정 JSON
GCP_TTS_SA_JSON='{"type":"service_account",...}'

# Pexels API
PEXELS_API_KEY="your_pexels_key"

# ffmpeg 경로 (macOS Homebrew 기준)
FFMPEG_PATH=/usr/local/bin/ffmpeg
FFPROBE_PATH=/usr/local/bin/ffprobe

# 한글 폰트 경로
FONT_PATH=/System/Library/Fonts/AppleSDGothicNeo.ttc
```

- credentials/token을 파일로 저장하고 싶다면 `secrets/gmail_credentials.json`, `secrets/gmail_token.json`를 사용해도 됩니다.

## 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`에 접속하세요.

## 버튼 동작 확인 방법
1. **대본 생성**: Gmail에서 오늘 NEWNEEK 데일리를 읽고 숏폼/롱폼 대본 및 자막 라인브레이크를 화면에 표시합니다.
2. **대본 TXT 저장**: `short_script_YYYYMMDD.txt`, `long_script_YYYYMMDD.txt` 두 파일을 다운로드합니다.
3. **숏폼 MP4 저장**: 숏폼 영상 렌더링 후 `YYYYMMDD_SHORT.mp4` 다운로드.
4. **롱폼 MP4 저장**: 롱폼 영상 렌더링 후 `YYYYMMDD_LONG.mp4` 다운로드.

## API 요약
- `GET /api/script/today`
- `GET /api/script/today/download?type=short|long`
- `POST /api/render?type=short|long`
- `GET /api/render/download?type=short|long`

## ffmpeg drawtext 필터 체크
- 렌더링 시작 시 `ffmpeg -filters` 출력에서 drawtext 필터 유무를 확인합니다.
- drawtext가 없으면 다음과 같은 에러 메시지를 반환합니다.
  - `ffmpeg drawtext 필터가 없습니다. ffmpeg 빌드 옵션을 확인하거나 drawtext 지원 버전을 설치해 주세요.`

## 출력 파일 규칙
- `out/YYYYMMDD_short_script.txt`
- `out/YYYYMMDD_long_script.txt`
- `out/YYYYMMDD_SHORT.mp4`
- `out/YYYYMMDD_LONG.mp4`

## 캐싱
- 같은 날짜로 요청하면 `out/YYYYMMDD` 폴더의 결과를 재사용합니다.

## 참고
- subtitles 필터를 사용하지 않고 **drawtext로 자막 번인**을 기본값으로 처리했습니다.
- 대본은 특수문자와 이모지를 최소화했습니다.
