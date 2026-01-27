import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const getFfmpegPath = () => process.env.FFMPEG_PATH || "/usr/local/bin/ffmpeg";
const getFfprobePath = () => process.env.FFPROBE_PATH || "/usr/local/bin/ffprobe";

export const checkDrawtextFilter = async () => {
  const ffmpegPath = getFfmpegPath();
  const { stdout } = await execFileAsync(ffmpegPath, ["-hide_banner", "-filters"]);
  if (!stdout.includes("drawtext")) {
    throw new Error(
      "ffmpeg drawtext 필터가 없습니다. ffmpeg 빌드 옵션을 확인하거나 drawtext 지원 버전을 설치해 주세요."
    );
  }
};

export const getAudioDuration = async (audioPath) => {
  const ffprobePath = getFfprobePath();
  const { stdout } = await execFileAsync(ffprobePath, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    audioPath,
  ]);
  return Number.parseFloat(stdout.trim());
};

export const runFfmpeg = async (args) => {
  const ffmpegPath = getFfmpegPath();
  await execFileAsync(ffmpegPath, args);
};
