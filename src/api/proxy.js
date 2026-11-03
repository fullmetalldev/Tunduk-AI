// Where the app reaches OpenAI and ElevenLabs: the API key proxy in api/ (Vercel
// Functions), so no keys are in the bundle. By default it is the /api of the
// site itself; VITE_API_PROXY_URL points a site hosted elsewhere (GitHub Pages)
// at it. Only the dev server (`npm run dev`) without VITE_API_PROXY_URL uses the
// VITE_*_API_KEY values from .env directly; production builds never include them.
export const API_PROXY_URL = (
  import.meta.env.VITE_API_PROXY_URL || `${window.location.origin}/api`
).replace(/\/+$/, "");
