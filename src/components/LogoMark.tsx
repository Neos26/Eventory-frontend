interface LogoMarkProps {
  className?: string;
}

// Eventory mark: stacked isometric layers with a sparkle cutout, wrapped by an
// orbit arc. Rendered as a true cutout (fill-rule evenodd) so it works on any
// surface; color follows currentColor.
export default function LogoMark({ className = '' }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Eventory"
    >
      {/* Orbit arc */}
      <path
        d="M47 14 A34 34 0 0 1 72 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Top layer with sparkle cutout */}
      <path
        fillRule="evenodd"
        d="M39.9 25.5 Q46 22 52.1 25.5 L67.9 34.5 Q74 38 67.9 41.5 L52.1 50.5 Q46 54 39.9 50.5 L24.1 41.5 Q18 38 24.1 34.5 Z M46 29 Q47.6 36.4 55 38 Q47.6 39.6 46 47 Q44.4 39.6 37 38 Q44.4 36.4 46 29 Z"
      />
      {/* Lower layers */}
      <path
        d="M23 51 L46 65 L69 51"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 63 L46 77 L69 63"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
