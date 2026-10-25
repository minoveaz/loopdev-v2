import { catalogAdapter } from "@/loopdev/domains/catalog/adapter";
import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
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

type SupplierItemRow = {
  id: string;
  organization_id: string;
  supplier_id: string;
  supplier_item_code: string | null;
  name: string;
  product_id: string | null;
  variant_id: string | null;
  purchase_unit: string;
  units_per_stock_unit: number | string;
  unit_price: number | string | null;
  currency: string;
  minimum_quantity: number | string | null;
  lead_time_days: number | null;
  status: SupplierItemRecord["status"];
  version: number;
  created_at: string;
  updated_at: string;
};

function clientOrThrow() {
  const client = defaultWebAuthAdapter.getClient();
  if (!client) throw new SupplierAdapterError("Supabase is not configured for the active organization.", "server-error");
  return client;
}

function mapError(error: { code?: string; message: string }): SupplierAdapterError {
  if (error.code === "42501" || /permission|policy|forbidden/i.test(error.message)) {
    return new SupplierAdapterError("You do not have permission to access supplier items in this organization.", "forbidden");
  }
  if (error.code === "23505") return new SupplierAdapterError("Supplier item code already exists for this supplier.", "conflict");
  if (error.code === "23503" || error.code === "23514") {
    return new SupplierAdapterError("Supplier item links or values are invalid for this organization.", "invalid-scope");
  }
  if (error.code === "PGRST116") return new SupplierAdapterError("Supplier item changed or no longer exists.", "conflict");
  return new SupplierAdapterError(error.message, "server-error");
}

function mapSupplierItem(row: SupplierItemRow): SupplierItemRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    supplierId: row.supplier_id,
    supplierItemCode: row.supplier_item_code,
    name: row.name,
    productId: row.product_id,
    variantId: row.variant_id,
    purchaseUnit: row.purchase_unit,
    unitsPerStockUnit: Number(row.units_per_stock_unit),
    unitPrice: row.unit_price === null ? null : Number(row.unit_price),
    currency: row.currency,
    minimumQuantity: row.minimum_quantity === null ? null : Number(row.minimum_quantity),
    leadTimeDays: row.lead_time_days,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

function toItemPatch(patch: SupplierItemUpdateInput) {
  return {
    ...(patch.supplierItemCode !== undefined ? { supplier_item_code: patch.supplierItemCode?.trim() || null } : {}),
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.productId !== undefined ? { product_id: patch.productId } : {}),
    ...(patch.variantId !== undefined ? { variant_id: patch.variantId } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
  };
}

function toTermsPatch(patch: SupplierItemTermsInput) {
  return {
    ...(patch.purchaseUnit !== undefined ? { purchase_unit: patch.purchaseUnit.trim() } : {}),
    ...(patch.unitsPerStockUnit !== undefined ? { units_per_stock_unit: patch.unitsPerStockUnit } : {}),
    ...(patch.unitPrice !== undefined ? { unit_price: patch.unitPrice } : {}),
    ...(patch.currency !== undefined ? { currency: patch.currency.trim().toUpperCase() } : {}),
    ...(patch.minimumQuantity !== undefined ? { minimum_quantity: patch.minimumQuantity } : {}),
    ...(patch.leadTimeDays !== undefined ? { lead_time_days: patch.leadTimeDays } : {}),
  };
}

async function getSupplierItem(id: string, params: SupplierScopeParams): Promise<SupplierItemRecord | null> {
  const { data, error } = await clientOrThrow()
    .from("erp_supplier_items")
    .select("*")
    .eq("id", id)
    .eq("organization_id", params.organizationId)
    .maybeSingle();
  if (error) throw mapError(error);
  return data ? mapSupplierItem(data as SupplierItemRow) : null;
}

export const supabaseSupplierItemAdapter: SupplierItemAdapter = {
  async listSupplierItems(supplierId: string, params: SupplierItemListParams) {
    let query = clientOrThrow()
      .from("erp_supplier_items")
      .select("*")
      .eq("organization_id", params.organizationId)
      .eq("supplier_id", supplierId)
      .order("name");
    if (!params.includeInactive) query = query.neq("status", "inactive");
    const { data, error } = await query;
    if (error) throw mapError(error);
    return ((data ?? []) as SupplierItemRow[]).map(mapSupplierItem);
  },

  async addSupplierItem(input: SupplierItemCreateInput) {
    const { data, error } = await clientOrThrow()
      .from("erp_supplier_items")
      .insert({
        organization_id: input.organizationId,
        supplier_id: input.supplierId,
        supplier_item_code: input.supplierItemCode?.trim() || null,
        name: input.name.trim(),
        purchase_unit: input.purchaseUnit.trim(),
        units_per_stock_unit: input.unitsPerStockUnit,
        unit_price: input.unitPrice ?? null,
        currency: input.currency.trim().toUpperCase(),
        minimum_quantity: input.minimumQuantity ?? null,
        lead_time_days: input.leadTimeDays ?? null,
        status: "draft",
      })
      .select("*")
      .single();
    if (error) throw mapError(error);
    if (!data) throw new SupplierAdapterError("Supplier item could not be created.", "server-error");
    return mapSupplierItem(data as SupplierItemRow);
  },

  async linkSupplierItemToProduct(id: string, params: SupplierScopeParams, input: SupplierItemLinkInput) {
    const productId = input.productId ?? null;
    const variantId = input.variantId ?? null;
    await validateProductLink(params.organizationId, productId, variantId);
    const { data, error } = await clientOrThrow()
      .from("erp_supplier_items")
      .update({ product_id: productId, variant_id: variantId })
      .eq("id", id)
      .eq("organization_id", params.organizationId)
      .eq("version", input.expectedVersion)
      .select("*")
      .maybeSingle();
    if (error) throw mapError(error);
    if (!data) throw new SupplierAdapterError("Supplier item changed or no longer exists. Refresh and try again.", "conflict");
    return mapSupplierItem(data as SupplierItemRow);
  },

  async startProductCreationFromSupplierItem(id: string, params: SupplierScopeParams) {
    const item = await getSupplierItem(id, params);
    if (!item) throw new SupplierAdapterError("Supplier item not found in this organization.", "not-found");
    if (item.productId || item.variantId) throw new SupplierAdapterError("Supplier item is already linked to the catalog.", "conflict");
    return {
      organizationId: item.organizationId,
      supplierId: item.supplierId,
      supplierItemId: item.id,
      version: item.version,
      name: item.name,
      supplierItemCode: item.supplierItemCode,
      purchaseUnit: item.purchaseUnit,
    };
  },

  async updateSupplierItem(id: string, params: SupplierScopeParams, patch: SupplierItemUpdateInput) {
    const changes = toItemPatch(patch);
    if (patch.productId !== undefined || patch.variantId !== undefined) {
      const current = await getSupplierItem(id, params);
      if (!current) throw new SupplierAdapterError("Supplier item not found in this organization.", "not-found");
      const productId = patch.productId !== undefined ? patch.productId : current.productId;
      const variantId = patch.variantId !== undefined ? patch.variantId : current.variantId;
      if (productId || variantId) await validateProductLink(params.organizationId, productId, variantId);
    }
    const { data, error } = await clientOrThrow()
      .from("erp_supplier_items")
      .update(changes)
      .eq("id", id)
      .eq("organization_id", params.organizationId)
      .eq("version", patch.expectedVersion)
      .select("*")
      .maybeSingle();
    if (error) throw mapError(error);
    if (!data) throw new SupplierAdapterError("Supplier item changed or no longer exists. Refresh and try again.", "conflict");
    return mapSupplierItem(data as SupplierItemRow);
  },

  async updateSupplierItemTerms(id: string, params: SupplierScopeParams, patch: SupplierItemTermsInput) {
    const { expectedVersion, ...terms } = patch;
    const { data, error } = await clientOrThrow()
      .from("erp_supplier_items")
      .update(toTermsPatch({ ...terms, expectedVersion }))
      .eq("id", id)
      .eq("organization_id", params.organizationId)
      .eq("version", expectedVersion)
      .select("*")
      .maybeSingle();
    if (error) throw mapError(error);
    if (!data) throw new SupplierAdapterError("Supplier item changed or no longer exists. Refresh and try again.", "conflict");
    return mapSupplierItem(data as SupplierItemRow);
  },

  async deactivateSupplierItem(id: string, params: SupplierScopeParams, expectedVersion: number) {
    return this.updateSupplierItem(id, params, { status: "inactive", expectedVersion });
  },
};
