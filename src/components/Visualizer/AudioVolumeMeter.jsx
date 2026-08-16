import { useEffect, useRef } from "react";
import { createAnalyser } from "./audioGraph";

export default function AudioVolumeMeter({ audioRef, setVolume }) {
  const rafIdRef = useRef(null);

  useEffect(() => {
    const el = audioRef && audioRef.current;
    if (!el) return;

    const analyser = createAnalyser(el, { fftSize: 256 });
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setVolume(Math.round(average));

      rafIdRef.current = requestAnimationFrame(updateVolume);
    };
    updateVolume();

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      try {
        analyser.disconnect();
      } catch (e) {
        console.log(e);
        // already disconnected
      }
    };
  }, [audioRef, setVolume]);

  return <></>;
}
