import {
  IllustrationBase,
  illustrationStrokeLinejoin,
  illustrationStrokeLinecap,
  illustrationStrokeWidth,
} from "./Base";

export function HealthIllustration() {
  return (
    <IllustrationBase>
      <path d="M340 150C340 232.843 272.843 300 190 300C107.157 300 40 232.843 40 150C40 67.1573 107.157 0 190 0C272.843 0 340 67.1573 340 150Z" fill="#bfdbfe" fillOpacity="0.3" />
      <rect x="100" y="50" width="200" height="220" rx="20" fill="#e2e8f0" stroke="#0f172a" strokeWidth={illustrationStrokeWidth} />
      <path d="M150 50V40C150 28.9543 158.954 20 170 20H230C241.046 20 250 28.9543 250 40V50" stroke="#0f172a" strokeWidth={illustrationStrokeWidth} strokeLinecap={illustrationStrokeLinecap} />
      <rect x="120" y="80" width="160" height="140" rx="5" fill="white" fillOpacity="0.5" />
      <path d="M130 150H150L170 120L200 180L230 150H270" stroke="#135bec" strokeWidth={illustrationStrokeWidth} strokeLinecap={illustrationStrokeLinecap} strokeLinejoin={illustrationStrokeLinejoin} />
      <g transform="translate(260, 220)">
        <circle cx="30" cy="30" r="35" fill="white" stroke="#0f172a" strokeWidth={4} />
        <circle cx="30" cy="30" r="25" fill="#135bec" />
        <path d="M30 15V45M15 30H45" stroke="white" strokeWidth="6" strokeLinecap={illustrationStrokeLinecap} />
      </g>
    </IllustrationBase>
  );
}
