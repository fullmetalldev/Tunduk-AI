import { useRef, useState } from "react";
import { Visualizer } from "../../components/Visualizer/Visualizer.jsx";
import AudioVolumeMeter from "../../components/Visualizer/AudioVolumeMeter.jsx";
// import { streamToBlob } from "../../api/ElevenLabs.js";
import SongMP from "../../components/Visualizer/song.mp3";
import "./ChatBot.scss";
import Logo from "../../components/Logo/Logo.jsx";
import YurtIcon from "../../assets/Yurt.jsx";

const ChatBot = () => {
  const songRef = useRef(null);
  const [volume, setVolume] = useState(0);
  const [currentAudioSrc, setCurrentAudioSrc] = useState(SongMP);

  return (
    <>
      <audio hidden controls src={currentAudioSrc} ref={songRef} />
      <AudioVolumeMeter
        audioRef={songRef}
        volume={volume}
        setVolume={setVolume}
      />

      <section className="ChatBot">
        <div className="container">
          <div className="ChatBot__chatBox">
            <div className="ChatBot__chatBox_header">
              <div className="ChatBot__chatBox_header-buttons">
                <div className="circle bg-red"></div>
                <div className="circle bg-yellow"></div>
                <div className="circle bg-green"></div>
              </div>
              <div className="ChatBot__chatBox_header-info">
                <Logo />
                <span>v1.0</span>
              </div>
            </div>

            <div className="ChatBot__chatBox_content">
              <div className="ChatBot__chatBox_content-bot">
                <YurtIcon />
                {songRef && <Visualizer volume={volume} audioRef={songRef} />}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
export default ChatBot;
