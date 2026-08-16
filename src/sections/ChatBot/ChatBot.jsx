import { useEffect, useRef, useState } from "react";
import { Visualizer } from "../../components/Visualizer/Visualizer.jsx";
import AudioVolumeMeter from "../../components/Visualizer/AudioVolumeMeter.jsx";
// import { streamToBlob } from "../../api/ElevenLabs.js";
import SongMP from "../../components/Visualizer/song.mp3";
import "./ChatBot.scss";
import Logo from "../../components/Logo/Logo.jsx";
import YurtIcon from "../../assets/Yurt.jsx";
import Button from "../../components/Button/Button.jsx";

const ChatBot = () => {
  const songRef = useRef(null);
  const [volume, setVolume] = useState(0);
  const [currentAudioSrc, setCurrentAudioSrc] = useState(SongMP);
  const [botState, setBotState] = useState("thinking");

  useEffect(() => {
    const audio = songRef.current;
    if (!audio) return;
    const handleEnded = () => {
      setBotState("thinking");
    };
    audio.addEventListener("ended", handleEnded);
  }, []);

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
                <YurtIcon
                  className={botState === "speaking" ? "speakingBot" : ""}
                />
                {songRef && (
                  <Visualizer
                    state={botState}
                    volume={volume}
                    audioRef={songRef}
                  />
                )}
              </div>
              <Button
                onClick={() => {
                  setBotState("speaking");
                  songRef.current.play();
                }}
              >
                Talk
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
export default ChatBot;
