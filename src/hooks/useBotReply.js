import { useRef, useState } from "react";
import Song from "../lib/muras_mirbek.mp3";
import { createSpeechQueue } from "../api/ElevenLabs";
import { GptResponseStream } from "../api/OpenAI";
import { saveChatTurn } from "../lib/chatHistory";

const PLAY_SONG = "/play song";
// The first sentence is sent to TTS as soon as GPT finishes it (if it is at
// least this long), so the bot starts talking while the rest is still being
// written. The rest goes as one piece to keep the intonation natural.
const MIN_FIRST_PIECE = 20;

const findFirstSentenceEnd = (text) => {
  const sentenceEnd = /[.!?…]+["»”)]*\s/g;
  sentenceEnd.lastIndex = MIN_FIRST_PIECE;
  const match = sentenceEnd.exec(text);
  return match ? match.index + match[0].length : -1;
};

// While the reply so far could still turn into "/play song", don't speak it
const mightBeSongCommand = (text) => {
  const start = text.trimStart();
  return PLAY_SONG.startsWith(start.slice(0, PLAY_SONG.length));
};

/**
 * One bot turn: streams the GPT reply, speaks it (optionally) and saves it.
 * `reply` is the turn in progress ({ user, bot }) for live captions; it is
 * cleared once the turn is saved to chat history.
 */
export function useBotReply() {
  const [reply, setReply] = useState(null);
  const replyIdRef = useRef(0);
  const speechRef = useRef(null);

  const cancel = () => {
    replyIdRef.current += 1;
    speechRef.current?.cancel();
    speechRef.current = null;
    setReply(null);
  };

  /**
   * @param {string} userText
   * @param {object} [options]
   * @param {string} [options.voiceId] - Speak the reply with this voice; omit for text only
   * @param {(audioUrl: string) => void} [options.onSpeech] - Audio is ready to play
   * @returns {Promise<boolean>} Whether audio was handed to onSpeech
   */
  const respond = async (userText, { voiceId, onSpeech } = {}) => {
    cancel();
    const replyId = replyIdRef.current;
    const isCancelled = () => replyId !== replyIdRef.current;

    const speech = voiceId ? createSpeechQueue(voiceId) : null;
    speechRef.current = speech;
    let botText = "";
    let spokenUpTo = 0;
    let speaking = false;

    const speak = (text) => {
      if (!text.trim()) return;
      speech.push(text);
      if (speaking) return;
      speaking = true;
      speech.getUrl().then((audioUrl) => {
        if (!isCancelled()) onSpeech?.(audioUrl);
      });
    };

    setReply({ user: userText, bot: "" });

    try {
      console.log("Calling OpenAI with user text:", userText);
      await GptResponseStream(
        userText,
        (delta) => {
          botText += delta;
          setReply({ user: userText, bot: botText });

          if (!speech || spokenUpTo > 0 || mightBeSongCommand(botText)) return;
          const sentenceEnd = findFirstSentenceEnd(botText);
          if (sentenceEnd !== -1) {
            spokenUpTo = sentenceEnd;
            speak(botText.slice(0, sentenceEnd));
          }
        },
        isCancelled,
      );
      if (isCancelled()) return false;

      console.log("OpenAI response:", botText);
      if (!botText.trim()) throw new Error("Empty response from OpenAI");

      // Save the whole turn AFTER getting the response
      saveChatTurn(userText, botText.trim());
      setReply(null);
      if (!speech) return false;

      if (botText.includes(PLAY_SONG)) {
        speech.cancel();
        onSpeech?.(Song);
        return true;
      }
      speak(botText.slice(spokenUpTo));
      speech.end();
      return speaking;
    } catch (error) {
      if (!isCancelled()) {
        speech?.cancel();
        setReply(null);
      }
      throw error;
    }
  };

  return { reply, respond, cancel };
}
