import "./app.css";
import AcidSquares from "./components/AcidSquares.jsx";

function App() {
    return (
        <div className="App">
            <div className="Background">
                <AcidSquares
                    color1="#5227FF"
                    color2="#A855F7"
                    color3="#FFFFFF"
                    detail="medium"
                    speed={0.7}
                    waveDepth={1}
                    zoom={1.3}
                    density={10}
                    glow={1}
                    exposure={2700}
                    spread={0.3}
                    stepSize={0.002}
                    colorShift={0}
                    contrast={1}
                    brightness={1}
                    opacity={1}
                    mouseInteraction
                    mouseStrength={0.1}
                    mouseRadius={0.35}
                    blur={0}
                    grain
                    grainIntensity={0.05}
                /></div>

        </div>
    )
}

export default App
