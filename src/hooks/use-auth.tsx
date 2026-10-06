import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthSession as SharedAuthSession } from "@contracts/auth-port";
import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";

export interface LegacyCompatSession {
  userId?: string;
  email: string;
  name: string;
  role: string;
  signedInAt: string;
  accessToken?: string;
  refreshToken?: string;
  organizations?: Array<{ id: string; name: string; slug: string; role: string }>;
  activeOrganizationId?: string;
}

export const DEFAULT_LOCAL_ORGS = [
  {
    id: "80fce911-57c5-4a83-809f-78df6a3736f7",
    name: "Rivera Corp",
    slug: "rivera-corp",
    role: "admin",
  },
  {
    id: "local-development-organization",
    name: "Acme Corp",
    slug: "acme-corp",
    role: "admin",
  },
];

interface AuthContextValue {
  session: LegacyCompatSession | null;
  authSession: SharedAuthSession | null;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ sent: boolean; message: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  organizations: Array<{ id: string; name: string; slug: string; role: string }>;
  activeOrganization: { id: string; name: string; slug: string; role: string } | null;
  selectOrganization: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cachedSession, setCachedSession] = useState<LegacyCompatSession | null>(() =>
    storage.get<LegacyCompatSession | null>(STORAGE_KEYS.session, null),
  );
  const [authSession, setAuthSession] = useState<SharedAuthSession | null>(null);
  const [remoteOrganizations, setRemoteOrganizations] = useState<LegacyCompatSession["organizations"]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If we have cached session, not blocking initial render
    const stored = storage.get<LegacyCompatSession | null>(STORAGE_KEYS.session, null);
    return !stored;
  });

  useEffect(() => {
    let isMounted = true;

    // Initial check from adapter
    defaultWebAuthAdapter.getSession().then(async (s) => {
      if (!isMounted) return;
      if (s) {
        setAuthSession(s);
        const orgs = await defaultWebAuthAdapter.getUserOrganizations(s.user.id);
        setRemoteOrganizations(orgs);
        const activeOrgId = cachedSession?.activeOrganizationId && orgs.some((o) => o.id === cachedSession.activeOrganizationId)
          ? cachedSession.activeOrganizationId
          : orgs[0]?.id || "80fce911-57c5-4a83-809f-78df6a3736f7";

        const legacy: LegacyCompatSession = {
          userId: s.user.id,
          email: s.user.email,
          name: s.user.fullName,
          role: s.user.isSuperAdmin ? "owner" : "admin",
          signedInAt: s.user.updatedAt,
          accessToken: s.accessToken,
          refreshToken: s.refreshToken,
          organizations: orgs,
          activeOrganizationId: activeOrgId,
        };
        setCachedSession(legacy);
        storage.set(STORAGE_KEYS.session, legacy);
      }
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    const unsubscribe = defaultWebAuthAdapter.onAuthStateChange(async (_event, s) => {
      if (!isMounted) return;
      setAuthSession(s);
      if (s) {
        const orgs = await defaultWebAuthAdapter.getUserOrganizations(s.user.id);
        setRemoteOrganizations(orgs);
        const activeOrgId = cachedSession?.activeOrganizationId && orgs.some((o) => o.id === cachedSession.activeOrganizationId)
          ? cachedSession.activeOrganizationId
          : orgs[0]?.id || "80fce911-57c5-4a83-809f-78df6a3736f7";

        const legacy: LegacyCompatSession = {
          userId: s.user.id,
          email: s.user.email,
          name: s.user.fullName,
          role: s.user.isSuperAdmin ? "owner" : "admin",
          signedInAt: s.user.updatedAt,
          accessToken: s.accessToken,
          refreshToken: s.refreshToken,
          organizations: orgs,
          activeOrganizationId: activeOrgId,
        };
        setCachedSession(legacy);
        storage.set(STORAGE_KEYS.session, legacy);
      } else {
        setCachedSession(null);
        storage.remove(STORAGE_KEYS.session);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const legacySession: LegacyCompatSession | null = useMemo(() => {
    if (authSession) {
      return {
        userId: authSession.user.id,
        email: authSession.user.email,
        name: authSession.user.fullName,
        role: authSession.user.isSuperAdmin ? "owner" : "admin",
        signedInAt: authSession.user.updatedAt,
        accessToken: authSession.accessToken,
        refreshToken: authSession.refreshToken,
        organizations: remoteOrganizations.length ? remoteOrganizations : (cachedSession?.organizations || DEFAULT_LOCAL_ORGS),
        activeOrganizationId: cachedSession?.activeOrganizationId && (remoteOrganizations.length ? remoteOrganizations : (cachedSession?.organizations || DEFAULT_LOCAL_ORGS)).some((organization) => organization.id === cachedSession.activeOrganizationId)
          ? cachedSession.activeOrganizationId
          : (remoteOrganizations[0]?.id || DEFAULT_LOCAL_ORGS[0].id),
      };
    }
    return cachedSession;
  }, [authSession, cachedSession, remoteOrganizations]);

  const organizations = useMemo(() => {
    return legacySession?.organizations && legacySession.organizations.length > 0
      ? legacySession.organizations
      : DEFAULT_LOCAL_ORGS;
  }, [legacySession?.organizations]);

  const activeOrganization = useMemo(() => {
    const found = organizations.find((o) => o.id === legacySession?.activeOrganizationId);
    return found ?? organizations[0] ?? null;
  }, [organizations, legacySession?.activeOrganizationId]);

  const selectOrganization = (orgId: string) => {
    const target = organizations.find((o) => o.id === orgId);
    if (!legacySession) return;
    const updated = {
      ...legacySession,
      activeOrganizationId: orgId,
    };
    setCachedSession(updated);
    storage.set(STORAGE_KEYS.session, updated);
    toast.success(`Cambiado a ${target?.name ?? "organización"}`);
  };

  const signIn = async (email: string, password: string = "loopdev"): Promise<{ success: boolean; error?: string }> => {
    toast.dismiss();
    const result = await defaultWebAuthAdapter.signInWithPassword({ email, password });
    if (result.success) {
      const s = result.data;
      setAuthSession(s);
      const orgs = await defaultWebAuthAdapter.getUserOrganizations(s.user.id);
      setRemoteOrganizations(orgs);
      const activeOrgId = orgs[0]?.id || "80fce911-57c5-4a83-809f-78df6a3736f7";
      const legacy: LegacyCompatSession = {
        userId: s.user.id,
        email: s.user.email,
        name: s.user.fullName,
        role: s.user.isSuperAdmin ? "owner" : "admin",
        signedInAt: s.user.updatedAt,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        organizations: orgs,
        activeOrganizationId: activeOrgId,
      };
      setCachedSession(legacy);
      storage.set(STORAGE_KEYS.session, legacy);
      setIsLoading(false);

      logActivity({
        action: "logged_in",
        entity: "session",
        summary: `Signed in as ${s.user.fullName}`,
        toastOptions: { silent: true },
      });
      return { success: true };
    }
    const errorMsg = (result as { error: { message: string } }).error?.message || "Invalid credentials provided.";
    return { success: false, error: errorMsg };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    toast.dismiss();
    const res = await defaultWebAuthAdapter.signUpWithPassword({ email, password, fullName });
    if (res.success) {
      logActivity({
        action: "created",
        entity: "user",
        summary: `User account created for ${email}`,
        toastOptions: { silent: true },
      });
      return { success: true };
    }
    return { success: false, error: (res as { error: { message: string } }).error.message };
  };

  const signOut = async () => {
    toast.dismiss();
    const name = legacySession?.name;
    setCachedSession(null);
    setAuthSession(null);
    storage.remove(STORAGE_KEYS.session);
    await defaultWebAuthAdapter.signOut();
    logActivity({
      action: "logged_out",
      entity: "session",
      summary: name ? `${name} signed out` : "Signed out",
      toastOptions: { silent: true },
    });
  };

  const requestPasswordReset = async (email: string) => {
    const res = await defaultWebAuthAdapter.requestPasswordReset({ email });
    if (res.success) {
      return { sent: res.data.sent, message: res.data.message };
    }
    return { sent: false, message: (res as { error: { message: string } }).error.message };
  };

  const updatePassword = async (password: string) => {
    const res = await defaultWebAuthAdapter.updatePassword({ newPassword: password });
    if (res.success) {
      return { success: true };
    }
    return { success: false, error: (res as { error: { message: string } }).error.message };
  };

  return (
    <AuthContext.Provider
      value={{
        session: legacySession,
        authSession,
        isLoading,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
        organizations,
        activeOrganization,
        selectOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const fallbackOrg = DEFAULT_LOCAL_ORGS[0];

const fallbackAuthContext: AuthContextValue = {
  session: {
    userId: "local-development-user",
    email: "admin@loop.dev",
    name: "Alex Morgan",
    role: "admin",
    signedInAt: new Date().toISOString(),
    organizations: DEFAULT_LOCAL_ORGS,
    activeOrganizationId: fallbackOrg.id,
  },
  authSession: null,
  isLoading: false,
  signIn: async () => ({ success: true }),
  signUp: async () => ({ success: true }),
  signOut: async () => {},
  requestPasswordReset: async () => ({ sent: true, message: "OK" }),
  updatePassword: async () => ({ success: true }),
  organizations: DEFAULT_LOCAL_ORGS,
  activeOrganization: fallbackOrg,
  selectOrganization: () => {},
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? fallbackAuthContext;
}

