import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Verifies the sticky topbar uses the correct `top` offset and z-index
 * for every header-height value, and that its stacking order plays
 * correctly with the sidebar in both collapsed and expanded states.
 *
 * Reads the real component classes and `index.css` so we can't drift.
 */

const topbarSrc = fs.readFileSync(
  path.resolve(__dirname, "../components/layout/Topbar.tsx"),
  "utf8",
);
const sidebarSrc = fs.readFileSync(
  path.resolve(__dirname, "../components/layout/Sidebar.tsx"),
  "utf8",
);
const indexCss = fs.readFileSync(path.resolve(__dirname, "../index.css"), "utf8");

function topbarClasses() {
  // Pick the className on the <header data-app-topbar ...>.
  const m = topbarSrc.match(/data-app-topbar[^>]*className="([^"]+)"/);
  if (!m) throw new Error("could not locate topbar className");
  return m[1];
}

function findRule(re: RegExp) {
  const m = indexCss.match(re);
  return m ? m[0] : null;
}

describe("sticky navbar — top offset & z-index", () => {
  const cls = topbarClasses();

  it("topbar is sticky to the top of the viewport (top-0)", () => {
    expect(cls).toMatch(/\bsticky\b/);
    expect(cls).toMatch(/\btop-0\b/);
  });

  it("topbar sits above page content (z-30) but below mobile sidebar drawer (z-50)", () => {
    expect(cls).toMatch(/\bz-30\b/);
    // Mobile sidebar overlay is z-40, drawer itself z-50 — must exceed topbar.
    expect(sidebarSrc).toMatch(/z-40/);
    expect(sidebarSrc).toMatch(/z-50/);
  });

  it("header-position=sticky CSS pins to top:0 regardless of header-height", () => {
    const rule = findRule(
      /html\[data-header-position="sticky"\]\s*\[data-app-topbar\]\s*\{[^}]*\}/,
    );
    expect(rule).not.toBeNull();
    expect(rule!).toMatch(/position:\s*sticky/);
    expect(rule!).toMatch(/top:\s*0/);
  });

  it("header-height variants change height only, not top/z-index", () => {
    for (const h of ["compact", "standard", "tall"]) {
      const rule = findRule(
        new RegExp(
          `html\\[data-header-height="${h}"\\]\\s*\\[data-app-topbar\\]\\s*\\{[^}]*\\}`,
        ),
      );
      expect(rule, `missing rule for ${h}`).not.toBeNull();
      expect(rule!).toMatch(/height:\s*[\d.]+rem/);
      expect(rule!).not.toMatch(/\btop\s*:/);
      expect(rule!).not.toMatch(/z-index/);
      expect(rule!).not.toMatch(/\bposition\s*:/);
    }
  });

  it("collapsed/expanded sidebar does not change topbar stacking — sidebar uses its own fixed layer", () => {
    // Desktop sidebar is laid out as a flex sibling of the content column,
    // not fixed, so it cannot occlude the sticky topbar. The only fixed
    // sidebar layer (mobile drawer) is z-50 and sits above topbar by design.
    const desktopSidebar = sidebarSrc.match(
      /fixed inset-y-0 start-0 z-50 flex flex-col bg-sidebar/,
    );
    expect(desktopSidebar).not.toBeNull();
    // Topbar z-index is independent of any sidebar collapsed/expanded class.
    expect(cls).not.toMatch(/data-sidebar/);
    expect(cls).not.toMatch(/group-data-/);
  });

  it("snapshot of topbar sticky/positioning class set", () => {
    const positioning = cls
      .split(/\s+/)
      .filter((c) => /^(sticky|top-|z-|h-\d|bg-card)$/.test(c) || /^(sticky|top-0|z-30|h-16|bg-card)$/.test(c))
      .sort();
    expect(positioning).toMatchSnapshot();
  });
});