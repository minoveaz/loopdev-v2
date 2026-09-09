import { IllustrationBase } from "./Base";

export function TargetIllustration() {
  return (
    <IllustrationBase>
      <circle cx="200" cy="150" r="100" fill="white" stroke="#0f172a" strokeWidth={4} />
      <circle cx="200" cy="150" r="70" fill="#bfdbfe" stroke="#0f172a" strokeWidth={4} />
      <circle cx="200" cy="150" r="40" fill="white" stroke="#0f172a" strokeWidth={4} />
      <circle cx="200" cy="150" r="15" fill="#135bec" />
      <path d="M280 80L210 140" stroke="#0f172a" strokeWidth={6} strokeLinecap="round" />
      <path d="M280 80L290 70M280 80L270 70M280 80L285 65" stroke="#0f172a" strokeWidth={4} />
      <path d="M100 100L110 110M90 110L100 100" stroke="#135bec" strokeWidth={4} />
      <path d="M300 220L310 230M290 230L300 220" stroke="#135bec" strokeWidth={4} />
    </IllustrationBase>
  );
}
