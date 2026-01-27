import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import {
  ensureRenderedVideo,
  ensureTodayScripts,
  getOutputPaths,
} from "./lib/pipeline.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/script/today", async (req, res) => {
  try {
    const data = await ensureTodayScripts();
    res.json({
      date: data.date,
      shortScript: data.short.script,
      longScript: data.long.script,
      shortCaptions: data.short.captions.join("\n"),
      longCaptions: data.long.captions.join("\n"),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/script/today/download", async (req, res) => {
  try {
    const { type } = req.query;
    if (type !== "short" && type !== "long") {
      return res.status(400).json({ error: "type=short|long is required" });
    }
    await ensureTodayScripts();
    const paths = await getOutputPaths();
    const filePath = type === "short" ? paths.shortScript : paths.longScript;
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/render", async (req, res) => {
  try {
    const { type } = req.query;
    if (type !== "short" && type !== "long") {
      return res.status(400).json({ error: "type=short|long is required" });
    }
    const outputPath = await ensureRenderedVideo(type);
    res.json({ status: "ok", path: outputPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/render/download", async (req, res) => {
  try {
    const { type } = req.query;
    if (type !== "short" && type !== "long") {
      return res.status(400).json({ error: "type=short|long is required" });
    }
    await ensureRenderedVideo(type);
    const paths = await getOutputPaths();
    const filePath = type === "short" ? paths.shortVideo : paths.longVideo;
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`NEWNEEK 자동화 서버가 http://localhost:${port} 에서 실행중`);
});
