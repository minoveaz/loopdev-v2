import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Visual regression — header-position must always beat navbar-style.
 *
 * Regression guard: navbar-style="glass" used to set `position: sticky` on
 * the topbar, which silently overrode header-position="static" / "hidden".
 *
 * jsdom doesn't apply stylesheet cascade for attribute selectors in
 * `getComputedStyle`, so we reason about the cascade directly: parse
 * `src/index.css`, collect every rule that targets `[data-app-topbar]`
 * and sets `position` / `display`, then for each (navbar × header)
 * combination filter rules whose `html[data-...]` selector matches the
 * current dataset and apply them in declaration order. The last value
 * wins (all matching rules have equal specificity: 0,2,1).
 */

const NAVBAR_STYLES = ["sticky", "static", "glass"] as const;
const HEADER_POSITIONS = ["sticky", "static", "hidden"] as const;

type Rule = {
  selector: string;
  attrs: Record<string, string>;
  decls: Record<string, string>;
  order: number;
};

function loadRules(): Rule[] {
  const css = fs.readFileSync(path.resolve(__dirname, "../index.css"), "utf8");
  // Strip block comments and @-rule wrappers we don't care about (we still
  // catch their inner rules because we match by selector text).
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: Rule[] = [];
  let order = 0;
  // Match `selector { decls }` greedily but stop at the next `{` / `}`.
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(cleaned)) !== null) {
    const selector = m[1].trim();
    const body = m[2];
    if (!selector.includes("[data-app-topbar]")) continue;
    if (selector.startsWith("@")) continue;

    const attrs: Record<string, string> = {};
    const attrRe = /html\[data-([\w-]+)="([\w-]+)"\]/g;
    let a: RegExpExecArray | null;
    while ((a = attrRe.exec(selector)) !== null) {
      // Convert kebab-case data-attr to camelCase dataset key.
      const key = a[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      attrs[key] = a[2];
    }

    const decls: Record<string, string> = {};
    for (const part of body.split(";")) {
      const idx = part.indexOf(":");
      if (idx === -1) continue;
      const prop = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      if (prop === "position" || prop === "display") decls[prop] = val;
    }
    if (Object.keys(decls).length === 0) continue;
    rules.push({ selector, attrs, decls, order: order++ });
  }
  return rules;
}

const RULES = loadRules();

function resolve(navbarStyle: string, headerPosition: string) {
  const matching = RULES.filter((r) =>
    Object.entries(r.attrs).every(([k, v]) => {
      if (k === "navbarStyle") return v === navbarStyle;
      if (k === "headerPosition") return v === headerPosition;
      return false;
    }),
  ).sort((a, b) => a.order - b.order);

  let position = "relative"; // <header> default
  let display = "block";
  for (const r of matching) {
    if (r.decls.position) position = r.decls.position;
    if (r.decls.display) display = r.decls.display;
  }
  return { position, display, matchedSelectors: matching.map((r) => r.selector) };
}

describe("header-position vs navbar-style — cascade snapshot", () => {
  it("collected the relevant rules from index.css", () => {
    expect(RULES.length).toBeGreaterThanOrEqual(5);
    expect(RULES.map((r) => r.selector)).toMatchSnapshot();
  });

  for (const nav of NAVBAR_STYLES) {
    for (const pos of HEADER_POSITIONS) {
      it(`navbar=${nav} + header-position=${pos}`, () => {
        const sig = resolve(nav, pos);
        expect(sig).toMatchSnapshot();

        // Hard invariants — header-position is authoritative.
        if (pos === "hidden") expect(sig.display).toBe("none");
        if (pos === "static") expect(sig.position).toBe("static");
        if (pos === "sticky") expect(sig.position).toBe("sticky");
      });
    }
  }
});