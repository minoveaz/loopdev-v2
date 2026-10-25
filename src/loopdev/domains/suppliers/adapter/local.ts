import { localPlatformAdapter } from "@/loopdev/domains/platform/adapter";
import { localSuppliersStore } from "../data/localSuppliers";
import { SupplierAdapterError } from "../types";
import type {
  SupplierAdapter,
  SupplierCreateInput,
  SupplierListParams,
  SupplierRecord,
  SupplierScopeParams,
  SupplierUpdateInput,
} from "../types";

function assertPermission(permission: "supplier.read" | "supplier.manage", organizationId: string): void {
  if (!organizationId || !localPlatformAdapter.hasPermission(permission, { organizationId, workspaceId: null })) {
    throw new SupplierAdapterError("You do not have permission to access suppliers in this organization.", "forbidden");
  }
}

function validateIdentity(input: Pick<SupplierCreateInput, "legalName" | "countryCode">): void {
  if (!input.legalName.trim()) throw new SupplierAdapterError("A legal name is required.", "server-error");
  if (!/^[A-Za-z]{2}$/.test(input.countryCode.trim())) {
    throw new SupplierAdapterError("Country must be an ISO 3166-1 alpha-2 code.", "server-error");
  }
}

function findOwned(id: string, params: SupplierScopeParams): SupplierRecord {
  const supplier = localSuppliersStore.get(id);
  if (!supplier || supplier.organizationId !== params.organizationId) {
    throw new SupplierAdapterError("Supplier not found in this organization.", "not-found");
  }
  return supplier;
}

export const localSupplierAdapter: SupplierAdapter = {
  async listSuppliers(params: SupplierListParams) {
    assertPermission("supplier.read", params.organizationId);
    return localSuppliersStore.list()
      .filter((supplier) => supplier.organizationId === params.organizationId)
      .filter((supplier) => params.includeInactive || supplier.status !== "inactive")
      .filter((supplier) => !params.status?.length || params.status.includes(supplier.status))
      .sort((left, right) => left.legalName.localeCompare(right.legalName));
  },

  async getSupplier(id: string, params: SupplierScopeParams) {
    assertPermission("supplier.read", params.organizationId);
    const supplier = localSuppliersStore.get(id);
    return supplier?.organizationId === params.organizationId ? supplier : null;
  },

  async createSupplier(input: SupplierCreateInput) {
    assertPermission("supplier.manage", input.organizationId);
    validateIdentity(input);
    return localSuppliersStore.create({
      organizationId: input.organizationId,
      kind: input.kind,
      legalName: input.legalName.trim(),
      countryCode: input.countryCode.trim().toUpperCase(),
      status: "active",
      version: 1,
    });
  },

  async updateSupplier(id: string, params: SupplierScopeParams, patch: SupplierUpdateInput) {
    assertPermission("supplier.manage", params.organizationId);
    const current = findOwned(id, params);
    if (current.version !== patch.expectedVersion) {
      throw new SupplierAdapterError("Supplier changed since it was loaded. Refresh and try again.", "conflict");
    }
    if (patch.legalName !== undefined || patch.countryCode !== undefined) {
      validateIdentity({
        legalName: patch.legalName ?? current.legalName,
        countryCode: patch.countryCode ?? current.countryCode,
      });
    }
    const updated = localSuppliersStore.update(id, {
      ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
      ...(patch.legalName !== undefined ? { legalName: patch.legalName.trim() } : {}),
      ...(patch.countryCode !== undefined ? { countryCode: patch.countryCode.trim().toUpperCase() } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      version: current.version + 1,
    });
    if (!updated) throw new SupplierAdapterError("Supplier could not be updated.", "server-error");
    return updated;
  },

  async deactivateSupplier(id: string, params: SupplierScopeParams, expectedVersion: number) {
    return this.updateSupplier(id, params, { status: "inactive", expectedVersion });
  },

  async reactivateSupplier(id: string, params: SupplierScopeParams, expectedVersion: number) {
    return this.updateSupplier(id, params, { status: "active", expectedVersion });
  },
};
