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

const TTS_MODEL = "eleven_v4";
// Used only if the account can't use v4 yet, so the bot never goes silent.
const TTS_FALLBACK_MODEL = "eleven_v3";
const MP3_MIME = "audio/mpeg";

const requestSpeechStream = async (text, voiceId, modelId) =>
  elevenlabs.textToSpeech.stream(voiceId, {
    text: text,
    modelId: modelId,
    languageCode: "ky",
    outputFormat: "mp3_44100_128",
  });

const generateElevenTextToSpeech = async (text, voiceId = DEFAULT_VOICE_ID) => {
  try {
    return await requestSpeechStream(text, voiceId, TTS_MODEL);
  } catch (error) {
    console.warn(`${TTS_MODEL} failed, falling back to ${TTS_FALLBACK_MODEL}`, error);
    return requestSpeechStream(text, voiceId, TTS_FALLBACK_MODEL);
  }
};

const canStreamMp3 = () =>
  typeof window !== "undefined" &&
  window.MediaSource?.isTypeSupported?.(MP3_MIME);

// Feeds the TTS stream into a MediaSource so the <audio> element starts
// playing on the first chunk instead of waiting for the whole file.
const streamToMediaSourceUrl = (stream) => {
  const mediaSource = new MediaSource();
  const audioUrl = URL.createObjectURL(mediaSource);

  mediaSource.addEventListener(
    "sourceopen",
    async () => {
      const sourceBuffer = mediaSource.addSourceBuffer(MP3_MIME);
      const reader = stream.getReader();
      const appendChunk = (chunk) =>
        new Promise((resolve, reject) => {
          sourceBuffer.addEventListener("updateend", resolve, { once: true });
          sourceBuffer.addEventListener("error", reject, { once: true });
          sourceBuffer.appendBuffer(chunk);
        });

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          // The audio element was reset (user hung up) - stop downloading
          if (mediaSource.readyState !== "open") {
            reader.cancel();
            return;
          }
          await appendChunk(value);
        }
        if (mediaSource.readyState === "open") mediaSource.endOfStream();
      } catch (error) {
        console.error("Error streaming audio:", error);
        if (mediaSource.readyState === "open") mediaSource.endOfStream("network");
      }
    },
    { once: true },
  );

  return audioUrl;
};

const streamToBlobUrl = async (stream) => {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const blob = new Blob(chunks, { type: MP3_MIME });
  return URL.createObjectURL(blob);
};

/**
 * Generates speech for the text and returns a URL the <audio> element can
 * play right away. Streams where the browser supports it, otherwise waits
 * for the full file.
 */
export const textToSpeechUrl = async (text, voiceId = DEFAULT_VOICE_ID) => {
  const stream = await generateElevenTextToSpeech(text, voiceId);
  const audioUrl = canStreamMp3()
    ? streamToMediaSourceUrl(stream)
    : await streamToBlobUrl(stream);
  console.log('AUDIO READY', audioUrl)
  return audioUrl;
};

export const getElevenAuth = async () => {
  const token = await elevenlabs.tokens.singleUse.create("realtime_scribe");
  return token?.token;
};
