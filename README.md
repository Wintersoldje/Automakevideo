# NEWNEEK 자동화 영상 생성 데모

이 프로젝트는 정적 웹 페이지로 구성되어 있습니다.

## 로컬에서 웹사이트 열기

### 1) 파일을 직접 열기
- `index.html` 파일을 더블 클릭하면 브라우저에서 바로 열립니다.

### 2) 로컬 서버로 열기 (권장)
아래 명령으로 간단한 로컬 서버를 실행한 뒤 브라우저에서 접속합니다.

```bash
python -m http.server 8000
```

그 다음 브라우저에서 아래 주소로 접속합니다.

```
http://localhost:8000
```

서버를 종료하려면 터미널에서 `Ctrl + C`를 누르세요.

## Git에 변경사항 Push하기

변경한 파일을 Git에 반영하는 기본 흐름입니다.

```bash
git status -sb
git add .
git commit -m "변경 요약 메시지"
git push origin <브랜치명>
```

- 현재 브랜치명을 확인하려면 `git status -sb` 또는 `git branch --show-current`를 사용하세요.
