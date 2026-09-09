import { IllustrationBase, illustrationStrokeWidth } from "./Base";

export function WalletIllustration() {
  return (
    <IllustrationBase>
      <rect x="180" y="60" width="140" height="90" rx="10" transform="rotate(15 180 60)" fill="#bfdbfe" stroke="#0f172a" strokeWidth={4} />
      <rect x="150" y="80" width="140" height="90" rx="10" transform="rotate(-5 150 80)" fill="#135bec" stroke="white" strokeWidth={4} />
      <path
        d="M80 120H320C331.046 120 340 128.954 340 140V240C340 251.046 331.046 260 320 260H80C68.9543 260 60 251.046 60 240V140C60 128.954 68.9543 120 80 120Z"
        fill="white"
        stroke="#0f172a"
        strokeWidth={illustrationStrokeWidth}
      />
      <path d="M60 160H340" stroke="#0f172a" strokeWidth={4} />
      <rect x="180" y="140" width="40" height="30" rx="5" fill="#e2e8f0" stroke="#0f172a" strokeWidth={4} />
    </IllustrationBase>
  );
}
