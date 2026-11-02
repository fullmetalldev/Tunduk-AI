import { useId } from "react";

// Inline SVG flags - emoji flags don't render on Windows.

// 13 stripes, and 50 stars in 9 alternating rows of 6 and 5
const US_STRIPE = 100 / 13;
const US_CANTON = { width: 76, height: US_STRIPE * 7 };
const US_STARS = Array.from({ length: 9 }, (_, row) =>
  Array.from({ length: row % 2 ? 5 : 6 }, (_, col) => ({
    x: (US_CANTON.width / 12) * (col * 2 + (row % 2 ? 2 : 1)),
    y: (US_CANTON.height / 10) * (row + 1),
  })),
).flat();
// Five-pointed star centred on 0,0
const STAR_PATH = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 1.25 : 3.1;
  const a = (i * Math.PI) / 5 - Math.PI / 2;
  return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

export const FlagUS = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 190 100"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <rect width="190" height="100" fill="#fff" />
    {Array.from({ length: 7 }, (_, i) => (
      <rect
        key={i}
        y={i * 2 * US_STRIPE}
        width="190"
        height={US_STRIPE}
        fill="#B22234"
      />
    ))}
    <rect width={US_CANTON.width} height={US_CANTON.height} fill="#3C3B6E" />
    {US_STARS.map(({ x, y }) => (
      <polygon
        key={`${x}-${y}`}
        points={STAR_PATH}
        transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
        fill="#fff"
      />
    ))}
  </svg>
);

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
