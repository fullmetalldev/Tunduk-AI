const YurtIcon = ({ className }) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
    >
      <defs>
        <clipPath id="inner-circle">
          <circle cx="100" cy="100" r="82" />
        </clipPath>
      </defs>

      <circle
        cx="100"
        cy="100"
        r="82"
        fill="none"
        stroke="#240b3d"
        strokeWidth="16"
      />

      <g
        clipPath="url(#inner-circle)"
        fill="none"
        stroke="#240b3d"
        strokeWidth="6"
        strokeLinecap="round"
      >
        <path d="M 40 180 Q 100 80 180 40" />
        <path d="M 25 165 Q 85 65 165 25" />
        <path d="M 10 150 Q 70 50 150 10" />

        <path d="M 160 180 Q 100 80 20 40" />
        <path d="M 175 165 Q 115 65 35 25" />
        <path d="M 190 150 Q 130 50 50 10" />
      </g>
    </svg>
  );
};
export default YurtIcon;
