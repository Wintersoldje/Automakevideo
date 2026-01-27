const { execSync, spawnSync } = require("child_process");

const getFfmpegPath = () => process.env.FFMPEG_PATH || "/usr/local/bin/ffmpeg";
const getFfprobePath = () => process.env.FFPROBE_PATH || "/usr/local/bin/ffprobe";

const checkFilterAvailable = (filterName) => {
  const output = execSync(`${getFfmpegPath()} -filters`, { encoding: "utf8" });
  return output.includes(filterName);
};

const getAudioDuration = (filePath) => {
  const result = spawnSync(getFfprobePath(), [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const output = result.stdout.toString("utf8").trim();
  return Number(output || 0);
};

module.exports = {
  getFfmpegPath,
  getFfprobePath,
  checkFilterAvailable,
  getAudioDuration,
};
