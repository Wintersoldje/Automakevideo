const path = require("path");
const fs = require("fs");
const express = require("express");
const dotenv = require("dotenv");
const {
  getTodayScripts,
  getScriptDownload,
} = require("./services/script");
const { renderVideo, getRenderDownload } = require("./services/render");
const { ensureOutDir } = require("./services/storage");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

ensureOutDir();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/script/today", async (_req, res) => {
  try {
    const scripts = await getTodayScripts();
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/script/today/download", async (req, res) => {
  try {
    const result = await getScriptDownload(req.query.type);
    res.download(result.filePath, result.fileName);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/render", async (req, res) => {
  try {
    const type = req.query.type;
    const renderResult = await renderVideo(type);
    res.json(renderResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/render/download", async (req, res) => {
  try {
    const result = await getRenderDownload(req.query.type);
    res.download(result.filePath, result.fileName);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
  console.log(`Server running on http://localhost:${port}`);
});
