import {
  IllustrationBase,
  illustrationStrokeLinejoin,
} from "./Base";

export function PartnersIllustration() {
  return (
    <IllustrationBase>
      <circle cx="200" cy="150" r="40" fill="#135bec" stroke="white" strokeWidth="4" />
      <circle cx="200" cy="150" r="20" fill="white" />
      <path d="M200 110L200 60" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      <path d="M235 170L280 200" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      <path d="M165 170L120 200" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      <circle cx="200" cy="40" r="25" fill="white" stroke="#0f172a" strokeWidth={4} />
      <rect x="270" y="190" width="50" height="50" rx="10" fill="white" stroke="#0f172a" strokeWidth={4} />
      <path
        d="M120 230L95 190L145 190L120 230Z"
        fill="white"
        stroke="#0f172a"
        strokeWidth={4}
        strokeLinejoin={illustrationStrokeLinejoin}
      />
      <circle cx="200" cy="150" r="60" stroke="#bfdbfe" strokeWidth={2} strokeDasharray="8 8" />
      <circle cx="200" cy="150" r="80" stroke="#bfdbfe" strokeWidth={1} strokeDasharray="4 4" opacity="0.5" />
    </IllustrationBase>
  );
}
