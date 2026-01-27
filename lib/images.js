import fs from "fs/promises";
import path from "path";
import { ensureDir, fileExists } from "./utils.js";
import { runFfmpeg } from "./ffmpeg.js";

const fallbackColors = ["#2563eb", "#10b981", "#f97316"];

const extractKeyword = (text) => {
  const cleaned = text.replace(/[.,!?]/g, " ").split(/\s+/).filter(Boolean);
  return cleaned.slice(0, 4).join(" ");
};

const downloadImage = async (url, destination) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`이미지 다운로드 실패: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await ensureDir(path.dirname(destination));
  await fs.writeFile(destination, Buffer.from(arrayBuffer));
};

const createFallbackImage = async (index, destination) => {
  const color = fallbackColors[index % fallbackColors.length];
  await runFfmpeg([
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=${color}:s=1280x720`,
    "-frames:v",
    "1",
    destination,
  ]);
};

export const ensureImages = async (points, outDir) => {
  await ensureDir(outDir);
  const images = [];
  for (let i = 0; i < 3; i += 1) {
    const imagePath = path.join(outDir, `news_${i + 1}.png`);
    if (await fileExists(imagePath)) {
      images.push(imagePath);
      continue;
    }
    const keyword = extractKeyword(points[i]);
    if (!process.env.PEXELS_API_KEY) {
      await createFallbackImage(i, imagePath);
      images.push(imagePath);
      continue;
    }
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          keyword
        )}&per_page=1`,
        {
          headers: {
            Authorization: process.env.PEXELS_API_KEY,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Pexels 응답 오류: ${response.status}`);
      }
      const data = await response.json();
      const photo = data.photos?.[0];
      if (!photo?.src?.large) {
        throw new Error("Pexels 이미지가 없습니다.");
      }
      await downloadImage(photo.src.large, imagePath);
      images.push(imagePath);
    } catch (error) {
      await createFallbackImage(i, imagePath);
      images.push(imagePath);
    }
  }
  return images;
};
