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
* If user asks to play a song, respond '/play song' so i can run the command

RESPONSE LENGTH:

* Keep your responses concise.
* Never exceed 3-4 sentences in a single response.
* Prefer short, clear, conversational answers.
`;

export const GptResponse = async (userText) => {
  // Get chat history for context
  const chatHistory = formatHistoryForOpenAI();

  // Build messages array with history + current message
  const messages = [
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

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages,
  });
  console.log("GPT RESPONSE", response);
  return response.choices[0].message.content;
};
