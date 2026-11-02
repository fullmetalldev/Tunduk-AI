import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
});

// Voices the user can pick for the bot - browse voices at elevenlabs.io/app/voice-library
export const VOICES = [
  { id: "xSvb8bez3GCZPLs42u97", name: "Jarvisbek" },
  { id: "luy1CrV6Ok1pWRBWzIhJ", name: "Mirbek Baike" },
];

export const DEFAULT_VOICE_ID = VOICES[0].id;

export const streamToBlob = async (text, voiceId = DEFAULT_VOICE_ID) => {
  const stream = await generateElevenTextToSpeech(text, voiceId);
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

export const generateElevenTextToSpeech = async (
  text,
  voiceId = DEFAULT_VOICE_ID,
) => {
  const audio = await elevenlabs.textToSpeech.convert(voiceId, {
    text: text,
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
  });
  return audio;
};

export const getElevenAuth = async () => {
  const token = await elevenlabs.tokens.singleUse.create("realtime_scribe");
  return token?.token;
};
