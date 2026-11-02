import "./app.css";
import ColorBends from "./components/Backgrounds/ColorBends/ColorBends.jsx";
import Footer from "./layout/Footer/Footer.jsx";
import Header from "./layout/Header/Header.jsx";
import About from "./sections/About/About.jsx";
import ChatBot from "./sections/ChatBot/ChatBot.jsx";
import { I18nProvider } from "./i18n/I18n.jsx";

function App() {
  return (
    <I18nProvider>
      <div className="App">
        <div className="Background">
          <ColorBends
            colors={["#0B0810", "#B84CFF", "#5A189A"]}
            rotation={90}
            speed={0.2}
            scale={1}
            frequency={1}
            warpStrength={1}
            mouseInfluence={1}
            noise={0.15}
            parallax={0.5}
            iterations={1}
            intensity={1.5}
            bandWidth={6}
            transparent
            autoRotate={0}
            color="#B84CFF"
          />
        </div>

        <Header />
        <About />
        <ChatBot />
        <Footer />
      </div>
    </I18nProvider>
  );
}

export default App;
