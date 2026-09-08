import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import type { AuthSession } from "@/types";
import { logActivity } from "@/lib/activity";

interface AuthContextValue {
  session: AuthSession | null;
  signIn: (email: string, name?: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    storage.get<AuthSession | null>(STORAGE_KEYS.session, null),
  );

  useEffect(() => {
    if (session) storage.set(STORAGE_KEYS.session, session);
    else storage.remove(STORAGE_KEYS.session);
  }, [session]);

  const signIn = (email: string, name?: string) => {
    const display = name ?? email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase());
    setSession({
      email,
      name: display,
      role: "admin",
      signedInAt: new Date().toISOString(),
    });
    logActivity({ action: "logged_in", entity: "session", summary: `Signed in as ${display}` });
  };

  const signOut = () => {
    const name = session?.name;
    setSession(null);
    logActivity({ action: "logged_out", entity: "session", summary: name ? `${name} signed out` : "Signed out" });
  };

  return <AuthContext.Provider value={{ session, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
