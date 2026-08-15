import { Orb } from "orb-ui";

export function Visualizer({ state, volume }) {
  console.log(volume);
  return <Orb state={"speaking"} volume={volume / 20} theme="circle" />;
}
