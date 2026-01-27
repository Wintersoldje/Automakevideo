import fs from "fs/promises";
import path from "path";
import { fetchTodayNewneekMail } from "./gmail.js";
import { buildLongScript, buildShortScript, extractNewsPoints } from "./script.js";
import { ensureImages } from "./images.js";
import { ensureTtsAudio } from "./tts.js";
import { renderVideo } from "./render.js";
import { ensureDir, fileExists, getTodayDateKST, readJson, writeJson } from "./utils.js";

const getOutDir = (date) => path.join(process.cwd(), "out", date);

export const getOutputPaths = async () => {
  const date = getTodayDateKST();
  const outDir = getOutDir(date);
  await ensureDir(outDir);
  return {
    date,
    outDir,
    scriptsJson: path.join(outDir, `${date}_scripts.json`),
    shortScript: path.join(outDir, `${date}_short_script.txt`),
    longScript: path.join(outDir, `${date}_long_script.txt`),
    shortAudio: path.join(outDir, `${date}_short.mp3`),
    longAudio: path.join(outDir, `${date}_long.mp3`),
    shortVideo: path.join(outDir, `${date}_SHORT.mp4`),
    longVideo: path.join(outDir, `${date}_LONG.mp4`),
    imagesDir: path.join(outDir, "images"),
  };
};

export const ensureTodayScripts = async () => {
  const paths = await getOutputPaths();
  if (await fileExists(paths.scriptsJson)) {
    return readJson(paths.scriptsJson);
  }

  const body = await fetchTodayNewneekMail();
  const points = extractNewsPoints(body);
  const short = buildShortScript(points);
  const long = buildLongScript(points);

  await ensureDir(paths.outDir);
  await fs.writeFile(paths.shortScript, short.script, "utf-8");
  await fs.writeFile(paths.longScript, long.script, "utf-8");

  const payload = {
    date: paths.date,
    points,
    short,
    long,
  };
  await writeJson(paths.scriptsJson, payload);
  return payload;
};

const ensureAudioFiles = async (data, paths) => {
  await ensureTtsAudio(data.short.script, paths.shortAudio);
  await ensureTtsAudio(data.long.script, paths.longAudio);
};

const ensureImageFiles = async (data, paths) => {
  await ensureImages(data.points, paths.imagesDir);
  const images = [
    path.join(paths.imagesDir, "news_1.png"),
    path.join(paths.imagesDir, "news_2.png"),
    path.join(paths.imagesDir, "news_3.png"),
  ];
  return images;
};

export const ensureRenderedVideo = async (type) => {
  const data = await ensureTodayScripts();
  const paths = await getOutputPaths();
  await ensureAudioFiles(data, paths);
  const images = await ensureImageFiles(data, paths);

  if (type === "short") {
    await renderVideo({
      images,
      audioPath: paths.shortAudio,
      captions: data.short.captions,
      outputPath: paths.shortVideo,
      sizePreset: { width: 1080, height: 1920, fontSize: 60 },
    });
    return paths.shortVideo;
  }

  await renderVideo({
    images,
    audioPath: paths.longAudio,
    captions: data.long.captions,
    outputPath: paths.longVideo,
    sizePreset: { width: 1920, height: 1080, fontSize: 48 },
  });
  return paths.longVideo;
};
