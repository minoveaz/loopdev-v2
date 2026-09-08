import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useThemeConfig } from "@/hooks/useThemeConfig";
import { storage, STORAGE_KEYS } from "@/lib/storage";

/**
 * Bridges the appearance config with legacy single-purpose stores so the
 * existing app shell keeps working without a refactor:
 *  - `mode` ↔ ThemeProvider (light/dark/system)
 *  - `sidebarMode` ↔ rivera:sidebar:collapsed
 */
export function ThemeConfigBridge() {
  const { config, set } = useThemeConfig();
  const { theme, setTheme } = useTheme();

  // mode → theme (one-way: appearance is the source of truth on change)
  useEffect(() => {
    if (theme !== config.mode) setTheme(config.mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.mode]);

  // theme → mode (when toggled from elsewhere, e.g. ⌘⇧L)
  useEffect(() => {
    if (theme !== config.mode) set("mode", theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // sidebarMode → legacy collapsed flag
  useEffect(() => {
    storage.set(STORAGE_KEYS.sidebarCollapsed, config.sidebarMode === "collapsed");
    window.dispatchEvent(new StorageEvent("storage", { key: "rivera:" + STORAGE_KEYS.sidebarCollapsed }));
  }, [config.sidebarMode]);

  return null;
}