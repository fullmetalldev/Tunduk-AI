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
