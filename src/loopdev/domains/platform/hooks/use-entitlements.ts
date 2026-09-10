import { useEffect, useState } from "react";
import { platformAdapter } from "../adapter";
import type { OrganizationEntitlement } from "../entitlements";

export function useOrganizationEntitlements(organizationId = "local-development-organization") {
  const [entitlements, setEntitlements] = useState<OrganizationEntitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void platformAdapter.entitlements.list(organizationId).then((items) => {
      if (active) setEntitlements(items);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Please try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [organizationId, reloadToken]);

  return {
    entitlements,
    loading,
    error,
    hasFeature: (key: OrganizationEntitlement["key"]) => platformAdapter.entitlements.hasFeature(organizationId, key),
    canUse: (key: OrganizationEntitlement["key"], amount?: number) => platformAdapter.entitlements.canUse(organizationId, key, amount),
    reload: () => setReloadToken((token) => token + 1),
  };
}

