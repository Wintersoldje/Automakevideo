const fs = require("fs");
const textToSpeech = require("@google-cloud/text-to-speech");

const getTtsClient = () => {
  if (process.env.GCP_TTS_SA_JSON) {
    const credentials = JSON.parse(process.env.GCP_TTS_SA_JSON);
    return new textToSpeech.TextToSpeechClient({ credentials });
  }
  return new textToSpeech.TextToSpeechClient();
};

const synthesizeSpeech = async (text, outputPath) => {
  const client = getTtsClient();
  const request = {
    input: { text },
    voice: { languageCode: "ko-KR", ssmlGender: "NEUTRAL" },
    audioConfig: { audioEncoding: "MP3" },
  };
  const [response] = await client.synthesizeSpeech(request);
  fs.writeFileSync(outputPath, response.audioContent, "binary");
  return outputPath;
};

module.exports = {
  synthesizeSpeech,
};
