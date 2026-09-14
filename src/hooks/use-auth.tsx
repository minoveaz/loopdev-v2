import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthSession as SharedAuthSession } from "@contracts/auth-port";
import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";

export interface LegacyCompatSession {
  email: string;
  name: string;
  role: string;
  signedInAt: string;
}

interface AuthContextValue {
  session: LegacyCompatSession | null;
  authSession: SharedAuthSession | null;
  signIn: (email: string, password?: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ sent: boolean; message: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authSession, setAuthSession] = useState<SharedAuthSession | null>(null);

  useEffect(() => {
    // Initial check
    void defaultWebAuthAdapter.getSession().then((s) => {
      setAuthSession(s);
    });

    const unsubscribe = defaultWebAuthAdapter.onAuthStateChange((_event, s) => {
      setAuthSession(s);
    });

    return unsubscribe;
  }, []);

  const legacySession: LegacyCompatSession | null = authSession
    ? {
        email: authSession.user.email,
        name: authSession.user.fullName,
        role: authSession.user.isSuperAdmin ? "owner" : "admin",
        signedInAt: authSession.user.updatedAt,
      }
    : null;

  const signIn = async (email: string, password: string = "loopdev"): Promise<boolean> => {
    toast.dismiss();
    const result = await defaultWebAuthAdapter.signInWithPassword({ email, password });
    if (result.success) {
      logActivity({
        action: "logged_in",
        entity: "session",
        summary: `Signed in as ${result.data.user.fullName}`,
        toastOptions: { silent: true },
      });
      return true;
    }
    return false;
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
    const name = authSession?.user.fullName;
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
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
