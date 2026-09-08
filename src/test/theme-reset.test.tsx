import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { ThemeConfigProvider } from "@/providers/ThemeConfigProvider";
import { useThemeConfig } from "@/hooks/useThemeConfig";
import {
  APPEARANCE_STORAGE_KEY,
  BRAND_PALETTE,
  DEFAULT_APPEARANCE,
  RADIUS_TOKENS,
  type AppearanceConfig,
} from "@/config/themeConfig";

const NON_DEFAULT: AppearanceConfig = {
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

function Probe({ onReady }: { onReady: (api: ReturnType<typeof useThemeConfig>) => void }) {
  const api = useThemeConfig();
  onReady(api);
  return <span data-testid="brand">{api.config.brand}</span>;
}

function resetDom() {
  const root = document.documentElement;
  root.removeAttribute("style");
  ["brand","density","sidebarStyle","navbarStyle","radius","contentWidth","chartStyle"].forEach((k) => {
    delete root.dataset[k];
  });
  root.removeAttribute("dir");
}

describe("Theme reset — clears storage + restores defaults app-wide", () => {
  beforeEach(() => { localStorage.clear(); resetDom(); });
  afterEach(() => { cleanup(); localStorage.clear(); resetDom(); });

  it("clears the rivera-theme-config localStorage entry on reset", async () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(NON_DEFAULT));
    let api: ReturnType<typeof useThemeConfig> | null = null;
    render(<ThemeConfigProvider><Probe onReady={(a) => (api = a)} /></ThemeConfigProvider>);

    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toContain("rose");

    act(() => api!.reset());

    // The persist effect re-writes defaults on the next tick — but the
    // *removal* must happen synchronously inside reset() so a concurrent
    // tab can never read the stale payload.
    // After flush, the entry contains the defaults (not the old non-default config).
    await act(async () => { await Promise.resolve(); });
    const persisted = JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY)!);
    expect(persisted).toEqual(DEFAULT_APPEARANCE);
    expect(persisted.brand).not.toBe("rose");
  });

  it("restores all <html> data attributes to their default values", () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(NON_DEFAULT));
    let api: ReturnType<typeof useThemeConfig> | null = null;
    render(<ThemeConfigProvider><Probe onReady={(a) => (api = a)} /></ThemeConfigProvider>);

    const root = document.documentElement;
    expect(root.dataset.brand).toBe("rose");
    expect(root.dataset.radius).toBe("soft");
    expect(root.getAttribute("dir")).toBe("rtl");

    act(() => api!.reset());

    expect(root.dataset.brand).toBe(DEFAULT_APPEARANCE.brand);
    expect(root.dataset.density).toBe(DEFAULT_APPEARANCE.density);
    expect(root.dataset.sidebarStyle).toBe(DEFAULT_APPEARANCE.sidebarStyle);
    expect(root.dataset.navbarStyle).toBe(DEFAULT_APPEARANCE.navbarStyle);
    expect(root.dataset.radius).toBe(DEFAULT_APPEARANCE.radius);
    expect(root.dataset.contentWidth).toBe(DEFAULT_APPEARANCE.contentWidth);
    expect(root.dataset.chartStyle).toBe(DEFAULT_APPEARANCE.chartStyle);
    expect(root.getAttribute("dir")).toBe(DEFAULT_APPEARANCE.direction);
  });

  it("re-writes CSS variables to default brand + radius", () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(NON_DEFAULT));
    let api: ReturnType<typeof useThemeConfig> | null = null;
    render(<ThemeConfigProvider><Probe onReady={(a) => (api = a)} /></ThemeConfigProvider>);

    const style = document.documentElement.style;
    expect(style.getPropertyValue("--primary").trim()).toBe(BRAND_PALETTE.rose.base);
    expect(style.getPropertyValue("--radius").trim()).toBe(RADIUS_TOKENS.soft.base);

    act(() => api!.reset());

    expect(style.getPropertyValue("--primary").trim()).toBe(BRAND_PALETTE[DEFAULT_APPEARANCE.brand].base);
    expect(style.getPropertyValue("--primary-glow").trim()).toBe(BRAND_PALETTE[DEFAULT_APPEARANCE.brand].glow);
    expect(style.getPropertyValue("--ring").trim()).toBe(BRAND_PALETTE[DEFAULT_APPEARANCE.brand].base);
    expect(style.getPropertyValue("--radius").trim()).toBe(RADIUS_TOKENS[DEFAULT_APPEARANCE.radius].base);
    expect(style.getPropertyValue("--radius-sm").trim()).toBe(RADIUS_TOKENS[DEFAULT_APPEARANCE.radius].sm);
  });

  it("updates context state so consumers re-render", () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(NON_DEFAULT));
    let api: ReturnType<typeof useThemeConfig> | null = null;
    const { getByTestId } = render(
      <ThemeConfigProvider><Probe onReady={(a) => (api = a)} /></ThemeConfigProvider>,
    );
    expect(getByTestId("brand").textContent).toBe("rose");

    act(() => api!.reset());

    expect(getByTestId("brand").textContent).toBe(DEFAULT_APPEARANCE.brand);
  });

  it("is idempotent — calling reset twice leaves defaults intact", () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(NON_DEFAULT));
    let api: ReturnType<typeof useThemeConfig> | null = null;
    render(<ThemeConfigProvider><Probe onReady={(a) => (api = a)} /></ThemeConfigProvider>);
    act(() => { api!.reset(); api!.reset(); });
    expect(document.documentElement.dataset.brand).toBe(DEFAULT_APPEARANCE.brand);
    const persisted = JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY)!);
    expect(persisted).toEqual(DEFAULT_APPEARANCE);
  });
});
