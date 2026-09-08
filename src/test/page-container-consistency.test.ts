import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PAGES_DIR = join(process.cwd(), "src/pages");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("page layout consistency", () => {
  it("every page using <PageHeader/> also wraps content in <PageContainer/>", () => {
    const offenders: string[] = [];
    for (const file of walk(PAGES_DIR)) {
      const src = readFileSync(file, "utf8");
      const usesHeader = /<PageHeader[\s/>]/.test(src);
      if (!usesHeader) continue;
      const usesContainer = /<PageContainer[\s/>]/.test(src);
      if (!usesContainer) offenders.push(file.replace(process.cwd() + "/", ""));
    }
    expect(
      offenders,
      `Pages using <PageHeader/> must also use <PageContainer/> for consistent max-widths.\nOffenders:\n  - ${offenders.join("\n  - ")}`,
    ).toEqual([]);
  });

  it("pages should not hand-roll mx-auto max-w-* wrappers (use <PageContainer width=…/>)", () => {
    const offenders: { file: string; match: string }[] = [];
    const re = /className="[^"]*\bmx-auto\b[^"]*\bmax-w-(?:3xl|4xl|5xl|6xl|7xl|\[[^\]]+\])[^"]*"/;
    for (const file of walk(PAGES_DIR)) {
      const src = readFileSync(file, "utf8");
      // Only enforce on pages that participate in the standard app shell
      // (i.e. those using PageHeader). Standalone landing/auth pages are exempt.
      if (!/<PageHeader[\s/>]/.test(src)) continue;
      const m = src.match(re);
      if (!m) continue;
      // Allow if the match is on a <PageContainer ...> line (className override is fine).
      const lineStart = src.lastIndexOf("\n", m.index!) + 1;
      const lineEnd = src.indexOf("\n", m.index!);
      const line = src.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
      if (/PageContainer/.test(line)) continue;
      offenders.push({ file: file.replace(process.cwd() + "/", ""), match: m[0] });
    }
    expect(
      offenders,
      `Pages must use <PageContainer width="wide|default|narrow"/> instead of hand-rolled mx-auto max-w-* divs.\nOffenders:\n${offenders.map((o) => `  - ${o.file}: ${o.match}`).join("\n")}`,
    ).toEqual([]);
  });
});