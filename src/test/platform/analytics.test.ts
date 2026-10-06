import { describe, expect, it } from "vitest";
import { localAnalyticsAdapter, mapRemoteError, isAnalyticsCacheFresh } from "@/loopdev/domains/platform/analytics";
import { localPlatformAdapter } from "@/loopdev/domains/platform/adapter";

describe("Platform Analytics", () => {
  const scope = { organizationId: "local-development-organization", workspaceId: "local-workspace" };

  it("returns a typed metric scoped to the organization", async () => {
    const response = await localAnalyticsAdapter.getMetric("crm.contacts", { scope });

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.metric.id).toBe("crm.contacts");
      expect(response.data.scope.organizationId).toBe(scope.organizationId);
      expect(response.data.freshness).toBe("fresh");
    }
  });

  it("rejects queries without an organization scope", async () => {
    const response = await localAnalyticsAdapter.getMetric("crm.contacts", { scope: { organizationId: "" } });

    expect(response).toEqual({
      success: false,
      error: { code: "INVALID_SCOPE", message: "An organization scope is required." },
    });
  });

  it("returns an empty series instead of fabricated points", async () => {
    const response = await localAnalyticsAdapter.getTimeSeries("crm.activity_volume", { scope }, "week");

    expect(response.success).toBe(true);
    if (response.success) expect(response.data.points).toEqual([]);
  });

  it("publishes Document Intelligence metrics through the same contract", async () => {
    const response = await localAnalyticsAdapter.getMetric("document_intelligence.processed", { scope });

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.metric.suite).toBe("document-intelligence");
      expect(response.data.value).toBeGreaterThanOrEqual(0);
    }
  });

  it("does not fall back to local/demo data for a remote UUID tenant", async () => {
    const response = await localPlatformAdapter.analytics.getMetric("crm.open_leads", {
      scope: { organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7" },
    });

    // A UUID tenant is always routed to the remote adapter. It may succeed
    // when the configured Supabase project is reachable, but it must never
    // return local fixture scope/data.
    if (response.success === true) {
      expect(response.data.scope.organizationId).toBe("80fce911-57c5-4a83-809f-78df6a3736f7");
    } else {
      expect(["UNAVAILABLE", "FORBIDDEN", "UNAUTHORIZED", "SCHEMA_MISMATCH"]).toContain(response.error.code);
    }
  });

  it("maps RLS and schema failures to explicit remote states", () => {
    expect(mapRemoteError(new Error("new row violates row-level security policy")).code).toBe("FORBIDDEN");
    expect(mapRemoteError(new Error("column does not exist")).code).toBe("SCHEMA_MISMATCH");
    expect(mapRemoteError(new Error("JWT expired")).code).toBe("UNAUTHORIZED");
  });

  it("keeps cache fresh for one minute and stale only up to five minutes", () => {
    const now = Date.parse("2026-09-27T12:00:00.000Z");
    expect(isAnalyticsCacheFresh(now - 60_000, now)).toBe(true);
    expect(isAnalyticsCacheFresh(now - 5 * 60_000, now)).toBe(true);
    expect(isAnalyticsCacheFresh(now - 5 * 60_000 - 1, now)).toBe(false);
  });
});
