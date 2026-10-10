import { describe, expect, it } from "vitest";
import { loopdevNavigation } from "@/loopdev/navigation";

describe("LoopDev sidebar navigation", () => {
  it("uses unique section headings and destinations", () => {
    const sectionLabels = loopdevNavigation.map((section) => section.label);
    const destinations = loopdevNavigation.flatMap((section) =>
      section.items.flatMap((item) => [
        ...(item.to ? [item.to] : []),
        ...(item.children ?? []).flatMap((child) => child.to ? [child.to] : []),
      ]),
    );

    expect(new Set(sectionLabels).size).toBe(sectionLabels.length);
    expect(new Set(destinations).size).toBe(destinations.length);
  });

  it("keeps ERP under Suites and shows Settings only once in Workspace", () => {
    const suites = loopdevNavigation.find((section) => section.label === "Suites");
    const workspaceSections = loopdevNavigation.filter((section) => section.label === "Workspace");

    expect(suites?.items.map((item) => item.label)).toEqual(["CRM", "ERP"]);
    expect(workspaceSections).toHaveLength(1);
    expect(workspaceSections[0].items.map((item) => item.to)).toEqual(["/app/settings"]);
  });
});
