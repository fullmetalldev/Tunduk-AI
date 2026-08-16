import { Orb } from "orb-ui";

export function Visualizer({ state, volume }) {
  return (
    <Orb size={300} state={state} volume={volume / 80} theme="circle" />
  );
}
