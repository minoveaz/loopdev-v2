import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { supplierAdapter, supplierItemAdapter } from "@/loopdev/domains/suppliers/adapter";
import { localSupplierAdapter } from "@/loopdev/domains/suppliers/adapter/local";
import { localSupplierItemAdapter } from "@/loopdev/domains/suppliers/adapter/localItems";
import { supabaseSupplierAdapter } from "@/loopdev/domains/suppliers/adapter/supabase";
import { supabaseSupplierItemAdapter } from "@/loopdev/domains/suppliers/adapter/supabaseItems";

describe("configured Supplier adapters", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_CATALOG_ADAPTER_MODE", "supabase");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("uses Supabase for suppliers and items regardless of organization ID shape", async () => {
    const listSuppliers = vi.spyOn(supabaseSupplierAdapter, "listSuppliers").mockResolvedValue([]);
    const listSupplierItems = vi.spyOn(supabaseSupplierItemAdapter, "listSupplierItems").mockResolvedValue([]);
    const localSuppliers = vi.spyOn(localSupplierAdapter, "listSuppliers");
    const localItems = vi.spyOn(localSupplierItemAdapter, "listSupplierItems");
    const scope = { organizationId: "local-development-organization" };

    await expect(supplierAdapter.listSuppliers(scope)).resolves.toEqual([]);
    await expect(supplierItemAdapter.listSupplierItems("supplier-id", scope)).resolves.toEqual([]);

    expect(listSuppliers).toHaveBeenCalledOnce();
    expect(listSupplierItems).toHaveBeenCalledOnce();
    expect(localSuppliers).not.toHaveBeenCalled();
    expect(localItems).not.toHaveBeenCalled();
  });

  it("does not fall back to local data after a Supabase failure", async () => {
    vi.spyOn(supabaseSupplierAdapter, "listSuppliers").mockRejectedValue(new Error("Remote unavailable."));
    const localSuppliers = vi.spyOn(localSupplierAdapter, "listSuppliers");

    await expect(supplierAdapter.listSuppliers({ organizationId: "local-development-organization" }))
      .rejects.toThrow("Remote unavailable.");
    expect(localSuppliers).not.toHaveBeenCalled();
  });

  it("fails closed when the adapter mode is missing or invalid", async () => {
    vi.stubEnv("VITE_CATALOG_ADAPTER_MODE", undefined);
    await expect(supplierAdapter.listSuppliers({ organizationId: "local-development-organization" }))
      .rejects.toMatchObject({ name: "SupplierAdapterError", code: "server-error" });

    vi.stubEnv("VITE_CATALOG_ADAPTER_MODE", "fixtures");
    await expect(supplierItemAdapter.listSupplierItems("supplier-id", { organizationId: "local-development-organization" }))
      .rejects.toThrow("must be explicitly configured");
  });
});
