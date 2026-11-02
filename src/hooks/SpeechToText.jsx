import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { saveChatTurn } from "../lib/chatHistory";
import { useEffect, useRef } from "react";
import Song from "../lib/muras_mirbek.mp3";
import { getElevenAuth, streamToBlob } from "../api/ElevenLabs";
import { GptResponse } from "../api/OpenAI";

function SpeechToText({ botState, setBotState, onAudioGenerated, voiceId }) {
  const isConnectingRef = useRef(false);
  // useScribe captures its callbacks once at connect time, so everything they
  // read must go through refs to see the current value instead of a stale one.
  const botStateRef = useRef(botState);
  const voiceIdRef = useRef(voiceId);
  const onAudioGeneratedRef = useRef(onAudioGenerated);
  // Bumped on every hang up so responses from a finished call are dropped.
  const callIdRef = useRef(0);

  useEffect(() => {
    botStateRef.current = botState;
    voiceIdRef.current = voiceId;
    onAudioGeneratedRef.current = onAudioGenerated;
  });

  const updateBotState = (state) => {
    botStateRef.current = state;
    setBotState(state);
  };

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "ky",
    commitStrategy: CommitStrategy.VAD,
    vadSilenceThresholdSecs: 1.5,
    vadThreshold: 0.4,
    minSpeechDurationMs: 100,
    minSilenceDurationMs: 100,
    includeTimestamps: true,
    onPartialTranscript: (data) => {
      console.log("Partial:", data.text);
    },
    onCommittedTranscript: (data) => {
      const text = data.text?.trim();
      console.log("Committed:", text);

      // Half-duplex: only accept speech while we are listening. Anything
      // committed while the bot thinks or speaks (often the bot's own voice
      // picked up by the mic) would start a second, overlapping request.
      if (!text || botStateRef.current !== "listening") return;

      updateBotState("thinking");
      generateBotResponse(text, callIdRef.current);
    },
    onError: (error) => {
      console.error("Scribe error:", error);
    },
  });

  // Call OpenAI to generate response and then convert to speech
  const generateBotResponse = async (userText, callId) => {
    const isStale = () => callId !== callIdRef.current;
    try {
      // Step 1: Get text response from OpenAI (BEFORE saving to avoid duplication)
      console.log("Calling OpenAI with user text:", userText);
      const botText = (await GptResponse(userText))?.trim();
      console.log("OpenAI response:", botText);
      if (!botText) throw new Error("Empty response from OpenAI");

      // Step 2: Save the whole turn AFTER getting response
      saveChatTurn(userText, botText);
      if (isStale()) return;

      // Step 3: Convert bot response to speech using ElevenLabs
      console.log("Converting to speech...");
      let audioUrl;
      if (botText.includes("/play song")) {
        audioUrl = Song;
      } else {
        audioUrl = await streamToBlob(botText, voiceIdRef.current);
      }
      if (isStale()) return;

      console.log("Audio generated:", audioUrl);

      // Step 4: Transition to speaking state and hand audio to parent
      updateBotState("speaking");
      onAudioGeneratedRef.current?.(audioUrl);
    } catch (error) {
      console.error("Error generating bot response:", error);
      // Go back to listening so user can try again
      if (!isStale()) updateBotState("listening");
    }
  };

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
