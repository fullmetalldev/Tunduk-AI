import { useId } from "react";

// Inline SVG flags - emoji flags don't render on Windows.

export const FlagGB = ({ className }) => {
  const id = useId();
  return (
    <svg
      className={className}
      viewBox="0 0 60 30"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <clipPath id={`${id}-diagonals`}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath={`url(#${id}-diagonals)`}
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
};

// Sun with 40 rays and the tunduk (yurt crown) in the middle
const KG_RAYS = Array.from({ length: 40 }, (_, i) => {
  const angle = (i / 40) * Math.PI * 2;
  const spread = Math.PI / 40;
  const point = (r, a) =>
    `${(25 + r * Math.cos(a)).toFixed(2)},${(15 + r * Math.sin(a)).toFixed(2)}`;
  return `${point(5, angle - spread)} ${point(8.5, angle)} ${point(5, angle + spread)}`;
});

export const FlagKG = ({ className }) => {
  const id = useId();
  return (
    <svg
      className={className}
      viewBox="0 0 50 30"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <clipPath id={`${id}-tunduk`}>
        <circle cx="25" cy="15" r="3.4" />
      </clipPath>
      <rect width="50" height="30" fill="#E8112D" />
      {KG_RAYS.map((points) => (
        <polygon key={points} points={points} fill="#FFEF00" />
      ))}
      <circle cx="25" cy="15" r="5.2" fill="#FFEF00" />
      <circle cx="25" cy="15" r="4.2" fill="#E8112D" />
      <circle cx="25" cy="15" r="3.4" fill="#FFEF00" />
      <g
        clipPath={`url(#${id}-tunduk)`}
        stroke="#E8112D"
        strokeWidth="0.6"
        fill="none"
      >
        <path d="M23.4,11 Q21.6,15 23.4,19 M25,11 V19 M26.6,11 Q28.4,15 26.6,19" />
        <path d="M21,13.4 Q25,11.6 29,13.4 M21,15 H29 M21,16.6 Q25,18.4 29,16.6" />
      </g>
    </svg>
  );
};
