import {
  IllustrationBase,
  illustrationStrokeLinecap,
  illustrationStrokeLinejoin,
  illustrationStrokeWidth,
} from "./Base";

export function UIKitIllustration({ className }: { className?: string }) {
  return (
    <IllustrationBase className={className}>
      <rect
        x="60"
        y="40"
        width="280"
        height="220"
        rx="15"
        fill="currentColor"
        fillOpacity="0.05"
        stroke="currentColor"
        strokeWidth={illustrationStrokeWidth}
        strokeLinejoin={illustrationStrokeLinejoin}
        className="text-primary/30"
      />
      <path
        d="M60 55C60 46.7157 66.7157 40 75 40H110V260H75C66.7157 260 60 253.284 60 245V55Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth={illustrationStrokeWidth}
        className="text-primary/40"
      />
      <g transform="translate(140, 70)">
        <circle cx="20" cy="20" r="15" fill="#135BEC" />
        <circle cx="60" cy="20" r="15" fill="#FFD025" />
        <circle cx="100" cy="20" r="15" fill="currentColor" fillOpacity="0.2" className="text-primary" />
      </g>
      <path
        d="M140 120H240"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap={illustrationStrokeLinecap}
        className="text-primary"
      />
      <path
        d="M140 140H280"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap={illustrationStrokeLinecap}
        className="text-primary/30"
      />
      <path
        d="M140 155H260"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap={illustrationStrokeLinecap}
        className="text-primary/30"
      />
      <g transform="translate(140, 190)">
        <rect x="0" y="0" width="80" height="30" rx="8" fill="#135BEC" />
        <rect
          x="90"
          y="0"
          width="80"
          height="30"
          rx="8"
          fill="transparent"
          stroke="currentColor"
          strokeWidth={3}
          className="text-primary/40"
        />
      </g>
      <circle
        cx="300"
        cy="230"
        r="40"
        fill="#FFD025"
        fillOpacity="0.2"
        className="animate-pulse"
      />
      <path
        d="M280 250L320 210"
        stroke="#135BEC"
        strokeWidth={6}
        strokeLinecap={illustrationStrokeLinecap}
      />
    </IllustrationBase>
  );
}
