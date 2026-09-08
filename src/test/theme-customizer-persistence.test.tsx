import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ThemeConfigProvider } from "@/providers/ThemeConfigProvider";
import {
  APPEARANCE_STORAGE_KEY,
  BRAND_PALETTE,
  DEFAULT_APPEARANCE,
  RADIUS_TOKENS,
  type AppearanceConfig,
} from "@/config/themeConfig";

/**
 * Simulates a full page reload by:
 *  1. Writing an AppearanceConfig to localStorage
 *  2. Resetting the <html> element (attrs + inline style)
 *  3. Mounting <ThemeConfigProvider/> fresh — provider hydrates from storage on mount
 *  4. Asserting data-attributes + CSS variables on documentElement
 */

const ALL_VARIANTS: AppearanceConfig[] = [
  // Each setting flipped away from defaults at least once across the matrix.
  { mode: "light", brand: "indigo", density: "comfortable", sidebarStyle: "default", sidebarMode: "expanded", navbarStyle: "sticky", radius: "sharp", contentWidth: "full", chartStyle: "smooth", direction: "ltr", headerHeight: "standard", headerPosition: "sticky" },
  { mode: "dark", brand: "emerald", density: "compact", sidebarStyle: "compact", sidebarMode: "collapsed", navbarStyle: "static", radius: "standard", contentWidth: "centered", chartStyle: "linear", direction: "rtl", headerHeight: "standard", headerPosition: "sticky" },
  { mode: "system", brand: "violet", density: "comfortable", sidebarStyle: "floating", sidebarMode: "expanded", navbarStyle: "glass", radius: "soft", contentWidth: "full", chartStyle: "minimal", direction: "ltr", headerHeight: "standard", headerPosition: "sticky" },
  { mode: "light", brand: "rose", density: "compact", sidebarStyle: "default", sidebarMode: "collapsed", navbarStyle: "glass", radius: "soft", contentWidth: "centered", chartStyle: "minimal", direction: "rtl", headerHeight: "standard", headerPosition: "sticky" },
  { mode: "dark", brand: "amber", density: "comfortable", sidebarStyle: "compact", sidebarMode: "expanded", navbarStyle: "static", radius: "sharp", contentWidth: "full", chartStyle: "smooth", direction: "ltr", headerHeight: "standard", headerPosition: "sticky" },
  { mode: "system", brand: "slate", density: "compact", sidebarStyle: "floating", sidebarMode: "collapsed", navbarStyle: "sticky", radius: "standard", contentWidth: "centered", chartStyle: "linear", direction: "rtl", headerHeight: "standard", headerPosition: "sticky" },
  { mode: "light", brand: "blue", density: "comfortable", sidebarStyle: "default", sidebarMode: "expanded", navbarStyle: "sticky", radius: "standard", contentWidth: "full", chartStyle: "smooth", direction: "ltr", headerHeight: "standard", headerPosition: "sticky" },
];

function resetDom() {
  const root = document.documentElement;
  // Clear inline styles set by previous tests
  root.removeAttribute("style");
  // Clear data-* attrs
  ["brand","density","sidebarStyle","navbarStyle","radius","contentWidth","chartStyle"].forEach((k) => {
    delete root.dataset[k];
  });
  root.removeAttribute("dir");
  root.classList.remove("dark");
}

function simulateReload(config: AppearanceConfig) {
  localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(config));
  resetDom();
  cleanup();
  return render(<ThemeConfigProvider><div /></ThemeConfigProvider>);
}

describe("ThemeConfigProvider — persistence across reload", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDom();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    resetDom();
  });

  for (const config of ALL_VARIANTS) {
    it(`persists ${JSON.stringify(config)}`, () => {
      simulateReload(config);
      const root = document.documentElement;

      // Data attributes
      expect(root.dataset.brand).toBe(config.brand);
      expect(root.dataset.density).toBe(config.density);
      expect(root.dataset.sidebarStyle).toBe(config.sidebarStyle);
      expect(root.dataset.navbarStyle).toBe(config.navbarStyle);
      expect(root.dataset.radius).toBe(config.radius);
      expect(root.dataset.contentWidth).toBe(config.contentWidth);
      expect(root.dataset.chartStyle).toBe(config.chartStyle);

      // Direction
      expect(root.getAttribute("dir")).toBe(config.direction);

      // CSS variables — brand
      const brand = BRAND_PALETTE[config.brand];
      const style = root.style;
      expect(style.getPropertyValue("--primary").trim()).toBe(brand.base);
      expect(style.getPropertyValue("--primary-glow").trim()).toBe(brand.glow);
      expect(style.getPropertyValue("--ring").trim()).toBe(brand.base);
      expect(style.getPropertyValue("--sidebar-primary").trim()).toBe(brand.base);
      expect(style.getPropertyValue("--sidebar-ring").trim()).toBe(brand.base);
      expect(style.getPropertyValue("--gradient-primary")).toContain(`hsl(${brand.base})`);
      expect(style.getPropertyValue("--gradient-primary")).toContain(`hsl(${brand.glow})`);

      // CSS variables — radius
      const radius = RADIUS_TOKENS[config.radius];
      expect(style.getPropertyValue("--radius").trim()).toBe(radius.base);
      expect(style.getPropertyValue("--radius-sm").trim()).toBe(radius.sm);
    });
  }

  it("falls back to defaults when localStorage is empty", () => {
    localStorage.clear();
    resetDom();
    cleanup();
    render(<ThemeConfigProvider><div /></ThemeConfigProvider>);

    const root = document.documentElement;
    expect(root.dataset.brand).toBe(DEFAULT_APPEARANCE.brand);
    expect(root.dataset.radius).toBe(DEFAULT_APPEARANCE.radius);
    expect(root.dataset.density).toBe(DEFAULT_APPEARANCE.density);
    expect(root.getAttribute("dir")).toBe(DEFAULT_APPEARANCE.direction);

    const brand = BRAND_PALETTE[DEFAULT_APPEARANCE.brand];
    expect(root.style.getPropertyValue("--primary").trim()).toBe(brand.base);
  });

  it("survives a second mount with the same stored config (true reload simulation)", () => {
    const cfg: AppearanceConfig = {
      mode: "dark",
      brand: "rose",
      density: "compact",
      sidebarStyle: "floating",
      sidebarMode: "collapsed",
      navbarStyle: "glass",
      radius: "soft",
      contentWidth: "centered",
      chartStyle: "minimal",
      direction: "rtl",
      headerHeight: "tall",
      headerPosition: "static",
    };

    // First mount
    simulateReload(cfg);
    expect(document.documentElement.dataset.brand).toBe("rose");

    // Wipe DOM (but NOT localStorage) and remount — like the user reloading the page.
    resetDom();
    cleanup();
    render(<ThemeConfigProvider><div /></ThemeConfigProvider>);

    const root = document.documentElement;
    expect(root.dataset.brand).toBe("rose");
    expect(root.dataset.radius).toBe("soft");
    expect(root.dataset.sidebarStyle).toBe("floating");
    expect(root.dataset.chartStyle).toBe("minimal");
    expect(root.getAttribute("dir")).toBe("rtl");
    expect(root.style.getPropertyValue("--radius").trim()).toBe(RADIUS_TOKENS.soft.base);
    expect(root.style.getPropertyValue("--primary").trim()).toBe(BRAND_PALETTE.rose.base);
  });

  it("sanitizes and persists when stored value contains an invalid field", () => {
    localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_APPEARANCE, brand: "neon-pink", radius: "sharp" }),
    );
    resetDom();
    cleanup();
    render(<ThemeConfigProvider><div /></ThemeConfigProvider>);

    const root = document.documentElement;
    // Invalid brand → default
    expect(root.dataset.brand).toBe(DEFAULT_APPEARANCE.brand);
    // Valid radius preserved
    expect(root.dataset.radius).toBe("sharp");
    expect(root.style.getPropertyValue("--radius").trim()).toBe(RADIUS_TOKENS.sharp.base);
  });
});
