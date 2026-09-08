/**
 * Rivera — global appearance configuration.
 * All values persist to localStorage under `rivera:appearance`.
 * The provider applies them as data-attributes on <html>, and `index.css`
 * picks them up via attribute selectors so no component needs refactor.
 */

export type ColorMode = "light" | "dark" | "system";
export type BrandColor =
  | "indigo"
  | "blue"
  | "emerald"
  | "violet"
  | "rose"
  | "amber"
  | "slate";
export type Density = "comfortable" | "compact";
export type SidebarStyle = "default" | "compact" | "floating";
export type SidebarMode = "expanded" | "collapsed";
export type NavbarStyle = "sticky" | "static" | "glass";
export type Radius = "sharp" | "standard" | "soft";
export type ContentWidth = "full" | "centered";
export type ChartStyle = "smooth" | "linear" | "minimal";
export type Direction = "ltr" | "rtl";
export type HeaderHeight = "compact" | "standard" | "tall";
export type HeaderPosition = "fixed" | "sticky" | "static" | "hidden";

export interface AppearanceConfig {
  mode: ColorMode;
  brand: BrandColor;
  density: Density;
  sidebarStyle: SidebarStyle;
  sidebarMode: SidebarMode;
  navbarStyle: NavbarStyle;
  radius: Radius;
  contentWidth: ContentWidth;
  chartStyle: ChartStyle;
  direction: Direction;
  headerHeight: HeaderHeight;
  headerPosition: HeaderPosition;
}

export const APPEARANCE_STORAGE_KEY = "rivera-theme-config";

export const DEFAULT_APPEARANCE: AppearanceConfig = {
  mode: "system",
  brand: "indigo",
  density: "comfortable",
  sidebarStyle: "default",
  sidebarMode: "expanded",
  navbarStyle: "sticky",
  radius: "standard",
  contentWidth: "full",
  chartStyle: "smooth",
  direction: "ltr",
  headerHeight: "standard",
  headerPosition: "fixed",
};

/**
 * Brand palette — HSL tuples. Tuned so white text passes AA on `base`,
 * and `glow` reads on dark backgrounds.
 * [base, glow, soft (light), softDark]
 */
export const BRAND_PALETTE: Record<
  BrandColor,
  { base: string; glow: string; soft: string; softDark: string; label: string; swatch: string }
> = {
  indigo: {
    base: "234 80% 58%",
    glow: "234 86% 68%",
    soft: "234 92% 96.5%",
    softDark: "234 50% 18%",
    label: "Indigo",
    swatch: "#4f46e5",
  },
  blue: {
    base: "214 88% 52%",
    glow: "214 92% 62%",
    soft: "214 92% 96%",
    softDark: "214 50% 18%",
    label: "Blue",
    swatch: "#2563eb",
  },
  emerald: {
    base: "158 70% 40%",
    glow: "158 70% 50%",
    soft: "158 70% 94%",
    softDark: "158 50% 16%",
    label: "Emerald",
    swatch: "#059669",
  },
  violet: {
    base: "262 76% 56%",
    glow: "262 82% 66%",
    soft: "262 80% 96%",
    softDark: "262 50% 20%",
    label: "Violet",
    swatch: "#7c3aed",
  },
  rose: {
    base: "346 78% 54%",
    glow: "346 84% 64%",
    soft: "346 84% 96%",
    softDark: "346 50% 18%",
    label: "Rose",
    swatch: "#e11d48",
  },
  amber: {
    base: "32 92% 50%",
    glow: "36 96% 60%",
    soft: "36 96% 94%",
    softDark: "36 70% 18%",
    label: "Amber",
    swatch: "#d97706",
  },
  slate: {
    base: "222 28% 28%",
    glow: "222 22% 40%",
    soft: "220 16% 94%",
    softDark: "222 16% 22%",
    label: "Slate",
    swatch: "#475569",
  },
};

export const RADIUS_TOKENS: Record<Radius, { base: string; sm: string }> = {
  sharp: { base: "0.25rem", sm: "0.1875rem" },
  standard: { base: "0.5rem", sm: "0.375rem" },
  soft: { base: "0.75rem", sm: "0.5rem" },
};

/**
 * Allowed values for each appearance key. Used by `sanitizeAppearance()` to
 * coerce malformed / unknown persisted values back to their default.
 */
export const APPEARANCE_ALLOWED: { [K in keyof AppearanceConfig]: readonly AppearanceConfig[K][] } = {
  mode: ["light", "dark", "system"],
  brand: ["indigo", "blue", "emerald", "violet", "rose", "amber", "slate"],
  density: ["comfortable", "compact"],
  sidebarStyle: ["default", "compact", "floating"],
  sidebarMode: ["expanded", "collapsed"],
  navbarStyle: ["sticky", "static", "glass"],
  radius: ["sharp", "standard", "soft"],
  contentWidth: ["full", "centered"],
  chartStyle: ["smooth", "linear", "minimal"],
  direction: ["ltr", "rtl"],
  headerHeight: ["compact", "standard", "tall"],
  headerPosition: ["fixed", "sticky", "static", "hidden"],
};

/**
 * Validate an arbitrary `unknown` value against `DEFAULT_APPEARANCE`, replacing
 * any missing or out-of-range field with its default. Always returns a fully
 * populated, type-safe AppearanceConfig.
 */
export function sanitizeAppearance(input: unknown): AppearanceConfig {
  const out: AppearanceConfig = { ...DEFAULT_APPEARANCE };
  if (!input || typeof input !== "object") return out;
  const src = input as Record<string, unknown>;
  (Object.keys(out) as (keyof AppearanceConfig)[]).forEach((key) => {
    const v = src[key];
    const allowed = APPEARANCE_ALLOWED[key] as readonly unknown[];
    if (typeof v === "string" && allowed.includes(v)) {
      // Safe: membership in `allowed` proves the type.
      (out[key] as unknown) = v;
    }
  });
  return out;
}