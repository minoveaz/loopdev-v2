import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  APPEARANCE_STORAGE_KEY,
  BRAND_PALETTE,
  DEFAULT_APPEARANCE,
  RADIUS_TOKENS,
  sanitizeAppearance,
  type AppearanceConfig,
} from "@/config/themeConfig";
import { storage } from "@/lib/storage";

interface ThemeConfigContextValue {
  config: AppearanceConfig;
  set: <K extends keyof AppearanceConfig>(key: K, value: AppearanceConfig[K]) => void;
  setMany: (patch: Partial<AppearanceConfig>) => void;
  reset: () => void;
}

const ThemeConfigContext = createContext<ThemeConfigContextValue | undefined>(undefined);

function loadConfig(): AppearanceConfig {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    return sanitizeAppearance(JSON.parse(raw));
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function applyConfigToDom(config: AppearanceConfig, opts: { applyDir?: boolean } = {}) {
  const root = document.documentElement;
  // Brand — fall back to default if persisted brand is unknown.
  const brand = BRAND_PALETTE[config.brand] ?? BRAND_PALETTE[DEFAULT_APPEARANCE.brand];
  root.style.setProperty("--primary", brand.base);
  root.style.setProperty("--primary-glow", brand.glow);
  root.style.setProperty("--ring", brand.base);
  root.style.setProperty("--sidebar-primary", brand.base);
  root.style.setProperty("--sidebar-ring", brand.base);
  // Light/dark soft tokens — scoped by class via inline custom props.
  // We override --primary-soft for both modes; dark.dark redefines after.
  const isDark = root.classList.contains("dark");
  root.style.setProperty("--primary-soft", isDark ? brand.softDark : brand.soft);
  // Gradient using brand
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, hsl(${brand.base}), hsl(${brand.glow}))`,
  );

  // Radius — fall back to default if persisted radius is unknown.
  const radius = RADIUS_TOKENS[config.radius] ?? RADIUS_TOKENS[DEFAULT_APPEARANCE.radius];
  root.style.setProperty("--radius", radius.base);
  root.style.setProperty("--radius-sm", radius.sm);

  // Data attributes (consumed by index.css)
  root.dataset.brand = config.brand;
  root.dataset.density = config.density;
  root.dataset.sidebarStyle = config.sidebarStyle;
  root.dataset.navbarStyle = config.navbarStyle;
  root.dataset.radius = config.radius;
  root.dataset.contentWidth = config.contentWidth;
  root.dataset.chartStyle = config.chartStyle;
  root.dataset.headerHeight = config.headerHeight;
  root.dataset.headerPosition = config.headerPosition;

  // Direction is only written on initial mount and when the user flips
  // the Direction toggle. Other config changes (and class mutations)
  // leave `dir` alone so language-driven RTL stays RTL.
  if (opts.applyDir) {
    root.setAttribute("dir", config.direction === "rtl" ? "rtl" : "ltr");
  }
}

export function ThemeConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppearanceConfig>(() => loadConfig());
  const prevDirection = useRef<AppearanceConfig["direction"] | null>(null);

  // Apply theme tokens synchronously before paint to avoid a flash.
  useLayoutEffect(() => {
    const isFirst = prevDirection.current === null;
    const dirChanged = !isFirst && prevDirection.current !== config.direction;
    const language = storage.get<string | null>("ui:language", null);
    const languageControlsDirection = language === "ar" || language === "he";
    applyConfigToDom(config, { applyDir: (isFirst || dirChanged) && !languageControlsDirection });
    prevDirection.current = config.direction;
  }, [config]);

  // Re-apply brand tokens when the color-scheme class flips (dark mode).
  // We deliberately do NOT observe `dir` — the active language is the
  // source of truth for direction so RTL languages (ar/he) flip the UI.
  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName === "class") {
          applyConfigToDom(config, { applyDir: false });
          return;
        }
      }
    });
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [config]);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(config));
    } catch {
      /* ignore */
    }
  }, [config]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== APPEARANCE_STORAGE_KEY || !e.newValue) return;
      try {
        setConfig(sanitizeAppearance(JSON.parse(e.newValue)));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const set = useCallback(<K extends keyof AppearanceConfig>(key: K, value: AppearanceConfig[K]) => {
    setConfig((prev) => sanitizeAppearance({ ...prev, [key]: value }));
  }, []);

  const setMany = useCallback((patch: Partial<AppearanceConfig>) => {
    setConfig((prev) => sanitizeAppearance({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    // Explicitly clear persisted config so a stale payload can't be re-read
    // by another tab or an interrupted write. The persist effect will then
    // write defaults back on the next tick.
    try {
      localStorage.removeItem(APPEARANCE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setConfig(DEFAULT_APPEARANCE);
  }, []);

  const value = useMemo<ThemeConfigContextValue>(
    () => ({ config, set, setMany, reset }),
    [config, set, setMany, reset],
  );

  return <ThemeConfigContext.Provider value={value}>{children}</ThemeConfigContext.Provider>;
}

export function useThemeConfigContext() {
  const ctx = useContext(ThemeConfigContext);
  if (!ctx) throw new Error("useThemeConfigContext must be used within ThemeConfigProvider");
  return ctx;
}