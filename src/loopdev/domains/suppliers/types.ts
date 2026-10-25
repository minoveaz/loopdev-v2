import type {
  SupplierCreateInput,
  SupplierItemRecord,
  SupplierRecord,
  SupplierStatus,
  SupplierUpdateInput,
} from "../../../../packages/contracts/src/suppliers";

export type {
  SupplierCreateInput,
  SupplierKind,
  SupplierItemRecord,
  SupplierRecord,
  SupplierStatus,
  SupplierUpdateInput,
} from "../../../../packages/contracts/src/suppliers";

export interface SupplierListParams {
  organizationId: string;
  status?: SupplierStatus[];
  includeInactive?: boolean;
}

export interface SupplierScopeParams {
  organizationId: string;
}

export interface SupplierItemListParams extends SupplierScopeParams {
  includeInactive?: boolean;
}

export interface SupplierItemCreateInput extends SupplierScopeParams {
  supplierId: string;
  supplierItemCode?: string | null;
  name: string;
  purchaseUnit: string;
  unitsPerStockUnit: number;
  unitPrice?: number | null;
  currency: string;
  minimumQuantity?: number | null;
  leadTimeDays?: number | null;
}

export interface SupplierItemUpdateInput {
  supplierItemCode?: string | null;
  name?: string;
  productId?: string | null;
  variantId?: string | null;
  status?: SupplierItemRecord["status"];
  expectedVersion: number;
}

export interface SupplierItemTermsInput {
  purchaseUnit?: string;
  unitsPerStockUnit?: number;
  unitPrice?: number | null;
  currency?: string;
  minimumQuantity?: number | null;
  leadTimeDays?: number | null;
  expectedVersion: number;
}

export interface SupplierItemLinkInput {
  productId?: string | null;
  variantId?: string | null;
  expectedVersion: number;
}

export interface SupplierItemProductHandoff {
  organizationId: string;
  supplierId: string;
  supplierItemId: string;
  version: number;
  name: string;
  supplierItemCode: string | null;
  purchaseUnit: string;
}

export class SupplierAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: "not-found" | "conflict" | "invalid-scope" | "forbidden" | "server-error",
  ) {
    super(message);
    this.name = "SupplierAdapterError";
  }
}

export interface SupplierAdapter {
  listSuppliers(params: SupplierListParams): Promise<SupplierRecord[]>;
  getSupplier(id: string, params: SupplierScopeParams): Promise<SupplierRecord | null>;
  createSupplier(input: SupplierCreateInput): Promise<SupplierRecord>;
  updateSupplier(id: string, params: SupplierScopeParams, patch: SupplierUpdateInput): Promise<SupplierRecord>;
  deactivateSupplier(id: string, params: SupplierScopeParams, expectedVersion: number): Promise<SupplierRecord>;
  reactivateSupplier(id: string, params: SupplierScopeParams, expectedVersion: number): Promise<SupplierRecord>;
}

export interface SupplierItemAdapter {
  listSupplierItems(supplierId: string, params: SupplierItemListParams): Promise<SupplierItemRecord[]>;
  addSupplierItem(input: SupplierItemCreateInput): Promise<SupplierItemRecord>;
  linkSupplierItemToProduct(id: string, params: SupplierScopeParams, input: SupplierItemLinkInput): Promise<SupplierItemRecord>;
  startProductCreationFromSupplierItem(id: string, params: SupplierScopeParams): Promise<SupplierItemProductHandoff>;
  updateSupplierItem(id: string, params: SupplierScopeParams, patch: SupplierItemUpdateInput): Promise<SupplierItemRecord>;
  updateSupplierItemTerms(id: string, params: SupplierScopeParams, patch: SupplierItemTermsInput): Promise<SupplierItemRecord>;
  deactivateSupplierItem(id: string, params: SupplierScopeParams, expectedVersion: number): Promise<SupplierItemRecord>;
}
