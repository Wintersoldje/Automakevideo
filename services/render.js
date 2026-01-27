const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");
const { getTodayScripts } = require("./script");
const { getTodayStamp, getOutDirForDate } = require("./storage");
const { synthesizeSpeech } = require("./tts");
const { getImagesForNews } = require("./pexels");
const {
  getFfmpegPath,
  checkFilterAvailable,
  getAudioDuration,
} = require("./ffmpeg");

const FONT_PATH = process.env.FONT_PATH || "/System/Library/Fonts/AppleSDGothicNeo.ttc";

const buildDrawtextFilters = (captions, totalDuration) => {
  const perLine = totalDuration / Math.max(captions.length, 1);
  return captions
    .map((line, idx) => {
      const start = (idx * perLine).toFixed(2);
      const end = ((idx + 1) * perLine).toFixed(2);
      const safeText = line.replace(/[:\\']/g, " ");
      return `drawtext=fontfile=${FONT_PATH}:text='${safeText}':fontcolor=white:fontsize=48:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-180:enable='between(t,${start},${end})'`;
    })
    .join(",");
};

const downloadImage = async (url, targetPath) => {
  if (url.startsWith("assets/")) {
    const localPath = path.join(__dirname, "..", url);
    fs.copyFileSync(localPath, targetPath);
    return targetPath;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Pexels 이미지 다운로드 실패");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(targetPath, buffer);
  return targetPath;
};

const createSlideshow = (images, duration, outputPath, size) => {
  const ffmpeg = getFfmpegPath();
  const perImage = duration / images.length;
  const args = [];
  images.forEach((image) => {
    args.push("-loop", "1", "-t", String(perImage), "-i", image);
  });
  const filter = images
    .map((_, idx) => `[${idx}:v]scale=${size},format=yuv420p[v${idx}]`)
    .join(";")
    .concat(";" + images.map((_, idx) => `[v${idx}]`).join(""))
    .concat(`concat=n=${images.length}:v=1:a=0,format=yuv420p[v]`);

  args.push(
    "-filter_complex",
    filter,
    "-map",
    "[v]",
    "-r",
    "30",
    "-y",
    outputPath,
  );
  const result = spawnSync(ffmpeg, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("슬라이드쇼 영상 생성 실패");
  }
};

const mergeAudioAndCaptions = (videoPath, audioPath, outputPath, captions) => {
  const ffmpeg = getFfmpegPath();
  if (!checkFilterAvailable("drawtext")) {
    throw new Error("ffmpeg drawtext 필터가 없습니다. 설치된 ffmpeg를 확인해 주세요.");
  }
  const duration = getAudioDuration(audioPath) || 30;
  const filters = buildDrawtextFilters(captions, duration);
  const args = [
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-filter_complex",
    filters,
    "-map",
    "0:v",
    "-map",
    "1:a",
    "-shortest",
    "-y",
    outputPath,
  ];
  const result = spawnSync(ffmpeg, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("자막 포함 mp4 생성 실패");
  }
};

const renderVideo = async (type) => {
  if (type !== "short" && type !== "long") {
    throw new Error("type must be short or long");
  }

  const dateStamp = getTodayStamp();
  const dir = getOutDirForDate(dateStamp);
  const outputName = type === "short" ? `${dateStamp}_SHORT.mp4` : `${dateStamp}_LONG.mp4`;
  const outputPath = path.join(dir, outputName);
  if (fs.existsSync(outputPath)) {
    return { ok: true, filePath: outputPath, fileName: outputName };
  }

  const scripts = await getTodayScripts();
  const scriptText = type === "short" ? scripts.shortScript : scripts.longScript;
  const captions = type === "short" ? scripts.shortCaptions : scripts.longCaptions;

  const audioPath = path.join(dir, `${dateStamp}_${type}_tts.mp3`);
  if (!fs.existsSync(audioPath)) {
    await synthesizeSpeech(scriptText, audioPath);
  }

  const imageUrls = await getImagesForNews(scripts.summary.length ? scripts.summary : ["경제", "정책", "시장"]);
  const localImages = [];
  for (let i = 0; i < imageUrls.length; i += 1) {
    const target = path.join(dir, `${dateStamp}_${type}_img_${i + 1}.jpg`);
    await downloadImage(imageUrls[i], target);
    localImages.push(target);
  }

  const duration = getAudioDuration(audioPath) || (type === "short" ? 50 : 320);
  const size = type === "short" ? "1080:1920" : "1920:1080";
  const videoPath = path.join(dir, `${dateStamp}_${type}_slideshow.mp4`);
  createSlideshow(localImages, duration, videoPath, size);
  mergeAudioAndCaptions(videoPath, audioPath, outputPath, captions);

  return { ok: true, filePath: outputPath, fileName: outputName };
};

const getRenderDownload = async (type) => {
  if (type !== "short" && type !== "long") {
    throw new Error("type must be short or long");
  }
  const dateStamp = getTodayStamp();
  const dir = getOutDirForDate(dateStamp);
  const fileName = type === "short" ? `${dateStamp}_SHORT.mp4` : `${dateStamp}_LONG.mp4`;
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) {
    await renderVideo(type);
  }
  return { filePath, fileName };
};

module.exports = {
  renderVideo,
  getRenderDownload,
};
