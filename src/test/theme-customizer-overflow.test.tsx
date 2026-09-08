import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { render, screen, within } from "@testing-library/react";
import { ThemeConfigProvider } from "@/providers/ThemeConfigProvider";
import {
  ThemeCustomizerProvider,
  ThemeCustomizerTrigger,
} from "@/components/theme/ThemeCustomizer";

/**
 * Small-screen overflow guard for the Rivera Theme Customizer drawer.
 *
 * jsdom does not perform layout, so we cannot assert real pixel widths.
 * Instead we verify the *contract* that prevents horizontal overflow on
 * common phone widths (320, 360, 375, 390, 414):
 *
 *   1. SheetContent fills the viewport on mobile and is capped on desktop.
 *   2. The drawer container, scroll area, and section wrapper all carry
 *      `min-w-0` so flex/grid children can shrink below their content size.
 *   3. Every radiogroup uses a constrained grid (`grid w-full min-w-0`).
 *   4. Every radio button is `min-w-0` and wraps its label in `truncate`.
 *   5. Color swatches use `min-w-0 w-full` cells inside a fluid grid.
 *   6. No descendant has a fixed pixel min-width greater than the
 *      narrowest supported viewport (320px) minus drawer padding.
 *   7. The panel exposes no horizontal scroller (`overflow-x-auto`)
 *      apart from the ScrollArea's vertical viewport.
 */

const PHONE_WIDTHS = [320, 360, 375, 390, 414] as const;

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
  window.dispatchEvent(new Event("resize"));
}

function renderPanelOpen() {
  const utils = render(
    <ThemeConfigProvider>
      <ThemeCustomizerProvider>
        <ThemeCustomizerTrigger />
      </ThemeCustomizerProvider>
    </ThemeConfigProvider>,
  );
  // Open the drawer
  act(() => {
    (screen.getByLabelText(/open theme customizer/i) as HTMLButtonElement).click();
  });
  return utils;
}

function getPanel(): HTMLElement {
  return screen.getByRole("dialog");
}

beforeEach(() => {
  // Reset persisted state between tests so DOM is deterministic.
  localStorage.clear();
});

describe("Theme Customizer — small-screen overflow contract", () => {
  it.each(PHONE_WIDTHS)("renders without horizontal overflow primitives at %ipx", (w) => {
    setViewport(w);
    renderPanelOpen();
    const panel = getPanel();

    // 1. Sheet container is fluid on mobile.
    expect(panel.className).toMatch(/\bw-full\b/);
    expect(panel.className).toMatch(/\bmax-w-full\b/);
    expect(panel.className).toMatch(/\boverflow-hidden\b/);
    // …and capped on desktop only.
    expect(panel.className).toMatch(/\bsm:max-w-\[380px\]/);

    // 7. No descendant introduces a horizontal scroller.
    const horizScrollers = panel.querySelectorAll<HTMLElement>(
      '[class*="overflow-x-auto"], [class*="overflow-x-scroll"]',
    );
    expect(horizScrollers.length).toBe(0);
  });

  it("every segmented radiogroup uses a fluid, shrinkable grid", () => {
    setViewport(320);
    renderPanelOpen();
    const panel = getPanel();
    // Segmented controls only (color swatches use a fixed-column grid).
    const groups = Array.from(
      panel.querySelectorAll<HTMLElement>('[role="radiogroup"]'),
    ).filter((g) => !g.classList.contains("grid-cols-7"));
    expect(groups.length).toBeGreaterThan(0);
    groups.forEach((g) => {
      expect(g.className).toMatch(/\bgrid\b/);
      expect(g.className).toMatch(/\bw-full\b/);
      expect(g.className).toMatch(/\bmin-w-0\b/);
    });
  });

  it("every radio button is shrinkable and truncates its label", () => {
    setViewport(320);
    renderPanelOpen();
    const panel = getPanel();
    // Skip color swatches — those have aspect-square cells with no text label.
    const segGroups = Array.from(
      panel.querySelectorAll<HTMLElement>('[role="radiogroup"]'),
    ).filter((g) => !g.classList.contains("grid-cols-7"));

    for (const group of segGroups) {
      const radios = within(group).getAllByRole("radio");
      expect(radios.length).toBeGreaterThan(0);
      for (const r of radios) {
        expect(r.className).toMatch(/\bmin-w-0\b/);
        // Each radio must contain a truncating label span.
        const spans = Array.from(r.querySelectorAll("span"));
        const hasTruncate = spans.some((s) => /\btruncate\b/.test(s.className));
        expect(hasTruncate).toBe(true);
      }
    }
  });

  it("color swatch cells are fluid (min-w-0 + w-full + aspect-square)", () => {
    setViewport(320);
    renderPanelOpen();
    const panel = getPanel();
    const swatchGroup = panel.querySelector<HTMLElement>(
      '[role="radiogroup"].grid-cols-7',
    );
    expect(swatchGroup).not.toBeNull();
    const swatches = within(swatchGroup!).getAllByRole("radio");
    expect(swatches.length).toBeGreaterThan(0);
    for (const s of swatches) {
      expect(s.className).toMatch(/\baspect-square\b/);
      expect(s.className).toMatch(/\bw-full\b/);
      expect(s.className).toMatch(/\bmin-w-0\b/);
    }
  });

  it("no descendant declares a fixed min-width that would overflow a 320px screen", () => {
    setViewport(320);
    renderPanelOpen();
    const panel = getPanel();
    // Drawer side padding is px-4 (16+16 = 32px), so usable width at 320px ≈ 288px.
    const SAFE_LIMIT = 288;
    const offenders: string[] = [];
    panel.querySelectorAll<HTMLElement>('[class*="min-w-["]').forEach((el) => {
      const m = el.className.match(/min-w-\[(\d+)px\]/);
      if (m && parseInt(m[1], 10) > SAFE_LIMIT) {
        offenders.push(el.className);
      }
    });
    expect(offenders).toEqual([]);
  });

  it("scroll area and section wrappers are shrinkable (min-w-0)", () => {
    setViewport(320);
    renderPanelOpen();
    const panel = getPanel();
    // ScrollArea root carries min-w-0 + flex-1
    const scroll = panel.querySelector<HTMLElement>(".flex-1.min-w-0");
    expect(scroll).not.toBeNull();
    // Inner divider wrapper is min-w-0
    const inner = panel.querySelector<HTMLElement>(".min-w-0.divide-y");
    expect(inner).not.toBeNull();
  });
});

describe("Theme Customizer — source contract", () => {
  const read = async (p: string) => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    return fs.readFile(path.resolve(process.cwd(), p), "utf8");
  };

  it("SheetContent caps width at 380px (does not exceed common phone landscape)", async () => {
    const src = await read("src/components/theme/ThemeCustomizer.tsx");
    expect(src).toMatch(/sm:max-w-\[380px\]/);
    // Make sure nobody bumped the cap above 420px (would clip on small tablets).
    const m = src.match(/sm:max-w-\[(\d+)px\]/);
    expect(m).not.toBeNull();
    expect(parseInt(m![1], 10)).toBeLessThanOrEqual(420);
  });

  it("Sheet panel never uses rounded-2xl/3xl (consistent with radius system)", async () => {
    const src = await read("src/components/theme/ThemeCustomizer.tsx");
    expect(src).not.toMatch(/rounded-(2xl|3xl)/);
  });
});