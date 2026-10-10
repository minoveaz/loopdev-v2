import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loopdevAdapter } from "@/loopdev/domains/crm/adapter";
import { useCrmPipeline } from "@/loopdev/domains/crm/hooks/use-crm";

const tenant = vi.hoisted(() => ({
  activeOrganization: { id: "e072c04e-190f-4b40-a8ef-43897d99cb5f" },
}));

vi.mock("@/hooks/use-tenant-context", () => ({
  useTenantContext: () => ({ activeOrganization: tenant.activeOrganization }),
}));

describe("CRM pipeline tenant scope", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads opportunities for the active organization instead of local demo fixtures", async () => {
    const listOpportunities = vi.spyOn(loopdevAdapter.crm, "listOpportunities").mockResolvedValue([]);

    renderHook(() => useCrmPipeline());

    await waitFor(() => {
      expect(listOpportunities).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: tenant.activeOrganization.id }),
      );
    });
  });
});
