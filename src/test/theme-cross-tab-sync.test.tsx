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

/**
 * Simulates Tab B writing to localStorage by dispatching a real `storage`
 * StorageEvent against window — same signal the browser fires in other open
 * tabs. Tab A's ThemeConfigProvider must:
 *   1. Update its React state
 *   2. Re-apply data-* attributes on <html>
 *   3. Re-write CSS variables (--primary, --radius, etc.)
 */

function Probe() {
  const { config } = useThemeConfig();
  return <span data-testid="probe">{JSON.stringify(config)}</span>;
}

function fireStorage(next: AppearanceConfig) {
  const newValue = JSON.stringify(next);
  localStorage.setItem(APPEARANCE_STORAGE_KEY, newValue);
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", {
      key: APPEARANCE_STORAGE_KEY,
      newValue,
      oldValue: null,
      storageArea: localStorage,
    }));
  });
}

function resetDom() {
  const root = document.documentElement;
  root.removeAttribute("style");
  ["brand","density","sidebarStyle","navbarStyle","radius","contentWidth","chartStyle"].forEach((k) => {
    delete root.dataset[k];
  });
  root.removeAttribute("dir");
}

describe("ThemeConfigProvider — cross-tab synchronization", () => {
  beforeEach(() => { localStorage.clear(); resetDom(); });
  afterEach(() => { cleanup(); localStorage.clear(); resetDom(); });

  it("updates context state when storage event fires", () => {
    const { getByTestId } = render(<ThemeConfigProvider><Probe /></ThemeConfigProvider>);
    expect(JSON.parse(getByTestId("probe").textContent!).brand).toBe(DEFAULT_APPEARANCE.brand);

    fireStorage({ ...DEFAULT_APPEARANCE, brand: "rose" });
    expect(JSON.parse(getByTestId("probe").textContent!).brand).toBe("rose");
  });

  it("re-applies <html> data attributes on storage event", () => {
    render(<ThemeConfigProvider><Probe /></ThemeConfigProvider>);
    fireStorage({
      ...DEFAULT_APPEARANCE,
      brand: "emerald",
      density: "compact",
      sidebarStyle: "floating",
      navbarStyle: "glass",
      radius: "soft",
      contentWidth: "centered",
      chartStyle: "minimal",
      direction: "rtl",
    });
    const root = document.documentElement;
    expect(root.dataset.brand).toBe("emerald");
    expect(root.dataset.density).toBe("compact");
    expect(root.dataset.sidebarStyle).toBe("floating");
    expect(root.dataset.navbarStyle).toBe("glass");
    expect(root.dataset.radius).toBe("soft");
    expect(root.dataset.contentWidth).toBe("centered");
    expect(root.dataset.chartStyle).toBe("minimal");
    expect(root.getAttribute("dir")).toBe("rtl");
  });

  it("re-writes CSS variables on storage event", () => {
    render(<ThemeConfigProvider><Probe /></ThemeConfigProvider>);

    fireStorage({ ...DEFAULT_APPEARANCE, brand: "violet", radius: "soft" });
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--primary").trim()).toBe(BRAND_PALETTE.violet.base);
    expect(style.getPropertyValue("--primary-glow").trim()).toBe(BRAND_PALETTE.violet.glow);
    expect(style.getPropertyValue("--ring").trim()).toBe(BRAND_PALETTE.violet.base);
    expect(style.getPropertyValue("--radius").trim()).toBe(RADIUS_TOKENS.soft.base);
    expect(style.getPropertyValue("--radius-sm").trim()).toBe(RADIUS_TOKENS.soft.sm);

    fireStorage({ ...DEFAULT_APPEARANCE, brand: "amber", radius: "sharp" });
    expect(style.getPropertyValue("--primary").trim()).toBe(BRAND_PALETTE.amber.base);
    expect(style.getPropertyValue("--radius").trim()).toBe(RADIUS_TOKENS.sharp.base);
  });

  it("ignores storage events for unrelated keys", () => {
    const { getByTestId } = render(<ThemeConfigProvider><Probe /></ThemeConfigProvider>);
    const before = getByTestId("probe").textContent;
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", {
        key: "some-other-key",
        newValue: JSON.stringify({ brand: "rose" }),
      }));
    });
    expect(getByTestId("probe").textContent).toBe(before);
  });

  it("ignores storage events with null newValue (key cleared elsewhere)", () => {
    const { getByTestId } = render(<ThemeConfigProvider><Probe /></ThemeConfigProvider>);
    const before = getByTestId("probe").textContent;
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", {
        key: APPEARANCE_STORAGE_KEY,
        newValue: null,
      }));
    });
    expect(getByTestId("probe").textContent).toBe(before);
  });

  it("falls back to defaults when storage event payload is malformed JSON", () => {
    const { getByTestId } = render(<ThemeConfigProvider><Probe /></ThemeConfigProvider>);
    const before = getByTestId("probe").textContent;
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", {
        key: APPEARANCE_STORAGE_KEY,
        newValue: "{not json",
      }));
    });
    // Provider catches the parse error and leaves state untouched.
    expect(getByTestId("probe").textContent).toBe(before);
  });

  it("sanitizes invalid fields received from another tab", () => {
    const { getByTestId } = render(<ThemeConfigProvider><Probe /></ThemeConfigProvider>);
    fireStorage({
      ...DEFAULT_APPEARANCE,
      // @ts-expect-error — simulating a corrupted payload from another tab
      brand: "neon-pink",
      radius: "soft",
    });
    const cfg = JSON.parse(getByTestId("probe").textContent!);
    expect(cfg.brand).toBe(DEFAULT_APPEARANCE.brand); // sanitized
    expect(cfg.radius).toBe("soft");                   // valid value preserved
    expect(document.documentElement.dataset.radius).toBe("soft");
  });

  it("propagates rapid successive changes (multiple Tab B updates)", () => {
    const { getByTestId } = render(<ThemeConfigProvider><Probe /></ThemeConfigProvider>);
    fireStorage({ ...DEFAULT_APPEARANCE, brand: "blue" });
    fireStorage({ ...DEFAULT_APPEARANCE, brand: "rose" });
    fireStorage({ ...DEFAULT_APPEARANCE, brand: "slate" });
    expect(JSON.parse(getByTestId("probe").textContent!).brand).toBe("slate");
    expect(document.documentElement.dataset.brand).toBe("slate");
    expect(document.documentElement.style.getPropertyValue("--primary").trim()).toBe(BRAND_PALETTE.slate.base);
  });
});
