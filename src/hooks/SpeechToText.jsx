import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { useEffect, useRef } from "react";
import { getElevenAuth } from "../api/ElevenLabs";

// Words Scribe should be biased towards (max 50, up to 20 characters each):
// the bot's own names and words it tends to mishear in Kyrgyz.
const KEYTERMS = [
  "Жарвисбек",
  "Jarvisbek",
  "Түндүк",
  "Tunduk",
  "Кыргызстан",
  "Бишкек",
  "Ош",
  "Ысык-Көл",
  "Манас",
  "ырдап бер",
  "ыр кой",
  "саламатсызбы",
  "рахмат",
];

/**
 * Listens to the user while a call is active. Only speech-to-text lives here;
 * what to do with the words is up to the parent:
 * - onPartial(text): the user is speaking, text so far (for live captions)
 * - onUtterance(text): the user finished a phrase while the bot was listening
 */
function SpeechToText({ botState, setBotState, onPartial, onUtterance }) {
  const isConnectingRef = useRef(false);
  // useScribe captures its callbacks once at connect time, so everything they
  // read must go through refs to see the current value instead of a stale one.
  const botStateRef = useRef(botState);
  const onPartialRef = useRef(onPartial);
  const onUtteranceRef = useRef(onUtterance);
  // Bumped on every hang up so a connect that finishes late is dropped.
  const callIdRef = useRef(0);

  useEffect(() => {
    botStateRef.current = botState;
    onPartialRef.current = onPartial;
    onUtteranceRef.current = onUtterance;
  });

  const updateBotState = (state) => {
    botStateRef.current = state;
    setBotState(state);
  };

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "ky",
    commitStrategy: CommitStrategy.VAD,
    // Shorter pause = the bot answers sooner. Raise it if the bot starts
    // answering while the user is still mid-sentence.
    vadSilenceThresholdSecs: 1.0,
    vadThreshold: 0.4,
    minSpeechDurationMs: 100,
    minSilenceDurationMs: 100,
    keyterms: KEYTERMS,
    // Drop "ммм", "ээ" and similar fillers before the text reaches GPT
    noVerbatim: true,
    filterBackgroundAudio: true,
    onPartialTranscript: (data) => {
      if (botStateRef.current === "listening") onPartialRef.current?.(data.text);
    },
    onCommittedTranscript: (data) => {
      const text = data.text?.trim();
      console.log("Committed:", text);

      // Half-duplex: only accept speech while we are listening. Anything
      // committed while the bot thinks or speaks (often the bot's own voice
      // picked up by the mic) would start a second, overlapping request.
      if (!text || botStateRef.current !== "listening") return;

      updateBotState("thinking");
      onUtteranceRef.current?.(text);
    },
    onError: (error) => {
      console.error("Scribe error:", error);
    },
  });

  const handleStart = async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log("Already connecting, skipping...");
      return;
    }

    const callId = callIdRef.current;
    try {
      isConnectingRef.current = true;
      // Fetch a single use token from the server
      const token = await getElevenAuth();

      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (callId !== callIdRef.current) {
        // User hung up while we were connecting
        scribe.disconnect();
        return;
      }
      updateBotState("listening");
    } catch (error) {
      console.error("Error connecting:", error);
      updateBotState("idle");
    } finally {
      isConnectingRef.current = false;
    }
  };

  useEffect(() => {
    if (botState === "connecting") {
      handleStart();
    } else if (botState === "idle") {
      callIdRef.current += 1;
      scribe.disconnect();
    } else if (scribe.getConnection()) {
      // Stop sending mic audio while the bot thinks/speaks so it cannot
      // transcribe itself; resume as soon as it is our turn to listen.
      try {
        if (botState === "listening") scribe.unmute();
        else scribe.mute();
      } catch (error) {
        console.error("Error toggling microphone:", error);
      }
    }
  }, [botState]); // Only depend on botState, not scribe

  return <></>;
}

export default SpeechToText;
