# NEWNEEK 데일리 자동화

Gmail로 들어온 NEWNEEK 데일리를 읽어 숏폼/롱폼 대본과 자막, mp4를 생성하는 로컬 웹 프로젝트입니다.

## 주요 기능
- Gmail에서 오늘(KST) 도착한 NEWNEEK 데일리 메일 1건을 읽습니다.
- 핵심 뉴스 3개를 추출해 숏폼/롱폼 대본을 생성합니다.
- TTS 음성을 생성하고 3장의 이미지를 조합해 영상과 자막을 렌더링합니다.
- 결과 파일을 `out/YYYYMMDD/` 폴더에 캐시합니다.

## 로컬 실행 방법

```bash
npm install
npm start
```

브라우저에서 아래 주소로 접속하세요.

```
http://localhost:3000
```

## 버튼 동작 확인 방법
1. **대본 생성** 버튼을 클릭합니다.
2. 화면에 숏폼/롱폼 대본 및 자막 라인이 표시되면 성공입니다.
3. **대본 TXT 저장** 버튼을 누르면 두 개의 TXT 파일이 다운로드됩니다.
4. **숏폼 MP4 저장** 또는 **롱폼 MP4 저장** 버튼을 누르면 렌더링 후 다운로드됩니다.

## Gmail 인증 설정
1. Google Cloud Console에서 OAuth 클라이언트를 만들고 `gmail_credentials.json`을 다운로드합니다.
2. 파일을 `secrets/gmail_credentials.json`에 저장하거나 `GMAIL_CREDENTIALS_JSON` 환경변수에 JSON 문자열로 넣습니다.
3. 아래 명령으로 토큰을 생성합니다.

```bash
npm run auth:gmail
```

생성된 토큰은 `secrets/gmail_token.json`에 저장됩니다.

## 환경변수
- `GMAIL_CREDENTIALS_JSON` 또는 `secrets/gmail_credentials.json`
- `GMAIL_TOKEN_JSON` 또는 `secrets/gmail_token.json`
- `GCP_TTS_SA_JSON` (Google Cloud TTS 서비스 계정 JSON)
- `PEXELS_API_KEY`
- `FONT_PATH` (기본: /System/Library/Fonts/AppleSDGothicNeo.ttc)
- `FFMPEG_PATH` (기본: /usr/local/bin/ffmpeg)
- `FFPROBE_PATH` (기본: /usr/local/bin/ffprobe)

## ffmpeg drawtext 체크
이 프로젝트는 자막을 `drawtext`로 번인합니다. `ffmpeg -filters` 출력에 `drawtext`가 없으면 아래 메시지가 표시됩니다.

```
ffmpeg drawtext 필터가 없습니다. 설치된 ffmpeg를 확인해 주세요.
```

## 출력 파일명 규칙
- `out/YYYYMMDD_short_script.txt`
- `out/YYYYMMDD_long_script.txt`
- `out/YYYYMMDD_SHORT.mp4`
- `out/YYYYMMDD_LONG.mp4`

## Git에 변경사항 Push하기

```bash
git status -sb
git add .
git commit -m "변경 요약 메시지"
git push origin <브랜치명>
```

현재 브랜치명은 `git status -sb` 또는 `git branch --show-current`로 확인할 수 있습니다.
