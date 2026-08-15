import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";

export const streamToBlob = async (text, songRef) => {
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
  return audioUrl;
};

export const generateElevenTextToSpeech = async (text) => {
  const elevenlabs = new ElevenLabsClient({
    apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
  });
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
