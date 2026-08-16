import { Orb } from "orb-ui";

export function Visualizer({ state, volume }) {
  return (
    <Orb size={300} state={"connecting"} volume={volume / 20} theme="circle" />
  );
}
