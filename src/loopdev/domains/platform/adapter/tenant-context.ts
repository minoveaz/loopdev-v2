import type {
  TenantContextPort,
  TenantContextSnapshot,
  Organization,
  Workspace,
  AuthResult,
  PlatformAuthStorage,
  AuthPort,
  PlatformRole,
} from "@contracts/auth-port";
import { BrowserLocalStorageAdapter } from "./auth-supabase";

// Mock catalog for dev environments and super admin view
const MOCK_PLATFORM_ORGANIZATIONS: Organization[] = [
  {
    id: "org_acme_corp",
    slug: "acme-global",
    name: "Acme Global Corp",
    logoUrl: null,
    status: "active",
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "org_starlight",
    slug: "starlight-ventures",
    name: "Starlight Ventures",
    logoUrl: null,
    status: "active",
    createdAt: "2026-02-20T11:30:00.000Z",
  },
  {
    id: "org_nexus_health",
    slug: "nexus-health",
    name: "Nexus Health SL",
    logoUrl: null,
    status: "active",
    createdAt: "2026-03-05T09:15:00.000Z",
  },
];

const MOCK_WORKSPACES: Record<string, Workspace[]> = {
  org_acme_corp: [
    {
      id: "ws_acme_sales",
      organizationId: "org_acme_corp",
      slug: "sales",
      name: "Sales & CRM",
      isDefault: true,
      createdAt: "2026-01-15T10:05:00.000Z",
    },
    {
      id: "ws_acme_ops",
      organizationId: "org_acme_corp",
      slug: "operations",
      name: "Operations & Logistics",
      isDefault: false,
      createdAt: "2026-01-15T10:10:00.000Z",
    },
  ],
  org_starlight: [
    {
      id: "ws_starlight_main",
      organizationId: "org_starlight",
      slug: "default",
      name: "Main Workspace",
      isDefault: true,
      createdAt: "2026-02-20T11:35:00.000Z",
    },
  ],
  org_nexus_health: [
    {
      id: "ws_nexus_clinical",
      organizationId: "org_nexus_health",
      slug: "clinical",
      name: "Clinical Trials",
      isDefault: true,
      createdAt: "2026-03-05T09:20:00.000Z",
    },
  ],
};

export class TenantContextAdapter implements TenantContextPort {
  private authPort: AuthPort;
  private storage: PlatformAuthStorage;
  private currentContext: TenantContextSnapshot | null = null;
  private listeners: Set<(context: TenantContextSnapshot | null) => void> = new Set();
  private onPurgeCallback?: () => void;

  constructor(authPort: AuthPort, storage?: PlatformAuthStorage, onPurge?: () => void) {
    this.authPort = authPort;
    this.storage = storage ?? new BrowserLocalStorageAdapter();
    this.onPurgeCallback = onPurge;

    // React to auth changes
    this.authPort.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        await this.purgeCaches();
        this.currentContext = null;
        this.emitChange();
      } else if (event === "SIGNED_IN") {
        await this.restoreOrCreateContext();
      }
    });

    // Initialize context
    void this.restoreOrCreateContext();
  }

  setPurgeCallback(callback: () => void) {
    this.onPurgeCallback = callback;
  }

  private async restoreOrCreateContext() {
    const session = await this.authPort.getSession();
    if (!session) {
      this.currentContext = null;
      this.emitChange();
      return;
    }

    const savedOrgId = await this.storage.getItem("loopdev.active_org_id");
    const orgsResult = await this.listOrganizations();
    const availableOrgs = orgsResult.success ? orgsResult.data : [];

    let targetOrg = availableOrgs.find((o) => o.id === savedOrgId);
    if (!targetOrg && availableOrgs.length > 0) {
      targetOrg = availableOrgs[0];
    }

    if (targetOrg) {
      await this.buildAndSetSnapshot(targetOrg, session.user.isSuperAdmin);
    }
  }

  private async buildAndSetSnapshot(org: Organization, isSuperAdmin: boolean, workspaceId?: string | null) {
    const workspaces = MOCK_WORKSPACES[org.id] ?? [];
    const activeWs = workspaceId ? workspaces.find((w) => w.id === workspaceId) ?? null : workspaces[0] ?? null;
    const role: PlatformRole = isSuperAdmin ? "owner" : "admin";

    this.currentContext = {
      activeOrganizationId: org.id,
      activeWorkspaceId: activeWs?.id ?? null,
      organization: org,
      workspace: activeWs,
      userRole: role,
      permissions: [
        "org.read",
        "org.update",
        "members.read",
        "members.invite",
        "notes.read",
        "notes.create",
        "notes.edit",
        "notes.delete",
      ],
      isSuperAdmin,
    };

    await this.storage.setItem("loopdev.active_org_id", org.id);
    this.emitChange();
  }

  private emitChange() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentContext);
      } catch (e) {
        console.error("TenantContext listener error", e);
      }
    }
  }

  getTenantContext(): TenantContextSnapshot | null {
    return this.currentContext;
  }

  onTenantContextChange(callback: (context: TenantContextSnapshot | null) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async listOrganizations(): Promise<AuthResult<Organization[]>> {
    const session = await this.authPort.getSession();
    if (!session) {
      return {
        success: false,
        error: {
          code: "AUTH_SESSION_EXPIRED",
          message: "No authenticated session found.",
        },
      };
    }

    // DEC-AUTH-003: If user is Super Admin / Owner global, return ALL platform organizations.
    if (session.user.isSuperAdmin) {
      return { success: true, data: MOCK_PLATFORM_ORGANIZATIONS };
    }

    // Standard user gets their assigned organizations
    const userOrgs = MOCK_PLATFORM_ORGANIZATIONS.slice(0, 1);
    return { success: true, data: userOrgs };
  }

  async selectOrganization(organizationId: string): Promise<AuthResult<TenantContextSnapshot>> {
    const orgsResult = await this.listOrganizations();
    if (!orgsResult.success) {
      return {
        success: false,
        error: (orgsResult as { error: { code: any; message: string } }).error,
      };
    }

    const targetOrg = orgsResult.data.find((o) => o.id === organizationId);
    if (!targetOrg) {
      return {
        success: false,
        error: {
          code: "TENANT_NOT_FOUND",
          message: `Organization ${organizationId} was not found or access is denied.`,
        },
      };
    }

    // DEC-AUTH-005: Atomic Purge on Tenant Switch
    await this.purgeCaches();

    const session = await this.authPort.getSession();
    const isSuperAdmin = Boolean(session?.user.isSuperAdmin);

    await this.buildAndSetSnapshot(targetOrg, isSuperAdmin);
    return { success: true, data: this.currentContext! };
  }

  async listWorkspaces(organizationId: string): Promise<AuthResult<Workspace[]>> {
    const wsList = MOCK_WORKSPACES[organizationId] ?? [];
    return { success: true, data: wsList };
  }

  async selectWorkspace(workspaceId: string | null): Promise<AuthResult<TenantContextSnapshot>> {
    if (!this.currentContext) {
      return {
        success: false,
        error: {
          code: "TENANT_NOT_FOUND",
          message: "No active organization selected.",
        },
      };
    }

    await this.buildAndSetSnapshot(
      this.currentContext.organization,
      this.currentContext.isSuperAdmin,
      workspaceId
    );

    return { success: true, data: this.currentContext };
  }

  async purgeCaches(): Promise<void> {
    if (this.onPurgeCallback) {
      try {
        this.onPurgeCallback();
      } catch (err) {
        console.error("Purge callback execution failed", err);
      }
    }
  }
}
