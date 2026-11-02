import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { API_PROXY_URL } from "./proxy";

// Through the key proxy (worker/) - see proxy.js. The proxy adds the real
// key, so the placeholder only keeps the SDK from asking for one. The
// condition is written inline so production builds drop the key branch.
const elevenlabs = new ElevenLabsClient(
  import.meta.env.DEV && !API_PROXY_URL
    ? { apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY }
    : { apiKey: "proxy", baseUrl: `${API_PROXY_URL}/elevenlabs` },
);

// Voices the user can pick for the bot - browse voices at elevenlabs.io/app/voice-library
// Each voice is a separate character (see prompts.js) with its own history.
export const JARVISBEK_VOICE_ID = "xSvb8bez3GCZPLs42u97";
export const MIRBEK_VOICE_ID = "luy1CrV6Ok1pWRBWzIhJ";

export const VOICES = [
  { id: JARVISBEK_VOICE_ID, name: "Jarvisbek" },
  { id: MIRBEK_VOICE_ID, name: "Mirbek Baike" },
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

/**
 * A reply spoken in pieces: push() text as it arrives from GPT and every
 * piece is requested from ElevenLabs right away, but played back in order
 * through ONE audio URL. Where the browser supports it the URL is ready
 * immediately and plays from the first chunk; otherwise it resolves with the
 * whole reply once everything is downloaded.
 *
 * @param {string} voiceId
 * @returns {{ push: (text: string) => void, end: () => void,
 *   cancel: () => void, getUrl: () => Promise<string> }}
 */
export const createSpeechQueue = (voiceId = DEFAULT_VOICE_ID) => {
  const requests = [];
  let ended = false;
  let cancelled = false;
  let wake = null;

  const notify = () => {
    wake?.();
    wake = null;
  };

  // Audio chunks of every piece, in order, as soon as each one arrives
  async function* audioChunks() {
    let index = 0;
    while (!cancelled) {
      if (index < requests.length) {
        try {
          const reader = (await requests[index]).getReader();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (cancelled) {
              reader.cancel();
              return;
            }
            yield value;
          }
        } catch (error) {
          // Skip a failed piece rather than dropping the whole reply
          console.error("Error generating speech:", error);
        }
        index += 1;
      } else if (ended) {
        return;
      } else {
        await new Promise((resolve) => (wake = resolve));
      }
    }
  }

  const streamToMediaSource = () => {
    const mediaSource = new MediaSource();
    mediaSource.addEventListener(
      "sourceopen",
      async () => {
        const sourceBuffer = mediaSource.addSourceBuffer(MP3_MIME);
        // Play appended pieces back to back instead of by their timestamps
        sourceBuffer.mode = "sequence";
        const append = (chunk) =>
          new Promise((resolve, reject) => {
            sourceBuffer.addEventListener("updateend", resolve, { once: true });
            sourceBuffer.addEventListener("error", reject, { once: true });
            sourceBuffer.appendBuffer(chunk);
          });

        try {
          for await (const chunk of audioChunks()) {
            // The audio element was reset (user hung up) - stop downloading
            if (mediaSource.readyState !== "open") {
              cancelled = true;
              return;
            }
            await append(chunk);
          }
          if (mediaSource.readyState === "open") mediaSource.endOfStream();
        } catch (error) {
          console.error("Error streaming audio:", error);
          if (mediaSource.readyState === "open") mediaSource.endOfStream("network");
        }
      },
      { once: true },
    );
    return Promise.resolve(URL.createObjectURL(mediaSource));
  };

  const streamToBlob = async () => {
    const chunks = [];
    for await (const chunk of audioChunks()) chunks.push(chunk);
    return URL.createObjectURL(new Blob(chunks, { type: MP3_MIME }));
  };

  let urlPromise = null;

  return {
    push: (text) => {
      if (ended || cancelled || !text.trim()) return;
      const request = generateElevenTextToSpeech(text, voiceId);
      request.catch(() => {}); // handled when the piece is read
      requests.push(request);
      notify();
    },
    end: () => {
      ended = true;
      notify();
    },
    cancel: () => {
      cancelled = true;
      notify();
    },
    getUrl: () => {
      urlPromise ??= canStreamMp3() ? streamToMediaSource() : streamToBlob();
      return urlPromise;
    },
  };
};

export const getElevenAuth = async () => {
  const token = await elevenlabs.tokens.singleUse.create("realtime_scribe");
  return token?.token;
};
