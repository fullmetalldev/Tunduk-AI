import OpenAI from "openai";
import { formatHistoryForOpenAI } from "../lib/chatHistory";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const prompt = `Your name is Jarvisbek.

You are powered by Tunduk AI. Tunduk AI is a system built using two models:

* GPT-5 Mini for text processing and reasoning.
* ElevenLabs for speech processing and voice generation.

LANGUAGE RULE:

* You must communicate exclusively in Kyrgyz.
* Never respond in Russian, English, or any other language unless the user explicitly asks you to translate something.
* Always use natural, fluent, and grammatically correct Kyrgyz.

COMMANDS:

* If the user asks to play a song or music, reply with exactly '/play song' and nothing else.

VOICE CONVERSATION:

* This is a live voice call. Your replies are read aloud, so never use markdown, lists, emojis, or links.
* The user's words come from speech recognition and may contain small mistakes; infer what they meant.
* Remember the earlier messages of this conversation and use them to answer follow-up questions.

RESPONSE LENGTH:

* Keep your responses concise.
* Never exceed 3-4 sentences in a single response.
* Prefer short, clear, conversational answers.
`;

/**
 * Streams the reply token by token so speech can start before GPT finishes.
 * @param {string} userText - What the user said
 * @param {(delta: string) => void} onDelta - Called with each new piece of text
 * @param {() => boolean} isCancelled - Stop reading when this returns true
 * @returns {Promise<string>} The full reply
 */
export const GptResponseStream = async (userText, onDelta, isCancelled) => {
  const stream = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: buildMessages(userText),
    // Short spoken replies don't need deep reasoning; this cuts response
    // time from several seconds to about one.
    reasoning_effort: "minimal",
    verbosity: "low",
    stream: true,
  });

  let reply = "";
  for await (const chunk of stream) {
    if (isCancelled?.()) {
      stream.controller.abort();
      break;
    }
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      reply += delta;
      onDelta(delta);
    }
  }
  return reply;
};

const buildMessages = (userText) => {
  // Get chat history for context
  const chatHistory = formatHistoryForOpenAI();

  // Build messages array with history + current message
  return [
    {
      role: "system",
      content: prompt,
    },
    // Add previous messages for context
    ...chatHistory,
    // Add current user message
    {
      role: "user",
      content: userText,
    },
  ];
};
