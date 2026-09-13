import { Circle, G, Line, Path, Rect, Svg } from "react-native-svg";

type SuiteIllustrationProps = {
  kind: "crm" | "marketing" | "erp" | "financial" | "quant" | "health";
};

export function SuiteIllustration({ kind }: SuiteIllustrationProps) {
  return (
    <Svg fill="none" height="170" viewBox="0 0 400 300" width="100%">
      {kind === "crm" && <CrmIllustration />}
      {kind === "marketing" && <MarketingIllustration />}
      {kind === "erp" && <ErpIllustration />}
      {kind === "financial" && <FinancialIllustration />}
      {kind === "quant" && <QuantIllustration />}
      {kind === "health" && <HealthIllustration />}
    </Svg>
  );
}

function CrmIllustration() {
  return (
    <>
      <Circle cx="200" cy="150" fill="#135bec" r="40" stroke="#ffffff" strokeWidth="4" />
      <Circle cx="200" cy="150" fill="#ffffff" r="20" />
      <Line stroke="#0f172a" strokeLinecap="round" strokeWidth="4" x1="200" x2="200" y1="110" y2="60" />
      <Line stroke="#0f172a" strokeLinecap="round" strokeWidth="4" x1="235" x2="280" y1="170" y2="200" />
      <Line stroke="#0f172a" strokeLinecap="round" strokeWidth="4" x1="165" x2="120" y1="170" y2="200" />
      <Circle cx="200" cy="40" fill="#ffffff" r="25" stroke="#0f172a" strokeWidth="4" />
      <Rect fill="#ffffff" height="50" rx="10" stroke="#0f172a" strokeWidth="4" width="50" x="270" y="190" />
      <Path d="M120 230L95 190L145 190L120 230Z" fill="#ffffff" stroke="#0f172a" strokeLinejoin="round" strokeWidth="4" />
      <Circle cx="200" cy="150" r="60" stroke="#bfdbfe" strokeDasharray="8 8" strokeWidth="2" />
      <Circle cx="200" cy="150" opacity="0.5" r="80" stroke="#bfdbfe" strokeDasharray="4 4" />
    </>
  );
}

function MarketingIllustration() {
  return (
    <>
      <Rect fill="#f8fafc" height="220" rx="15" stroke="#93c5fd" strokeWidth="8" width="280" x="60" y="40" />
      <Path d="M60 55C60 46.7 66.7 40 75 40H110V260H75C66.7 260 60 253.3 60 245V55Z" fill="#dbeafe" />
      <G transform="translate(140 70)">
        <Circle cx="20" cy="20" fill="#135bec" r="15" />
        <Circle cx="60" cy="20" fill="#ffd025" r="15" />
        <Circle cx="100" cy="20" fill="#93c5fd" r="15" />
      </G>
      <Line stroke="#135bec" strokeLinecap="round" strokeWidth="6" x1="140" x2="240" y1="120" y2="120" />
      <Line stroke="#93c5fd" strokeLinecap="round" strokeWidth="4" x1="140" x2="280" y1="140" y2="140" />
      <Line stroke="#93c5fd" strokeLinecap="round" strokeWidth="4" x1="140" x2="260" y1="155" y2="155" />
      <Rect fill="#135bec" height="30" rx="8" width="80" x="140" y="190" />
      <Rect fill="#ffffff" height="30" rx="8" stroke="#93c5fd" strokeWidth="3" width="80" x="230" y="190" />
      <Circle cx="300" cy="230" fill="#ffd025" fillOpacity="0.35" r="40" />
    </>
  );
}

function FinancialIllustration() {
  return (
    <>
      <Rect fill="#bfdbfe" height="90" rx="10" stroke="#0f172a" strokeWidth="4" transform="rotate(15 180 60)" width="140" x="180" y="60" />
      <Rect fill="#135bec" height="90" rx="10" stroke="#ffffff" strokeWidth="4" transform="rotate(-5 150 80)" width="140" x="150" y="80" />
      <Path d="M80 120H320C331 120 340 129 340 140V240C340 251 331 260 320 260H80C69 260 60 251 60 240V140C60 129 69 120 80 120Z" fill="#ffffff" stroke="#0f172a" strokeWidth="8" />
      <Line stroke="#0f172a" strokeWidth="4" x1="60" x2="340" y1="160" y2="160" />
      <Rect fill="#e2e8f0" height="30" rx="5" stroke="#0f172a" strokeWidth="4" width="40" x="180" y="140" />
    </>
  );
}

function ErpIllustration() {
  return (
    <>
      <Rect fill="#bfdbfe" height="108" rx="14" stroke="#0f172a" strokeWidth="4" width="108" x="66" y="72" />
      <Rect fill="#135bec" height="108" rx="14" stroke="#0f172a" strokeWidth="4" width="108" x="186" y="72" />
      <Rect fill="#ffffff" height="88" rx="14" stroke="#0f172a" strokeWidth="4" width="108" x="126" y="188" />
      <Line stroke="#0f172a" strokeLinecap="round" strokeWidth="5" x1="120" x2="140" y1="126" y2="126" />
      <Line stroke="#0f172a" strokeLinecap="round" strokeWidth="5" x1="100" x2="160" y1="146" y2="146" />
      <Line stroke="#0f172a" strokeLinecap="round" strokeWidth="5" x1="220" x2="260" y1="112" y2="112" />
      <Line stroke="#0f172a" strokeLinecap="round" strokeWidth="5" x1="220" x2="274" y1="136" y2="136" />
      <Circle cx="120" cy="126" fill="#135bec" r="7" />
      <Circle cx="220" cy="112" fill="#ffffff" r="7" />
      <Circle cx="180" cy="222" fill="#135bec" r="7" />
    </>
  );
}

function QuantIllustration() {
  return (
    <>
      <Circle cx="200" cy="150" fill="#ffffff" r="100" stroke="#0f172a" strokeWidth="4" />
      <Circle cx="200" cy="150" fill="#bfdbfe" r="70" stroke="#0f172a" strokeWidth="4" />
      <Circle cx="200" cy="150" fill="#ffffff" r="40" stroke="#0f172a" strokeWidth="4" />
      <Circle cx="200" cy="150" fill="#135bec" r="15" />
      <Path d="M280 80L210 140M280 80L290 70M280 80L270 70M280 80L285 65" stroke="#0f172a" strokeLinecap="round" strokeWidth="5" />
      <Path d="M100 100L110 110M90 110L100 100M300 220L310 230M290 230L300 220" stroke="#135bec" strokeWidth="4" />
    </>
  );
}

function HealthIllustration() {
  return (
    <>
      <Circle cx="190" cy="150" fill="#bfdbfe" fillOpacity="0.3" r="150" />
      <Rect fill="#e2e8f0" height="220" rx="20" stroke="#0f172a" strokeWidth="8" width="200" x="100" y="50" />
      <Path d="M150 50V40C150 29 159 20 170 20H230C241 20 250 29 250 40V50" stroke="#0f172a" strokeLinecap="round" strokeWidth="8" />
      <Rect fill="#ffffff" fillOpacity="0.5" height="140" rx="5" width="160" x="120" y="80" />
      <Path d="M130 150H150L170 120L200 180L230 150H270" stroke="#135bec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
      <Circle cx="290" cy="250" fill="#ffffff" r="35" stroke="#0f172a" strokeWidth="4" />
      <Circle cx="290" cy="250" fill="#135bec" r="25" />
      <Path d="M290 235V265M275 250H305" stroke="#ffffff" strokeLinecap="round" strokeWidth="6" />
    </>
  );
}
