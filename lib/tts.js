import fs from "fs/promises";
import path from "path";
import textToSpeech from "@google-cloud/text-to-speech";
import { ensureDir, fileExists, sanitizeScriptText } from "./utils.js";

const loadCredentials = () => {
  if (process.env.GCP_TTS_SA_JSON) {
    return JSON.parse(process.env.GCP_TTS_SA_JSON);
  }
  return null;
};

const getClient = () => {
  const credentials = loadCredentials();
  if (credentials) {
    return new textToSpeech.TextToSpeechClient({ credentials });
  }
  return new textToSpeech.TextToSpeechClient();
};

export const ensureTtsAudio = async (script, outputPath) => {
  if (await fileExists(outputPath)) {
    return outputPath;
  }
  await ensureDir(path.dirname(outputPath));
  const client = getClient();
  const cleaned = sanitizeScriptText(script);
  const [response] = await client.synthesizeSpeech({
    input: { text: cleaned },
    voice: { languageCode: "ko-KR", ssmlGender: "FEMALE" },
    audioConfig: { audioEncoding: "MP3" },
  });
  if (!response.audioContent) {
    throw new Error("TTS 음성 생성에 실패했습니다.");
  }
  await fs.writeFile(outputPath, response.audioContent, "binary");
  return outputPath;
};
