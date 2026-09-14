import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  TenantContextSnapshot,
  Organization,
  Workspace,
  AuthResult,
} from "@contracts/auth-port";
import { TenantContextAdapter } from "@/loopdev/domains/platform/adapter/tenant-context";
import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import { useQueryClient } from "@tanstack/react-query";

interface TenantContextValue {
  tenantContext: TenantContextSnapshot | null;
  activeOrganization: Organization | null;
  activeWorkspace: Workspace | null;
  isSuperAdmin: boolean;
  listOrganizations: () => Promise<AuthResult<Organization[]>>;
  selectOrganization: (organizationId: string) => Promise<AuthResult<TenantContextSnapshot>>;
  listWorkspaces: (organizationId: string) => Promise<AuthResult<Workspace[]>>;
  selectWorkspace: (workspaceId: string | null) => Promise<AuthResult<TenantContextSnapshot>>;
  purgeCaches: () => Promise<void>;
}

const TenantReactContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantContextProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [adapter] = useState(() => {
    return new TenantContextAdapter(
      defaultWebAuthAdapter,
      undefined,
      () => {
        // Synchronous cache eviction for zero cross-tenant leakage
        queryClient.clear();
      }
    );
  });

  const [snapshot, setSnapshot] = useState<TenantContextSnapshot | null>(() => adapter.getTenantContext());

  useEffect(() => {
    adapter.setPurgeCallback(() => {
      queryClient.clear();
    });

    const unsubscribe = adapter.onTenantContextChange((next) => {
      setSnapshot(next);
    });

    return unsubscribe;
  }, [adapter, queryClient]);

  const value: TenantContextValue = {
    tenantContext: snapshot,
    activeOrganization: snapshot?.organization ?? null,
    activeWorkspace: snapshot?.workspace ?? null,
    isSuperAdmin: Boolean(snapshot?.isSuperAdmin),
    listOrganizations: () => adapter.listOrganizations(),
    selectOrganization: (orgId: string) => adapter.selectOrganization(orgId),
    listWorkspaces: (orgId: string) => adapter.listWorkspaces(orgId),
    selectWorkspace: (wsId: string | null) => adapter.selectWorkspace(wsId),
    purgeCaches: () => adapter.purgeCaches(),
  };

  return (
    <TenantReactContext.Provider value={value}>
      {children}
    </TenantReactContext.Provider>
  );
}

const defaultFallbackTenantValue: TenantContextValue = {
  tenantContext: null,
  activeOrganization: null,
  activeWorkspace: null,
  isSuperAdmin: false,
  listOrganizations: async () => ({ success: true, data: [] }),
  selectOrganization: async () => ({
    success: false,
    error: { code: "TENANT_NOT_FOUND", message: "No provider" },
  }),
  listWorkspaces: async () => ({ success: true, data: [] }),
  selectWorkspace: async () => ({
    success: false,
    error: { code: "TENANT_NOT_FOUND", message: "No provider" },
  }),
  purgeCaches: async () => {},
};

export function useTenantContext(): TenantContextValue {
  const ctx = useContext(TenantReactContext);
  return ctx ?? defaultFallbackTenantValue;
}
