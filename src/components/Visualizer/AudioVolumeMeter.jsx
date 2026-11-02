import { useEffect, useRef } from "react";
import { createAnalyser, isIOS } from "./Audiograph.js";

// iOS loudness curve: one value per window of audio
const ENVELOPE_WINDOW_SECS = 0.05;
// Scales RMS (0..1) to roughly the 0..100 range the analyser gives for speech
const ENVELOPE_GAIN = 350;

const envelopeCache = new Map();

// Decodes the audio file separately (not through the playing element) and
// measures its loudness over time, so the orb can follow it on iOS.
const getEnvelope = (src) => {
  if (!envelopeCache.has(src)) {
    const envelope = fetch(src)
      .then((response) => response.arrayBuffer())
      .then((data) => {
        const Offline =
          window.OfflineAudioContext || window.webkitOfflineAudioContext;
        return new Offline(1, 1, 44100).decodeAudioData(data);
      })
      .then((audio) => {
        const samples = audio.getChannelData(0);
        const windowSize = Math.round(audio.sampleRate * ENVELOPE_WINDOW_SECS);
        const values = [];
        for (let start = 0; start < samples.length; start += windowSize) {
          const end = Math.min(start + windowSize, samples.length);
          let sum = 0;
          for (let i = start; i < end; i++) sum += samples[i] * samples[i];
          values.push(Math.sqrt(sum / (end - start)));
        }
        return values;
      })
      .catch((error) => {
        console.warn("Could not measure audio volume:", error);
        return null;
      });
    envelopeCache.set(src, envelope);
    // Only recent replies are ever replayed - forget the oldest
    if (envelopeCache.size > 10) {
      envelopeCache.delete(envelopeCache.keys().next().value);
    }
  }
  return envelopeCache.get(src);
};

export default function AudioVolumeMeter({ audioRef, setVolume }) {
  const rafIdRef = useRef(null);

  useEffect(() => {
    const el = audioRef && audioRef.current;
    if (!el) return;

    let readVolume;
    let cleanupMode;

    if (isIOS) {
      // See Audiograph.js: on iOS routing the element through Web Audio
      // mutes it, so follow a precomputed loudness curve instead
      let envelope = null;
      let envelopeSrc = null;
      const loadEnvelope = () => {
        const src = el.currentSrc;
        envelope = null;
        envelopeSrc = src;
        if (!src) return;
        getEnvelope(src).then((values) => {
          if (envelopeSrc === src) envelope = values;
        });
      };
      el.addEventListener("loadedmetadata", loadEnvelope);
      cleanupMode = () => el.removeEventListener("loadedmetadata", loadEnvelope);

      readVolume = () => {
        if (el.paused || !envelope) return 0;
        const value =
          envelope[Math.floor(el.currentTime / ENVELOPE_WINDOW_SECS)] ?? 0;
        return Math.min(100, value * ENVELOPE_GAIN);
      };
    } else {
      const analyser = createAnalyser(el, { fftSize: 256 });
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      cleanupMode = () => {
        try {
          analyser.disconnect();
        } catch (e) {
          console.log(e);
          // already disconnected
        }
      };

      readVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        return sum / dataArray.length;
      };
    }

    const updateVolume = () => {
      setVolume(Math.round(readVolume()));
      rafIdRef.current = requestAnimationFrame(updateVolume);
    };
    updateVolume();

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      cleanupMode();
    };
  }, [audioRef, setVolume]);

  return <></>;
}
