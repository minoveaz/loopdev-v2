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

const REAL_PLATFORM_ORGANIZATIONS: Organization[] = [
  {
    id: "80fce911-57c5-4a83-809f-78df6a3736f7",
    slug: "loopdev",
    name: "LoopDev",
    logoUrl: null,
    status: "active",
    createdAt: "2026-09-14T10:00:00.000Z",
  },
  {
    id: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    slug: "estar-protegidos",
    name: "Estar Protegidos",
    logoUrl: null,
    status: "active",
    createdAt: "2026-09-14T10:00:00.000Z",
  },
];

const PLATFORM_WORKSPACES: Record<string, Workspace[]> = {
  "80fce911-57c5-4a83-809f-78df6a3736f7": [
    {
      id: "ws_loopdev_main",
      organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
      slug: "main",
      name: "Main Workspace",
      isDefault: true,
      createdAt: "2026-09-14T10:00:00.000Z",
    },
  ],
  "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed": [
    {
      id: "ws_estarprotegidos_main",
      organizationId: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      slug: "main",
      name: "Main Workspace",
      isDefault: true,
      createdAt: "2026-09-14T10:00:00.000Z",
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
    const workspaces = PLATFORM_WORKSPACES[org.id] ?? [];
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
      return { success: true, data: REAL_PLATFORM_ORGANIZATIONS };
    }

    // Standard user gets their assigned organizations
    const userOrgs = REAL_PLATFORM_ORGANIZATIONS.slice(0, 1);
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
    const wsList = PLATFORM_WORKSPACES[organizationId] ?? [];
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
