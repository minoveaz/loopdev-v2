import { catalogAdapter } from "@/loopdev/domains/catalog/adapter";
import { localPlatformAdapter } from "@/loopdev/domains/platform/adapter";
import { localSuppliersStore } from "../data/localSuppliers";
import { localSupplierItemsStore } from "../data/localSupplierItems";
import { SupplierAdapterError } from "../types";
import type {
  SupplierItemAdapter,
  SupplierItemCreateInput,
  SupplierItemLinkInput,
  SupplierItemListParams,
  SupplierItemRecord,
  SupplierItemTermsInput,
  SupplierItemUpdateInput,
  SupplierScopeParams,
} from "../types";

function assertPermission(permission: "supplier.read" | "supplier.manage", organizationId: string): void {
  if (!organizationId || !localPlatformAdapter.hasPermission(permission, { organizationId, workspaceId: null })) {
    throw new SupplierAdapterError("You do not have permission to access supplier items in this organization.", "forbidden");
  }
}

function assertSupplierScope(supplierId: string, organizationId: string): void {
  const supplier = localSuppliersStore.get(supplierId);
  if (!supplier || supplier.organizationId !== organizationId) {
    throw new SupplierAdapterError("Supplier not found in this organization.", "invalid-scope");
  }
}

function findOwned(id: string, params: SupplierScopeParams): SupplierItemRecord {
  const item = localSupplierItemsStore.get(id);
  if (!item || item.organizationId !== params.organizationId) {
    throw new SupplierAdapterError("Supplier item not found in this organization.", "not-found");
  }
  return item;
}

function validateTerms(item: Pick<SupplierItemRecord, "name" | "purchaseUnit" | "unitsPerStockUnit" | "unitPrice" | "currency" | "minimumQuantity" | "leadTimeDays">): void {
  if (!item.name.trim()) throw new SupplierAdapterError("Supplier item name is required.", "server-error");
  if (!item.purchaseUnit.trim()) throw new SupplierAdapterError("Purchase unit is required.", "server-error");
  if (!Number.isFinite(item.unitsPerStockUnit) || item.unitsPerStockUnit <= 0) {
    throw new SupplierAdapterError("Units per stock unit must be greater than zero.", "server-error");
  }
  if (item.unitPrice !== null && (!Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
    throw new SupplierAdapterError("Unit price must be a non-negative amount.", "server-error");
  }
  if (!/^[A-Z]{3}$/.test(item.currency)) throw new SupplierAdapterError("Currency must be a three-letter ISO code.", "server-error");
  if (item.minimumQuantity !== null && (!Number.isFinite(item.minimumQuantity) || item.minimumQuantity <= 0)) {
    throw new SupplierAdapterError("Minimum quantity must be greater than zero.", "server-error");
  }
  if (item.leadTimeDays !== null && (!Number.isInteger(item.leadTimeDays) || item.leadTimeDays < 0)) {
    throw new SupplierAdapterError("Lead time must be a non-negative whole number.", "server-error");
  }
}

async function validateProductLink(
  organizationId: string,
  productId: string | null,
  variantId: string | null,
): Promise<void> {
  if (Boolean(productId) === Boolean(variantId)) {
    throw new SupplierAdapterError("Link exactly one product or variant.", "invalid-scope");
  }
  if (productId) {
    const product = await catalogAdapter.getCatalogItem(productId, { organizationId });
    if (!product || product.organizationId !== organizationId) {
      throw new SupplierAdapterError("Product is not available in this organization.", "invalid-scope");
    }
  } else if (variantId) {
    const variants = await catalogAdapter.listVariants({ organizationId, includeArchived: true });
    if (!variants.some((variant) => variant.id === variantId && variant.organizationId === organizationId)) {
      throw new SupplierAdapterError("Variant is not available in this organization.", "invalid-scope");
    }
  }
}

function findDuplicateCode(item: SupplierItemRecord, supplierItemCode: string | null): boolean {
  const normalizedCode = supplierItemCode?.trim().toLocaleLowerCase();
  if (!normalizedCode) return false;
  return localSupplierItemsStore.list().some((other) =>
    other.id !== item.id
    && other.organizationId === item.organizationId
    && other.supplierId === item.supplierId
    && other.supplierItemCode?.trim().toLocaleLowerCase() === normalizedCode);
}

export const localSupplierItemAdapter: SupplierItemAdapter = {
  async listSupplierItems(supplierId: string, params: SupplierItemListParams) {
    assertPermission("supplier.read", params.organizationId);
    assertSupplierScope(supplierId, params.organizationId);
    return localSupplierItemsStore.list()
      .filter((item) => item.organizationId === params.organizationId && item.supplierId === supplierId)
      .filter((item) => params.includeInactive || item.status !== "inactive")
      .sort((left, right) => left.name.localeCompare(right.name));
  },

  async addSupplierItem(input: SupplierItemCreateInput) {
    assertPermission("supplier.manage", input.organizationId);
    assertSupplierScope(input.supplierId, input.organizationId);
    const record: Omit<SupplierItemRecord, "id" | "createdAt" | "updatedAt"> = {
      organizationId: input.organizationId,
      supplierId: input.supplierId,
      supplierItemCode: input.supplierItemCode?.trim() || null,
      name: input.name.trim(),
      productId: null,
      variantId: null,
      purchaseUnit: input.purchaseUnit.trim(),
      unitsPerStockUnit: input.unitsPerStockUnit,
      unitPrice: input.unitPrice ?? null,
      currency: input.currency.trim().toUpperCase(),
      minimumQuantity: input.minimumQuantity ?? null,
      leadTimeDays: input.leadTimeDays ?? null,
      status: "draft",
      version: 1,
    };
    validateTerms(record);
    if (findDuplicateCode({ ...record, id: "", createdAt: "", updatedAt: "" }, record.supplierItemCode)) {
      throw new SupplierAdapterError("Supplier item code already exists for this supplier.", "conflict");
    }
    return localSupplierItemsStore.create(record);
  },

  async linkSupplierItemToProduct(id: string, params: SupplierScopeParams, input: SupplierItemLinkInput) {
    assertPermission("supplier.manage", params.organizationId);
    const current = findOwned(id, params);
    if (current.version !== input.expectedVersion) {
      throw new SupplierAdapterError("Supplier item changed since it was loaded. Refresh and try again.", "conflict");
    }
    const productId = input.productId ?? null;
    const variantId = input.variantId ?? null;
    await validateProductLink(params.organizationId, productId, variantId);
    const updated = localSupplierItemsStore.update(id, {
      productId,
      variantId,
      version: current.version + 1,
    });
    if (!updated) throw new SupplierAdapterError("Supplier item could not be linked.", "server-error");
    return updated;
  },

  async startProductCreationFromSupplierItem(id: string, params: SupplierScopeParams) {
    assertPermission("supplier.manage", params.organizationId);
    const current = findOwned(id, params);
    assertSupplierScope(current.supplierId, current.organizationId);
    if (current.productId || current.variantId) {
      throw new SupplierAdapterError("Supplier item is already linked to the catalog.", "conflict");
    }
    return {
      organizationId: current.organizationId,
      supplierId: current.supplierId,
      supplierItemId: current.id,
      version: current.version,
      name: current.name,
      supplierItemCode: current.supplierItemCode,
      purchaseUnit: current.purchaseUnit,
    };
  },

  async updateSupplierItem(id: string, params: SupplierScopeParams, patch: SupplierItemUpdateInput) {
    assertPermission("supplier.manage", params.organizationId);
    const current = findOwned(id, params);
    if (current.version !== patch.expectedVersion) {
      throw new SupplierAdapterError("Supplier item changed since it was loaded. Refresh and try again.", "conflict");
    }
    const changes = {
      ...(patch.supplierItemCode !== undefined ? { supplierItemCode: patch.supplierItemCode?.trim() || null } : {}),
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.productId !== undefined ? { productId: patch.productId } : {}),
      ...(patch.variantId !== undefined ? { variantId: patch.variantId } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
    };
    const supplierItemCode = changes.supplierItemCode !== undefined ? changes.supplierItemCode : current.supplierItemCode;
    if (findDuplicateCode(current, supplierItemCode)) {
      throw new SupplierAdapterError("Supplier item code already exists for this supplier.", "conflict");
    }
    const productId = changes.productId !== undefined ? changes.productId : current.productId;
    const variantId = changes.variantId !== undefined ? changes.variantId : current.variantId;
    if (changes.productId !== undefined || changes.variantId !== undefined) {
      if (productId || variantId) await validateProductLink(params.organizationId, productId, variantId);
    }
    const candidate = { ...current, ...changes };
    validateTerms(candidate);
    const updated = localSupplierItemsStore.update(id, {
      ...changes,
      version: current.version + 1,
    });
    if (!updated) throw new SupplierAdapterError("Supplier item could not be updated.", "server-error");
    return updated;
  },

  async updateSupplierItemTerms(id: string, params: SupplierScopeParams, patch: SupplierItemTermsInput) {
    assertPermission("supplier.manage", params.organizationId);
    const current = findOwned(id, params);
    if (current.version !== patch.expectedVersion) {
      throw new SupplierAdapterError("Supplier item changed since it was loaded. Refresh and try again.", "conflict");
    }
    const changes = {
      ...(patch.purchaseUnit !== undefined ? { purchaseUnit: patch.purchaseUnit.trim() } : {}),
      ...(patch.unitsPerStockUnit !== undefined ? { unitsPerStockUnit: patch.unitsPerStockUnit } : {}),
      ...(patch.unitPrice !== undefined ? { unitPrice: patch.unitPrice } : {}),
      ...(patch.currency !== undefined ? { currency: patch.currency.trim().toUpperCase() } : {}),
      ...(patch.minimumQuantity !== undefined ? { minimumQuantity: patch.minimumQuantity } : {}),
      ...(patch.leadTimeDays !== undefined ? { leadTimeDays: patch.leadTimeDays } : {}),
    };
    validateTerms({ ...current, ...changes });
    const updated = localSupplierItemsStore.update(id, {
      ...changes,
      version: current.version + 1,
    });
    if (!updated) throw new SupplierAdapterError("Supplier item terms could not be updated.", "server-error");
    return updated;
  },

  async deactivateSupplierItem(id: string, params: SupplierScopeParams, expectedVersion: number) {
    return this.updateSupplierItem(id, params, { status: "inactive", expectedVersion });
  },
};
