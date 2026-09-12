import { IllustrationBase } from "./Base";

export function ERPIllustration() {
  return (
    <IllustrationBase>
      <rect x="66" y="72" width="108" height="108" rx="14" fill="#bfdbfe" stroke="#0f172a" strokeWidth="4" />
      <rect x="186" y="72" width="108" height="108" rx="14" fill="#135bec" stroke="#0f172a" strokeWidth="4" />
      <rect x="126" y="188" width="108" height="88" rx="14" fill="white" stroke="#0f172a" strokeWidth="4" />
      <path d="M120 126H140M100 146H160M220 112H260M220 136H274M154 222H206M154 244H206" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      <circle cx="120" cy="126" r="7" fill="#135bec" />
      <circle cx="220" cy="112" r="7" fill="white" />
      <circle cx="180" cy="222" r="7" fill="#135bec" />
    </IllustrationBase>
  );
}
