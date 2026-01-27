const generateButton = document.getElementById("generateScript");
const saveScriptButton = document.getElementById("saveScript");
const saveShortVideoButton = document.getElementById("saveShortVideo");
const saveLongVideoButton = document.getElementById("saveLongVideo");
const shortScriptField = document.getElementById("shortScript");
const longScriptField = document.getElementById("longScript");

const newneekSourceSummary = [
  "오늘의 뉴닉 메일에서 핵심 뉴스와 흐름을 정리",
  "주요 이슈의 배경과 영향이 함께 소개됨",
  "시청자가 바로 이해할 수 있도록 쉬운 문장으로 재구성",
];

const shortScriptTemplate = [
  "안녕하세요",
  "오늘의 뉴닉 요약을 전해드립니다",
  "핵심 뉴스는 경제와 일상 변화입니다",
  "배경을 간단히 살펴보면 정책과 소비 흐름이 연결됩니다",
  "지금 알아두면 도움이 되는 포인트를 짧게 정리했습니다",
  "마지막으로 내일 체크할 주제도 기억해 주세요",
];

const longScriptTemplate = [
  "안녕하세요",
  "오늘의 뉴닉 메일을 바탕으로 핵심 뉴스를 정리했습니다",
  "먼저 가장 중요한 이슈는 경제 흐름의 변화입니다",
  "정책 발표와 시장 반응이 동시에 나타나고 있습니다",
  "둘째로 생활과 밀접한 분야에서 새로운 움직임이 있습니다",
  "관련 업계는 빠르게 대응 전략을 준비하는 중입니다",
  "셋째로 글로벌 이슈가 국내 시장에도 영향을 줍니다",
  "환율과 공급망 흐름을 함께 살펴보는 것이 필요합니다",
  "오늘의 체크 포인트는 소비 트렌드와 규제 방향입니다",
  "시청자분들께서는 이번 주 일정에 맞춰 대응 계획을 세워 주세요",
  "다음 뉴스 업데이트에서도 핵심만 빠르게 전달하겠습니다",
  "감사합니다",
];

const joinLines = (lines) => lines.join("\n");

const sanitizeScript = (text) => text.replace(/[\n\r]+/g, "\n").trim();

const enableDownloads = () => {
  saveScriptButton.disabled = false;
  saveShortVideoButton.disabled = false;
  saveLongVideoButton.disabled = false;
};

const buildScript = () => {
  const shortScript = sanitizeScript(joinLines(shortScriptTemplate));
  const longScript = sanitizeScript(joinLines(longScriptTemplate));

  shortScriptField.value = shortScript;
  longScriptField.value = longScript;
  enableDownloads();
};

const downloadFile = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const downloadScriptText = () => {
  const scriptText = [
    "뉴닉 요약",
    joinLines(newneekSourceSummary),
    "",
    "숏폼 대본",
    shortScriptField.value,
    "",
    "롱폼 대본",
    longScriptField.value,
  ].join("\n");

  downloadFile("newneek_script.txt", scriptText, "text/plain");
};

const downloadVideo = (type) => {
  const description =
    type === "short"
      ? "숏폼 영상 파일 입니다"
      : "롱폼 영상 파일 입니다";
  const fileName = type === "short" ? "short_form.mp4" : "long_form.mp4";
  downloadFile(fileName, description, "video/mp4");
};

generateButton.addEventListener("click", buildScript);
saveScriptButton.addEventListener("click", downloadScriptText);
saveShortVideoButton.addEventListener("click", () => downloadVideo("short"));
saveLongVideoButton.addEventListener("click", () => downloadVideo("long"));
