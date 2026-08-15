import { useRef, useState } from "react";
import "./app.css";
import MoltenMetal from "./components/MoltenMetal/MoltenMetal.jsx";
import { Visualizer } from "./components/Visualizer/Visualizer.jsx";
import AudioVolumeMeter from "./components/Visualizer/AudioVolumeMeter.jsx";
import SongMP from "./components/Visualizer/song.mp3";
import { streamToBlob } from "./API/ElevenLabs.js";

function App() {
  const songRef = useRef(null);
  const [volume, setVolume] = useState(0);
  const [currentAudioSrc, setCurrentAudioSrc] = useState(SongMP);

  return (
    <div className="App">
      <div className="Background">
        <MoltenMetal
          color1="#5227FF"
          color2="#FF9FFC"
          color3="#FFFFFF"
          speed={0.35}
          scale={4}
          detail={3}
          glow={1.6}
          coreSize={0.1}
          swirl={1}
          fold={-0.2}
          blackPoint={0.05}
          brightness={1.3}
          colorMode="molten"
          grain
          grainIntensity={0.05}
          mouseInteraction
          mouseStrength={0.3}
          opacity={1}
        />
      </div>
      {songRef && <Visualizer volume={volume} audioRef={songRef} />}
      <AudioVolumeMeter
        audioRef={songRef}
        volume={volume}
        setVolume={setVolume}
      />
      <div style={{ position: "relative" }}>
        <audio controls src={currentAudioSrc} ref={songRef} />
        <button
          onClick={() =>
            streamToBlob(
              "Бар жоголчу алкаш десе, башы иштебеген иттин баласы !",
              songRef,
            ).then((res) => {
              setCurrentAudioSrc(res);
            })
          }
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
