import {
  HealthIllustration,
  ERPIllustration,
  PartnersIllustration,
  TargetIllustration,
  UIKitIllustration,
  WalletIllustration,
} from "./illustrations";
import { SuiteCard } from "./SuiteCard";
import { launchpadSuites } from "../../../packages/contracts/src/launchpad";

const illustrations = {
  marketing: <UIKitIllustration className="h-full w-full" />,
  crm: <PartnersIllustration />,
  erp: <ERPIllustration />,
  financial: <WalletIllustration />,
  quant: <TargetIllustration />,
  health: <HealthIllustration />,
};

export function SuiteCatalog() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {launchpadSuites.map((suite) => (
        <SuiteCard
          key={suite.id}
          title={suite.title}
          description={suite.description}
          version={suite.version}
          status={suite.status === "lab" ? "lab" : undefined}
          isLocked={suite.status === "locked"}
          to={suite.entryPath}
          illustration={illustrations[suite.illustration]}
        />
      ))}
    </div>
  );
}
