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
     OpenAI chat completion, streamed (gpt-5-mini, reasoning_effort "minimal", + history)
          │ first sentence → TTS immediately, the rest → TTS when GPT finishes
          │ ("/play song" → plays bundled song instead of TTS)
          ▼
     ElevenLabs TTS stream (eleven_v4, falls back to eleven_v3, selected voice)
          → speech queue: all pieces appended in order to ONE MediaSource
            (plays from the first chunk; blob URL fallback) → <audio> in ChatBot
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
  voice picker; routes finished phrases to `useBotReply`.
- `src/hooks/SpeechToText.jsx` — renderless component wrapping `useScribe`; only reports
  `onPartial` (live caption) and `onUtterance` (finished phrase) to `ChatBot`.
- `src/hooks/useBotReply.js` — one bot turn: streams GPT, splits off the first sentence for
  TTS, saves the turn, exposes the in-progress `reply` for captions; `cancel()` on hang up.
- `src/components/ChatMessages/` — read-only captions panel: history via
  `useSyncExternalStore`, the live turn and the user's partial transcript. No text input
  by design - the bot is voice only.
- `src/api/OpenAI.js` — `GptResponseStream(contextId, userText, onDelta, isCancelled)`.
- `src/api/prompts.js` — one character prompt per voice (Jarvisbek: J.A.R.V.I.S.-style AI
  butler; Mirbek Baike: tipsy comedic philosopher) + shared rules; `getSystemPrompt(voiceId)`.
- `src/api/ElevenLabs.js` — `createSpeechQueue(voiceId)` (push/end/cancel/getUrl), Scribe
  token, `VOICES` list.
- Speech-to-text is Scribe v2 Realtime (no newer STT model exists as of Nov 2026); Kyrgyz is a
  "Good" tier language (10–20% WER), so recognition is biased with `KEYTERMS` in `SpeechToText.jsx`.
- `src/lib/chatHistory.js` — conversation memory in `localStorage`, one context per voice
  (`chatHistory:<voiceId>`; every function takes the `contextId` = voice id). Capped at
  `MAX_MESSAGES` (50): when full, new phrases are ignored and the panel asks the user to
  clear it. `subscribeChatHistory` notifies the UI.
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
- iOS: audio routed through Web Audio is silent unless its AudioContext is resumed from a
  tap (and the mic can suspend it again), and `play()` after awaits is blocked unless the
  element was played from a tap first. So on iOS the bot's `<audio>` is not routed through
  Web Audio (no orb volume there), and "Talk to bot" calls `unlockAudioElement()` inside
  the click. iPhone has no `MediaSource`, so speech uses the blob fallback (whole reply).
