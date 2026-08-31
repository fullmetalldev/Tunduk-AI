import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
});

export const streamToBlob = async (text) => {
  const stream = await generateElevenTextToSpeech(text);
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const blob = new Blob(chunks, { type: "audio/mpeg" });
  const audioUrl = URL.createObjectURL(blob);
  console.log('AUDIO READY', audioUrl)
  return audioUrl;
};

export const generateElevenTextToSpeech = async (text) => {
  const audio = await elevenlabs.textToSpeech.convert(
    "xSvb8bez3GCZPLs42u97", // "George" - browse voices at elevenlabs.io/app/voice-library
    {
      text: text,
      modelId: "eleven_v3",
      outputFormat: "mp3_44100_128",
    },
  );
  return audio;
};

export const getElevenAuth = async () => {
  const token = await elevenlabs.tokens.singleUse.create("realtime_scribe");
  return token?.token;
};
