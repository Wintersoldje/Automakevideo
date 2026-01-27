import fs from "fs/promises";
import path from "path";
import { checkDrawtextFilter, getAudioDuration, runFfmpeg } from "./ffmpeg.js";
import { ensureDir, fileExists } from "./utils.js";

const escapeDrawtext = (text) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%")
    .replace(/\n/g, "\\n");

const buildDrawtextFilters = (captions, duration, sizePreset) => {
  if (!captions.length) {
    return "";
  }
  const fontPath =
    process.env.FONT_PATH || "/System/Library/Fonts/AppleSDGothicNeo.ttc";
  const lineDuration = duration / captions.length;
  const filters = captions.map((line, index) => {
    const start = (index * lineDuration).toFixed(2);
    const end = ((index + 1) * lineDuration).toFixed(2);
    const text = escapeDrawtext(line);
    return `drawtext=fontfile=${fontPath}:text='${text}':x=(w-text_w)/2:y=h-(text_h*2):fontsize=${sizePreset.fontSize}:fontcolor=white:box=1:boxcolor=black@0.45:boxborderw=20:enable='between(t,${start},${end})'`;
  });
  return filters.join(",");
};

const buildConcatList = async (images, durationPerImage, outDir) => {
  const listPath = path.join(outDir, "images.txt");
  const lines = images.map((image) => `file '${image}'\nduration ${durationPerImage}`);
  lines.push(`file '${images[images.length - 1]}'`);
  await fs.writeFile(listPath, lines.join("\n"));
  return listPath;
};

export const renderVideo = async ({
  images,
  audioPath,
  captions,
  outputPath,
  sizePreset,
}) => {
  if (await fileExists(outputPath)) {
    return outputPath;
  }
  await checkDrawtextFilter();
  await ensureDir(path.dirname(outputPath));

  const duration = await getAudioDuration(audioPath);
  const durationPerImage = Math.max(duration / images.length, 2);
  const listPath = await buildConcatList(images, durationPerImage, path.dirname(outputPath));

  const drawtext = buildDrawtextFilters(captions, duration, sizePreset);
  const scaleFilter = `scale=${sizePreset.width}:${sizePreset.height}:force_original_aspect_ratio=cover,crop=${sizePreset.width}:${sizePreset.height},format=yuv420p`;
  const vf = drawtext ? `${scaleFilter},${drawtext}` : scaleFilter;

  await runFfmpeg([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-i",
    audioPath,
    "-vf",
    vf,
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ]);

  return outputPath;
};
