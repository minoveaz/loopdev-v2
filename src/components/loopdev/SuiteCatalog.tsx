import {
  HealthIllustration,
  PartnersIllustration,
  TargetIllustration,
  UIKitIllustration,
  WalletIllustration,
} from "./illustrations";
import { SuiteCard } from "./SuiteCard";

const suites = [
  {
    title: "Marketing Studio",
    description: "High-performance identity governance and generative content engine for modern teams.",
    version: "1.0.4",
    isLocked: true,
    illustration: <UIKitIllustration className="h-full w-full" />,
  },
  {
    title: "Sales & CRM",
    description: "Pipeline intelligence and relationship management powered by predictive neural models.",
    version: "0.8.2",
    illustration: <PartnersIllustration />,
  },
  {
    title: "Financial Ops",
    description: "Automated billing, payroll, and industrial-grade fiscal compliance orchestration.",
    version: "0.5.0",
    isLocked: true,
    illustration: <WalletIllustration />,
  },
  {
    title: "Quant Ops",
    description: "Algorithmic trading engine and high-frequency execution command center.",
    version: "0.0.1",
    status: "lab" as const,
    isLocked: true,
    illustration: <TargetIllustration />,
  },
  {
    title: "Health OS",
    description: "Industrial-grade clinical care, electronic health records, and medical agenda for IPS providers.",
    version: "0.1.0",
    isLocked: true,
    illustration: <HealthIllustration />,
  },
] as const;

export function SuiteCatalog() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {suites.map((suite) => (
        <SuiteCard key={suite.title} {...suite} />
      ))}
    </div>
  );
}
