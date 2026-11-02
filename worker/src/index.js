// API key proxy for Tunduk AI. The site runs on GitHub Pages (static files
// only), so the OpenAI and ElevenLabs keys live here instead of in the
// browser bundle. Only the few requests the app makes are forwarded.

// Keep in sync with VOICES in src/api/ElevenLabs.js
const VOICE_IDS = ["xSvb8bez3GCZPLs42u97", "luy1CrV6Ok1pWRBWzIhJ"];
const TTS_MODELS = ["eleven_v4", "eleven_v3"];
const OPENAI_MODEL = "gpt-5-mini";
// A spoken reply is 3-4 sentences; anything far longer is not from the app
const MAX_TTS_CHARS = 1500;
const MAX_CHAT_BODY_BYTES = 200_000;

const json = (status, body, headers) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

const corsHeaders = (origin, request) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  // The SDKs send their own extra headers; allow whatever they ask for
  "Access-Control-Allow-Headers":
    request.headers.get("Access-Control-Request-Headers") ?? "*",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
});

const forward = async (url, init, cors) => {
  const response = await fetch(url, init);
  // Pass the body through as a stream so speech and text arrive live
  const headers = new Headers(cors);
  for (const name of ["Content-Type", "Cache-Control"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers });
};

const handleChat = async (request, env, cors) => {
  const raw = await request.text();
  if (raw.length > MAX_CHAT_BODY_BYTES) {
    return json(413, { error: "Request too large" }, cors);
  }
  const body = JSON.parse(raw);
  body.model = OPENAI_MODEL;
  return forward(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    cors,
  );
};

const handleSpeech = async (request, env, cors, voiceId, search) => {
  if (!VOICE_IDS.includes(voiceId)) {
    return json(403, { error: "Unknown voice" }, cors);
  }
  const body = await request.json();
  if (!TTS_MODELS.includes(body.model_id)) {
    return json(403, { error: "Model not allowed" }, cors);
  }
  if (typeof body.text !== "string" || body.text.length > MAX_TTS_CHARS) {
    return json(413, { error: "Text too long" }, cors);
  }
  return forward(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream${search}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    cors,
  );
};

const handleScribeToken = (env, cors) =>
  forward(
    "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
    { method: "POST", headers: { "xi-api-key": env.ELEVENLABS_API_KEY } },
    cors,
  );

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
    // Stops other websites from using the proxy from their pages. It does
    // not stop scripts that fake the header - keep spending limits on.
    if (!origin || !allowed.includes(origin)) {
      return json(403, { error: "Origin not allowed" });
    }
    const cors = corsHeaders(origin, request);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json(405, { error: "Method not allowed" }, cors);
    }

    const { pathname, search } = new URL(request.url);
    try {
      if (pathname === "/openai/v1/chat/completions") {
        return await handleChat(request, env, cors);
      }
      const speech = pathname.match(
        /^\/elevenlabs\/v1\/text-to-speech\/([A-Za-z0-9]+)\/stream$/,
      );
      if (speech) {
        return await handleSpeech(request, env, cors, speech[1], search);
      }
      if (pathname === "/elevenlabs/v1/single-use-token/realtime_scribe") {
        return await handleScribeToken(env, cors);
      }
      return json(404, { error: "Not found" }, cors);
    } catch (error) {
      console.error(error);
      return json(400, { error: "Bad request" }, cors);
    }
  },
};
