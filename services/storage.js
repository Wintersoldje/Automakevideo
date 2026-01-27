const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "out");

const ensureOutDir = () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
};

const getTodayStamp = () => {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const yyyy = String(kst.getFullYear());
  const mm = String(kst.getMonth() + 1).padStart(2, "0");
  const dd = String(kst.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

const getOutDirForDate = (dateStamp) => {
  const dir = path.join(OUT_DIR, dateStamp);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

module.exports = {
  ensureOutDir,
  getTodayStamp,
  getOutDirForDate,
  OUT_DIR,
};
