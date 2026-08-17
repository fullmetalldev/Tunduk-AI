import { useEffect, useRef, useState } from "react";
import { Visualizer } from "../../components/Visualizer/Visualizer.jsx";
import AudioVolumeMeter from "../../components/Visualizer/AudioVolumeMeter.jsx";
// import { streamToBlob } from "../../api/ElevenLabs.js";
import SongMP from "../../components/Visualizer/song.mp3";
import "./ChatBot.scss";
import Logo from "../../components/Logo/Logo.jsx";
import YurtIcon from "../../assets/Yurt.jsx";
import Button from "../../components/Button/Button.jsx";
import DroppCall from "../../lib/callDrop.wav";
import JoinCall from "../../lib/callJoin.wav";

const ChatBot = () => {
  const currentAudioRef = useRef(null);
  const joinCallRef = useRef(null);
  const dropCallRef = useRef(null);
  const [volume, setVolume] = useState(0);
  const [currentAudioSrc, setCurrentAudioSrc] = useState(SongMP);
  const [botState, setBotState] = useState("idle");

  // useEffect(() => {
  //   const audio = currentAudioRef.current;
  //   if (!audio) return;

  //   const handleEnded = () => {
  //     setBotState("idle");
  //   };

  //   audio.addEventListener("ended", handleEnded);

  //   return () => {
  //     audio.removeEventListener("ended", handleEnded);
  //   };
  // }, []);

  const startConversation = () => {
    if (botState === "idle") {
      joinCallRef.current.play();
      setBotState("listening");
    } else {
      dropCallRef.current.play();
      setBotState("idle");
    }
  };

  return (
    <>
      <audio hidden controls src={DroppCall} ref={dropCallRef} />
      <audio hidden controls src={JoinCall} ref={joinCallRef} />
      <audio hidden controls src={currentAudioSrc} ref={currentAudioRef} />
      <AudioVolumeMeter
        audioRef={currentAudioRef}
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
                <span>v1.0 Beta</span>
              </div>
            </div>

            <div className="ChatBot__chatBox_content">
              <div className="ChatBot__chatBox_content-bot">
                <YurtIcon className={botState} />
                {currentAudioRef && (
                  <Visualizer
                    state={botState}
                    volume={volume}
                    audioRef={currentAudioRef}
                  />
                )}
              </div>

              <div className="ChatBot__chatBox_chat">
                <Button
                  className={botState === "idle" ? "bg-green" : "bg-red"}
                  onClick={() => startConversation()}
                >
                  {botState === "idle" ? "Talk to bot" : "Stop"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
export default ChatBot;
