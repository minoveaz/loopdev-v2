import { useEffect, useState } from "react";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { useT } from "@/i18n";
import type { Workspace } from "@contracts/auth-port";
import {
  HealthIllustration,
  ERPIllustration,
  PartnersIllustration,
  TargetIllustration,
  UIKitIllustration,
  WalletIllustration,
} from "./illustrations";
import { SuiteCard } from "./SuiteCard";
import { getLaunchpadSuitesForOrganization } from "../../../packages/contracts/src/launchpad";

const illustrations = {
  marketing: <UIKitIllustration className="h-full w-full" />,
  crm: <PartnersIllustration />,
  erp: <ERPIllustration />,
  financial: <WalletIllustration />,
  quant: <TargetIllustration />,
  health: <HealthIllustration />,
};

export function SuiteCatalog() {
  const { activeOrganization, listWorkspaces } = useTenantContext();
  const t = useT();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadWorkspaces = async () => {
      if (!activeOrganization) {
        setWorkspaces([]);
        setHasLoadError(false);
        setIsLoading(false);
        return;
      }

      if (activeOrganization.slug === "loopdev") {
        setWorkspaces([]);
        setHasLoadError(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasLoadError(false);
      const result = await listWorkspaces(activeOrganization.id);
      if (cancelled) return;

      if (result.success === false) {
        console.error("Failed to load Launchpad workspaces.", result.error);
        setHasLoadError(true);
      } else {
        setWorkspaces(result.data);
      }
      setIsLoading(false);
    };

    void loadWorkspaces().catch((error: unknown) => {
      console.error("Failed to load Launchpad workspaces.", error);
      if (!cancelled) {
        setHasLoadError(true);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeOrganization?.id, activeOrganization?.slug, listWorkspaces]);

  if (isLoading) {
    return <p role="status" className="py-8 text-center text-sm text-muted-foreground">{t("common.loopdev.launchpad.loadingSuites")}</p>;
  }

  if (hasLoadError) {
    return <p role="alert" className="py-8 text-center text-sm text-destructive">{t("common.loopdev.launchpad.loadError")}</p>;
  }

  const availableSuites = activeOrganization
    ? getLaunchpadSuitesForOrganization(activeOrganization.slug, workspaces)
    : [];

  return (
    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {availableSuites.map((suite) => (
        <SuiteCard
          key={suite.id}
          title={t(`common.loopdev.launchpad.suites.${suite.id}.title`)}
          description={t(`common.loopdev.launchpad.suites.${suite.id}.description`)}
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
