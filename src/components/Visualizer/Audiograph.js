// Shared, page-wide registry so every consumer of the same <audio> element
// taps into ONE underlying audio graph.
//
// The Web Audio API only allows a single MediaElementAudioSourceNode to
// ever be created per <audio>/<video> element — a second
// createMediaElementSource() call on the same element throws
// "already connected to a different MediaElementSourceNode", even across
// separate AudioContext instances. If two components (e.g. a visualizer and
// a volume meter) each independently try to wire up the same audio element,
// only the first succeeds; the second's setup throws and its analyser never
// receives data — which looks like "volume stuck at 0" with no obvious cause.
//
// Fix: route every consumer through getAudioGraph()/createAnalyser() below,
// so there's exactly one AudioContext and one source per element, and each
// consumer just fans out its own AnalyserNode from that shared source.

const registry = new WeakMap();

export function getAudioGraph(el) {
  let graph = registry.get(el);
  if (graph && graph.audioContext.state !== "closed") return graph;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaElementSource(el);
  source.connect(audioContext.destination); // keep playback audible

  const resume = () => {
    if (audioContext.state === "suspended") audioContext.resume();
  };
  el.addEventListener("play", resume);
  if (!el.paused) resume();

  graph = { audioContext, source };
  registry.set(el, graph);
  return graph;
}

/**
 * Creates a new AnalyserNode tapped off this element's single shared
 * source. Safe to call from as many components as you want for the same
 * <audio> element — each gets its own analyser fed by the same source.
 */
export function createAnalyser(el, { fftSize = 256 } = {}) {
  const { audioContext, source } = getAudioGraph(el);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  source.connect(analyser);
  return analyser;
}

// iOS Safari only lets a page play audio it started from a tap, and audio
// routed through Web Audio is silent unless its AudioContext was resumed from
// a tap too - and the microphone a call opens can suspend it again. So on
// iOS the bot's voice is NOT routed through Web Audio at all (the orb just
// won't react to volume there).
export const isIOS =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

let silentAudioUrl = null;

// A few milliseconds of silence as a WAV file
const getSilentAudioUrl = () => {
  if (silentAudioUrl) return silentAudioUrl;
  const samples = 800;
  const sampleRate = 8000;
  const view = new DataView(new ArrayBuffer(44 + samples));
  const writeText = (offset, text) =>
    [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  writeText(8, "WAVEfmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // byte rate
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // bits per sample
  writeText(36, "data");
  view.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) view.setUint8(44 + i, 128); // silence
  silentAudioUrl = URL.createObjectURL(new Blob([view], { type: "audio/wav" }));
  return silentAudioUrl;
};

/**
 * Call from a click/tap handler. Plays silence on the element and resumes
 * its audio graph, so later play() calls made after awaits (when the bot's
 * reply is ready) are allowed by mobile browsers.
 */
export function unlockAudioElement(el) {
  if (!el) return;
  const graph = registry.get(el);
  if (graph?.audioContext.state !== "running") graph?.audioContext.resume();
  el.src = getSilentAudioUrl();
  el.play().catch(() => {});
}
