import { sanitizeScriptText, wrapLines } from "./utils.js";

const cleanLine = (line) => line.replace(/^[\s\-•·▶▲]+/, "").trim();

export const extractNewsPoints = (body) => {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const startIndex = lines.findIndex((line) => line.includes("뉴닉 데일리"));
  const candidateLines = lines.slice(startIndex >= 0 ? startIndex : 0);

  const bulletLines = candidateLines
    .filter((line) => /^[\s\-•·▶▲]/.test(line))
    .map(cleanLine)
    .filter((line) => line.length > 12);

  const picks = bulletLines.slice(0, 3);
  if (picks.length === 3) return picks;

  const longLines = candidateLines
    .map(cleanLine)
    .filter((line) => line.length > 20);
  const fallback = [...picks];
  for (const line of longLines) {
    if (fallback.length >= 3) break;
    if (!fallback.includes(line)) fallback.push(line);
  }

  while (fallback.length < 3) {
    fallback.push("오늘의 이슈를 간단히 정리합니다.");
  }
  return fallback.slice(0, 3);
};

const wrapCaptionLines = (script) => {
  const sentences = script
    .split(/(?<=[.!?]|다\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const result = [];
  for (const sentence of sentences) {
    const wrapped = wrapLines(sentence, 22);
    result.push(...wrapped);
  }
  return result;
};

export const buildShortScript = (points) => {
  const script = [
    "오늘의 뉴닉 데일리에서 꼭 알아야 할 세 가지 뉴스입니다.",
    `첫 번째 소식입니다. ${points[0]}`,
    `두 번째 뉴스입니다. ${points[1]}`,
    `세 번째 뉴스입니다. ${points[2]}`,
    "내일도 핵심만 빠르게 정리해 드리겠습니다.",
  ].join(" ");
  const cleaned = sanitizeScriptText(script);
  return {
    script: cleaned,
    captions: wrapCaptionLines(cleaned),
  };
};

export const buildLongScript = (points) => {
  const script = [
    "안녕하세요. 오늘의 뉴닉 데일리 핵심 뉴스 요약을 시작합니다.",
    `첫 번째 이슈입니다. ${points[0]} 자세한 배경과 영향을 함께 살펴봅니다.`,
    "이 변화가 시장과 일상에 어떤 의미를 주는지 차근히 정리합니다.",
    `두 번째 이슈입니다. ${points[1]} 관련 업계와 소비자에게 미치는 영향을 살펴봅니다.`,
    "필요한 대응 포인트와 주목할 지점도 함께 전해드립니다.",
    `세 번째 이슈입니다. ${points[2]} 국내외 흐름을 연결해 이해해 보겠습니다.`,
    "지금 알아두면 좋은 정리 포인트를 다시 확인해 주세요.",
    "마지막으로 내일도 꼭 필요한 뉴스만 빠르게 전해드리겠습니다.",
  ].join(" ");
  const cleaned = sanitizeScriptText(script);
  return {
    script: cleaned,
    captions: wrapCaptionLines(cleaned),
  };
};
