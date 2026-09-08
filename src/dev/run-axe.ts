/**
 * Dev-only helper: run axe-core against the live document and dump a flat
 * summary to the console. Triggered from the browser console with:
 *
 *   await window.__axeAudit?.()
 */
import axe from "axe-core";

if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __axeAudit: () => Promise<axe.AxeResults> }).__axeAudit = async () => {
    const results = await axe.run(document, {
      resultTypes: ["violations"],
    });
    // Flat, filterable summary so the harness console capture sees it.
    for (const v of results.violations) {
      console.warn(
        `[axe] ${v.id} (${v.impact}) — ${v.help} :: ${v.nodes.length} node(s)`,
        v.nodes.map((n) => n.target).slice(0, 5),
      );
    }
    console.warn(`[axe] ${results.violations.length} violation rule(s) total`);
    return results;
  };
}

export {};