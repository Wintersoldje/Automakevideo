const statusMessage = document.getElementById("statusMessage");
const generateScriptButton = document.getElementById("generateScript");
const downloadScriptsButton = document.getElementById("downloadScripts");
const renderShortButton = document.getElementById("renderShort");
const renderLongButton = document.getElementById("renderLong");
const shortScriptField = document.getElementById("shortScript");
const longScriptField = document.getElementById("longScript");
const shortCaptionsField = document.getElementById("shortCaptions");
const longCaptionsField = document.getElementById("longCaptions");

const setStatus = (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#b91c1c" : "#1d4ed8";
  statusMessage.style.background = isError ? "#fee2e2" : "#eff6ff";
};

const enableActions = () => {
  downloadScriptsButton.disabled = false;
  renderShortButton.disabled = false;
  renderLongButton.disabled = false;
};

const fetchScripts = async () => {
  setStatus("Gmail에서 NEWNEEK 데일리를 읽는 중입니다...");
  const response = await fetch("/api/script/today");
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "대본 생성 실패");
  }
  shortScriptField.value = data.shortScript || "";
  longScriptField.value = data.longScript || "";
  shortCaptionsField.value = (data.shortCaptions || []).join("\n");
  longCaptionsField.value = (data.longCaptions || []).join("\n");
  enableActions();
  setStatus("대본 생성 완료. 저장 버튼을 눌러 파일을 받으세요.");
};

const downloadText = (type) => {
  window.location.href = `/api/script/today/download?type=${type}`;
};

const renderVideo = async (type) => {
  setStatus(`${type === "short" ? "숏폼" : "롱폼"} 영상 생성 중입니다...`);
  const response = await fetch(`/api/render?type=${type}`, { method: "POST" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "영상 생성 실패");
  }
  window.location.href = `/api/render/download?type=${type}`;
  setStatus("영상 다운로드가 시작되었습니다.");
};

generateScriptButton.addEventListener("click", async () => {
  try {
    await fetchScripts();
  } catch (error) {
    setStatus(error.message, true);
  }
});

downloadScriptsButton.addEventListener("click", () => {
  downloadText("short");
  setTimeout(() => downloadText("long"), 500);
});

renderShortButton.addEventListener("click", async () => {
  try {
    await renderVideo("short");
  } catch (error) {
    setStatus(error.message, true);
  }
});

renderLongButton.addEventListener("click", async () => {
  try {
    await renderVideo("long");
  } catch (error) {
    setStatus(error.message, true);
  }
});
