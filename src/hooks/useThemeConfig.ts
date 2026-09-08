import { useThemeConfigContext } from "@/providers/ThemeConfigProvider";

/**
 * Public hook for reading and mutating Rivera's appearance config.
 * Returns `{ config, set, setMany, reset }`.
 */
export function useThemeConfig() {
  return useThemeConfigContext();
}