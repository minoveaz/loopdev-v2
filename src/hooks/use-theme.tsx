import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";

/**
 * Tri-state theme with live OS-preference syncing.
 *  - `theme` is the user's *choice*: "light" | "dark" | "system".
 *  - `resolvedTheme` is what's actually painted: "light" | "dark".
 *
 * Backward-compat: legacy stored values "light"/"dark" still load fine.
 */

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
  /** Cycles light → dark → system → light. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const META_THEME_COLOR: Record<ResolvedTheme, string> = {
  light: "#fafbfc",
  dark: "#0d1018",
};

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  // Keep mobile browser chrome in sync with the active palette.
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = META_THEME_COLOR[resolved];
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = storage.get<Theme | null>(STORAGE_KEYS.theme, null);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return "system";
  });

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  // Live-listen to OS preference changes so "system" tracks in real time.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  // Apply + persist whenever the resolved value changes.
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.theme, theme);
  }, [theme]);

  // Cross-tab sync — mirror choice across windows.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "rivera:theme" || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue) as Theme;
        if (next === "light" || next === "dark" || next === "system") setThemeState(next);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const toggle = useCallback(() => {
    setThemeState((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));
  }, []);

  // ⌘⇧L / Ctrl+Shift+L — quick-cycle theme.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && (e.key === "L" || e.key === "l")) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggle }),
    [theme, resolvedTheme, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
