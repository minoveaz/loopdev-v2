import { describe, expect, it } from "vitest";
import type { Workspace } from "@contracts/auth-port";
import en from "../i18n/locales/en.json";
import es from "../i18n/locales/es.json";
import {
  getAvailableLaunchpadSuites,
  getLaunchpadSuitesForOrganization,
  launchpadSuites,
} from "../../packages/contracts/src/launchpad";

function workspace(suiteKey: Workspace["suiteKey"], status: Workspace["status"] = "active"): Workspace {
  return {
    id: `${suiteKey}-${status}`,
    organizationId: "org-estar-protegidos",
    suiteKey,
    status,
    slug: suiteKey,
    name: suiteKey,
    createdAt: "2026-10-10T00:00:00.000Z",
  };
}

describe("Launchpad suite availability", () => {
  it("shows only ready suites enabled for the active organization and its tools", () => {
    const suites = getAvailableLaunchpadSuites([
      workspace("crm"),
      workspace("operations"),
      workspace("marketing", "disabled"),
    ]);

    expect(suites.map((suite) => suite.id)).toEqual([
      "sales-crm",
      "document-intelligence",
      "erp",
    ]);
  });

  it("does not show a workspace suite when that workspace is disabled", () => {
    const suites = getAvailableLaunchpadSuites([
      workspace("crm", "disabled"),
      workspace("operations"),
    ]);

    expect(suites.map((suite) => suite.id)).toEqual([
      "document-intelligence",
      "erp",
    ]);
  });

  it("omits globally locked and lab suites even when matching workspaces exist", () => {
    const suites = getAvailableLaunchpadSuites([
      workspace("marketing"),
      workspace("finance"),
      workspace("quant"),
      workspace("health"),
    ]);

    expect(suites.map((suite) => suite.id)).toEqual(["document-intelligence"]);
  });

  it("shows the full catalog for LoopDev without unlocking locked or lab suites", () => {
    const suites = getLaunchpadSuitesForOrganization("loopdev", []);

    expect(suites).toEqual(launchpadSuites);
    expect(suites.filter((suite) => suite.status === "locked")).toHaveLength(3);
    expect(suites.filter((suite) => suite.status === "lab")).toHaveLength(1);
  });

  it("keeps other organizations limited to ready suites with active workspaces", () => {
    const suites = getLaunchpadSuitesForOrganization("estar-protegidos", [
      workspace("crm"),
      workspace("operations"),
      workspace("marketing"),
    ]);

    expect(suites.map((suite) => suite.id)).toEqual([
      "sales-crm",
      "document-intelligence",
      "erp",
    ]);
  });
});

describe("Launchpad translations", () => {
  it("defines all suite copy under the locale path used by the Launchpad", () => {
    const english = en.common.loopdev.launchpad;
    const spanish = es.common.loopdev.launchpad;
    const suiteIds = launchpadSuites.map(({ id }) => id).sort();

    expect(Object.keys(english.suites).sort()).toEqual(suiteIds);
    expect(Object.keys(spanish.suites).sort()).toEqual(suiteIds);
    expect(english.welcome).toBe("Welcome, {{name}}");
    expect(spanish.welcome).toBe("Hola, {{name}}");
    expect(english.suites["document-intelligence"].description).not.toBe(
      spanish.suites["document-intelligence"].description,
    );
  });
});
