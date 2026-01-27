const generateButton = document.getElementById("generateScript");
const saveScriptButton = document.getElementById("saveScript");
const saveShortVideoButton = document.getElementById("saveShortVideo");
const saveLongVideoButton = document.getElementById("saveLongVideo");
const shortScriptField = document.getElementById("shortScript");
const longScriptField = document.getElementById("longScript");
const shortCaptionField = document.getElementById("shortCaptions");
const longCaptionField = document.getElementById("longCaptions");
const statusField = document.getElementById("status");

const setStatus = (message, tone = "info") => {
  statusField.textContent = message;
  statusField.dataset.tone = tone;
};

const setButtonsEnabled = (enabled) => {
  saveScriptButton.disabled = !enabled;
  saveShortVideoButton.disabled = !enabled;
  saveLongVideoButton.disabled = !enabled;
};

const downloadFromUrl = async (url, filename) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("다운로드에 실패했습니다.");
  }
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const loadScripts = async () => {
  setStatus("오늘의 NEWNEEK 데일리를 확인 중입니다...");
  generateButton.disabled = true;
  try {
    const response = await fetch("/api/script/today");
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "대본 생성에 실패했습니다.");
    }
    const data = await response.json();
    shortScriptField.value = data.shortScript;
    longScriptField.value = data.longScript;
    shortCaptionField.value = data.shortCaptions;
    longCaptionField.value = data.longCaptions;
    setButtonsEnabled(true);
    setStatus("대본 생성 완료. 저장 또는 렌더링을 진행하세요.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    generateButton.disabled = false;
  }
};

const downloadScripts = async () => {
  setStatus("대본 TXT 파일을 준비합니다...");
  try {
    const now = new Date();
    const date = now
      .toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })
      .replace(/-/g, "");
    await downloadFromUrl(
      `/api/script/today/download?type=short`,
      `short_script_${date}.txt`
    );
    await downloadFromUrl(
      `/api/script/today/download?type=long`,
      `long_script_${date}.txt`
    );
    setStatus("대본 TXT 다운로드 완료.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
};

const renderAndDownloadVideo = async (type) => {
  const label = type === "short" ? "숏폼" : "롱폼";
  setStatus(`${label} mp4를 생성 중입니다...`);
  saveShortVideoButton.disabled = true;
  saveLongVideoButton.disabled = true;
  try {
    const renderResponse = await fetch(`/api/render?type=${type}`, {
      method: "POST",
    });
    if (!renderResponse.ok) {
      const data = await renderResponse.json();
      throw new Error(data.error || "렌더링에 실패했습니다.");
    }
    const now = new Date();
    const date = now
      .toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })
      .replace(/-/g, "");
    await downloadFromUrl(
      `/api/render/download?type=${type}`,
      `${date}_${type.toUpperCase()}.mp4`
    );
    setStatus(`${label} mp4 다운로드 완료.`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setButtonsEnabled(true);
  }
};

generateButton.addEventListener("click", loadScripts);
saveScriptButton.addEventListener("click", downloadScripts);
saveShortVideoButton.addEventListener("click", () =>
  renderAndDownloadVideo("short")
);
saveLongVideoButton.addEventListener("click", () =>
  renderAndDownloadVideo("long")
);
