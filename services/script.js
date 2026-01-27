const fs = require("fs");
const path = require("path");
const { getTodayStamp, getOutDirForDate } = require("./storage");
const { getTodayNewneekMail } = require("./gmail");

const sanitizeText = (text) => {
  return text
    .replace(/[^0-9A-Za-z가-힣\s.,?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const splitSentences = (text) =>
  text
    .split(/\.|\?|\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const buildSummary = (mailText) => {
  const cleaned = sanitizeText(mailText);
  const lines = splitSentences(cleaned);
  const summary = lines.slice(0, 3);
  return summary.length ? summary : ["오늘의 뉴닉 데일리 뉴스 요약입니다"]; 
};

const toCaptionLines = (scriptText) => {
  const sentences = splitSentences(scriptText);
  const lines = [];
  sentences.forEach((sentence) => {
    if (sentence.length <= 24) {
      lines.push(sentence);
      return;
    }
    const words = sentence.split(" ");
    let current = "";
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (next.length > 24) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = next;
      }
    });
    if (current) lines.push(current);
  });
  return lines;
};

const buildScripts = (summaryLines) => {
  const [news1, news2, news3] = summaryLines;
  const shortScript = [
    "안녕하세요",
    "오늘의 뉴닉 데일리 핵심을 빠르게 전해드립니다",
    `첫째 ${news1}`,
    `둘째 ${news2}`,
    `셋째 ${news3}`,
    "마지막으로 오늘의 흐름을 체크해 주세요",
  ];

  const longScript = [
    "안녕하세요 오늘의 뉴닉 데일리 뉴스 요약입니다",
    "먼저 오늘의 핵심 이슈를 정리해보겠습니다",
    `첫 번째 뉴스는 ${news1} 입니다`,
    "이 내용이 시장과 생활에 어떤 영향을 주는지 살펴보겠습니다",
    `두 번째 뉴스는 ${news2} 입니다`,
    "관련 흐름과 배경을 짧게 짚어보겠습니다",
    `세 번째 뉴스는 ${news3} 입니다`,
    "이 이슈가 이어질 경우의 시나리오를 확인해보겠습니다",
    "마지막으로 오늘의 주요 포인트를 다시 정리했습니다",
    "다음 업데이트에서도 핵심만 빠르게 전달하겠습니다",
  ];

  return {
    shortScript: shortScript.map(sanitizeText).join(". ") + ".",
    longScript: longScript.map(sanitizeText).join(". ") + ".",
  };
};

const writeScriptFiles = (dateStamp, shortScript, longScript, summaryLines) => {
  const dir = getOutDirForDate(dateStamp);
  const shortPath = path.join(dir, `${dateStamp}_short_script.txt`);
  const longPath = path.join(dir, `${dateStamp}_long_script.txt`);
  const summaryPath = path.join(dir, `${dateStamp}_summary.json`);
  fs.writeFileSync(shortPath, shortScript);
  fs.writeFileSync(longPath, longScript);
  fs.writeFileSync(summaryPath, JSON.stringify(summaryLines, null, 2));
  return { shortPath, longPath, summaryPath };
};

const getTodayScripts = async () => {
  const dateStamp = getTodayStamp();
  const dir = getOutDirForDate(dateStamp);
  const shortPath = path.join(dir, `${dateStamp}_short_script.txt`);
  const longPath = path.join(dir, `${dateStamp}_long_script.txt`);
  const summaryPath = path.join(dir, `${dateStamp}_summary.json`);
  if (fs.existsSync(shortPath) && fs.existsSync(longPath)) {
    const shortScript = fs.readFileSync(shortPath, "utf8");
    const longScript = fs.readFileSync(longPath, "utf8");
    const summary = fs.existsSync(summaryPath)
      ? JSON.parse(fs.readFileSync(summaryPath, "utf8"))
      : [];
    return {
      dateStamp,
      summary,
      shortScript,
      longScript,
      shortCaptions: toCaptionLines(shortScript),
      longCaptions: toCaptionLines(longScript),
    };
  }

  const mailText = await getTodayNewneekMail(dateStamp);
  const summaryLines = buildSummary(mailText);
  while (summaryLines.length < 3) summaryLines.push("관련 뉴스 업데이트가 이어지고 있습니다");

  const { shortScript, longScript } = buildScripts(summaryLines);
  writeScriptFiles(dateStamp, shortScript, longScript, summaryLines);

  return {
    dateStamp,
    summary: summaryLines,
    shortScript,
    longScript,
    shortCaptions: toCaptionLines(shortScript),
    longCaptions: toCaptionLines(longScript),
  };
};

const getScriptDownload = async (type) => {
  if (type !== "short" && type !== "long") {
    throw new Error("type must be short or long");
  }
  const dateStamp = getTodayStamp();
  const dir = getOutDirForDate(dateStamp);
  const fileName = `${type}_script_${dateStamp}.txt`;
  const storedName = `${dateStamp}_${type}_script.txt`;
  const filePath = path.join(dir, storedName);
  if (!fs.existsSync(filePath)) {
    await getTodayScripts();
  }
  if (!fs.existsSync(filePath)) {
    throw new Error("script file not found");
  }
  return { filePath, fileName };
};

module.exports = {
  getTodayScripts,
  getScriptDownload,
  sanitizeText,
  toCaptionLines,
};
