// URL of the API key proxy (the Cloudflare Worker in worker/). OpenAI and
// ElevenLabs are called through it, so no keys are in the bundle. Only the dev
// server (`npm run dev`) may use the VITE_*_API_KEY values from .env directly
// when this is not set; production builds never include them.
export const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL?.replace(/\/+$/, "");

if (!API_PROXY_URL && !import.meta.env.DEV) {
  console.error("VITE_API_PROXY_URL is not set - the bot cannot reach its APIs.");
}
