import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { getElevenAuth, streamToBlob } from "./ElevenLabs";
import { GptResponse } from "./OpenAI";
import { saveChatMessage } from "../lib/chatHistory";
import { useEffect, useRef } from "react";
import Song from "../lib/muras_mirbek.mp3";

function SpeechToText({ botState, setBotState, onAudioGenerated }) {
  const isConnectingRef = useRef(false);

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
      // Only set to listening if bot is not currently speaking
      if (botState !== "speaking") {
        setBotState("listening");
      }
    },
    onCommittedTranscript: (data) => {
      console.log("Committed:", data.text);
      setBotState("thinking");

      // Call OpenAI to generate response
      generateBotResponse(data.text);
    },
    onCommittedTranscriptWithTimestamps: (data) => {
      console.log("Committed with timestamps:", data.text);
      console.log("Timestamps:", data.words);
    },
  });

  // Call OpenAI to generate response and then convert to speech
  const generateBotResponse = async (userText) => {
    try {
      // Step 1: Get text response from OpenAI (BEFORE saving to avoid duplication)
      console.log("Calling OpenAI with user text:", userText);
      const botText = await GptResponse(userText);
      console.log("OpenAI response:", botText);

      // Step 2: Save messages to localStorage AFTER getting response
      saveChatMessage("user", userText);
      saveChatMessage("assistant", botText);

      // Step 3: Convert bot response to speech using ElevenLabs
      console.log("Converting to speech...");
      let audioUrl;
      if (botText === "/play song") {
        audioUrl = Song;
      } else {
        audioUrl = await streamToBlob(botText);
      }

      console.log("Audio generated:", audioUrl);

      // Step 4: Pass audio URL to parent component
      if (onAudioGenerated) {
        onAudioGenerated(audioUrl);
      }

      // Step 5: Transition to speaking state
      setBotState("speaking");
    } catch (error) {
      console.error("Error generating bot response:", error);
      // Go back to listening so user can try again
      setBotState("listening");
    }
  };

  const handleStart = async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log("Already connecting, skipping...");
      return;
    }

    try {
      isConnectingRef.current = true;
      // Fetch a single use token from the server
      const token = await getElevenAuth();

      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (error) {
      console.error("Error connecting:", error);
      setBotState("idle");
    } finally {
      isConnectingRef.current = false;
    }
  };

  useEffect(() => {
    if (botState === "connecting") {
      handleStart();
    } else if (botState === "idle") {
      scribe.disconnect();
    }
  }, [botState]); // Only depend on botState, not scribe

  return <></>;
}

export default SpeechToText;
