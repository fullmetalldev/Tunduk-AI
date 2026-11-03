import OpenAI from "openai";
import { formatHistoryForOpenAI } from "../lib/chatHistory";
import { getSystemPrompt } from "./prompts";
import { API_PROXY_URL } from "./proxy";

// Through the key proxy (api/) - see proxy.js. The condition is written
// inline so production builds drop the key branch entirely.
const openai = new OpenAI({
  ...(import.meta.env.DEV && !import.meta.env.VITE_API_PROXY_URL
    ? { apiKey: import.meta.env.VITE_OPENAI_API_KEY }
    : { apiKey: "proxy", baseURL: `${API_PROXY_URL}/openai/v1` }),
  dangerouslyAllowBrowser: true,
});

/**
 * Streams the reply token by token so speech can start before GPT finishes.
 * @param {string} contextId - Voice id: picks the character prompt and history
 * @param {string} userText - What the user said
 * @param {(delta: string) => void} onDelta - Called with each new piece of text
 * @param {() => boolean} isCancelled - Stop reading when this returns true
 * @returns {Promise<string>} The full reply
 */
export const GptResponseStream = async (
  contextId,
  userText,
  onDelta,
  isCancelled,
) => {
  const stream = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: buildMessages(contextId, userText),
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

const buildMessages = (contextId, userText) => {
  // Get chat history for context
  const chatHistory = formatHistoryForOpenAI(contextId);

  // Build messages array with history + current message
  return [
    {
      role: "system",
      content: getSystemPrompt(contextId),
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
