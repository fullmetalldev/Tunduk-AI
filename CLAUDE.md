# Jarvisbek / TundukAI — project context

Browser-only voice assistant that speaks Kyrgyz. The user presses "Talk to bot", speaks,
and the bot answers out loud. There is no backend: every API call is made from the browser
with keys from `.env` (`VITE_ELEVENLABS_API_KEY`, `VITE_OPENAI_API_KEY`, see `.example.env`).

Stack: React 19 + Vite 8 (React Compiler enabled), plain JSX, SCSS per component
(BEM-ish class names like `ChatBot__chatBox_header`), Tailwind/shadcn installed but barely used.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (use this to verify changes; there are no tests)
- `npm run lint` — ESLint

## Voice call pipeline

```
mic ──► ElevenLabs Scribe realtime STT (useScribe, VAD commit, languageCode "ky")
          │ onCommittedTranscript
          ▼
     OpenAI chat completion (gpt-5-mini, system prompt + chat history)
          │ reply text  ("/play song" → plays bundled song instead of TTS)
          ▼
     ElevenLabs TTS (eleven_v3, selected voice) → blob URL → <audio> in ChatBot
          │ "ended"
          ▼
     back to "listening"
```

Bot state machine (`botState` in `ChatBot.jsx`):
`idle → connecting → listening → thinking → speaking → listening … → idle` (hang up).
The call is half-duplex: transcripts are only accepted while `listening`; anything Scribe
commits while the bot is thinking/speaking (including the bot hearing itself) is dropped.

## Key files

- `src/sections/ChatBot/ChatBot.jsx` — call UI, state machine owner, response `<audio>`,
  voice picker.
- `src/hooks/SpeechToText.jsx` — renderless component wrapping `useScribe`; on commit it
  calls OpenAI, saves history, generates TTS and hands the audio URL to `ChatBot`.
- `src/api/OpenAI.js` — system prompt + `GptResponse(userText)`.
- `src/api/ElevenLabs.js` — TTS (`streamToBlob(text, voiceId)`), Scribe token, `VOICES` list.
- `src/lib/chatHistory.js` — conversation memory in `localStorage` (`chatHistory` key),
  trimmed to the last N user/assistant turns.
- `src/i18n/` — UI translations (`translations.js`: `en`, `ky`), `I18nProvider` (`I18n.jsx`)
  and the `useI18n()` hook (`useI18n.js`, kept separate for fast refresh). Language is chosen
  in the header and persisted in `localStorage`. Add new UI strings to both languages.
- `src/components/Visualizer/*` — orb visualizer; `Audiograph.js` keeps one Web Audio
  source per `<audio>` element (only one `createMediaElementSource` is allowed per element).

## Gotchas

- Callbacks passed to `useScribe` are captured when the hook is created, so read live state
  through refs (`botStateRef`), not through props captured in the closure.
- Async work (OpenAI/TTS) can finish after the user hung up — check the call is still
  active before playing audio or changing state.
- `StrictMode` double-runs effects in dev; `isConnectingRef` guards the Scribe connect.
- The bot itself always answers in Kyrgyz regardless of the UI language.
