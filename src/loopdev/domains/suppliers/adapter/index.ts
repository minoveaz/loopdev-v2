import { localSupplierAdapter } from "./local";
import { localSupplierItemAdapter } from "./localItems";
import { supabaseSupplierAdapter } from "./supabase";
import { supabaseSupplierItemAdapter } from "./supabaseItems";
import type {
  SupplierAdapter,
  SupplierCreateInput,
  SupplierItemAdapter,
  SupplierItemCreateInput,
  SupplierItemLinkInput,
  SupplierItemListParams,
  SupplierItemTermsInput,
  SupplierItemUpdateInput,
  SupplierListParams,
  SupplierScopeParams,
  SupplierUpdateInput,
} from "../types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isRemoteOrganization = (organizationId: unknown): organizationId is string =>
  typeof organizationId === "string" && UUID_PATTERN.test(organizationId);

export const supplierAdapter: SupplierAdapter = {
  listSuppliers(params: SupplierListParams) {
    return isRemoteOrganization(params.organizationId)
      ? supabaseSupplierAdapter.listSuppliers(params)
      : localSupplierAdapter.listSuppliers(params);
  },
  getSupplier(id: string, params: SupplierScopeParams) {
    return isRemoteOrganization(params.organizationId)
      ? supabaseSupplierAdapter.getSupplier(id, params)
      : localSupplierAdapter.getSupplier(id, params);
  },
  createSupplier(input: SupplierCreateInput) {
    return isRemoteOrganization(input.organizationId)
      ? supabaseSupplierAdapter.createSupplier(input)
      : localSupplierAdapter.createSupplier(input);
  },
  updateSupplier(id: string, params: SupplierScopeParams, patch: SupplierUpdateInput) {
    return isRemoteOrganization(params.organizationId)
      ? supabaseSupplierAdapter.updateSupplier(id, params, patch)
      : localSupplierAdapter.updateSupplier(id, params, patch);
  },
  deactivateSupplier(id: string, params: SupplierScopeParams, expectedVersion: number) {
    return isRemoteOrganization(params.organizationId)
      ? supabaseSupplierAdapter.deactivateSupplier(id, params, expectedVersion)
      : localSupplierAdapter.deactivateSupplier(id, params, expectedVersion);
  },
  reactivateSupplier(id: string, params: SupplierScopeParams, expectedVersion: number) {
    return isRemoteOrganization(params.organizationId)
      ? supabaseSupplierAdapter.reactivateSupplier(id, params, expectedVersion)
      : localSupplierAdapter.reactivateSupplier(id, params, expectedVersion);
  },
};

export const supplierItemAdapter: SupplierItemAdapter = {
  listSupplierItems(supplierId: string, params: SupplierItemListParams) {
    return isRemoteOrganization(params.organizationId)
      ? supabaseSupplierItemAdapter.listSupplierItems(supplierId, params)
      : localSupplierItemAdapter.listSupplierItems(supplierId, params);
  },
  addSupplierItem(input: SupplierItemCreateInput) {
    return isRemoteOrganization(input.organizationId)
      ? supabaseSupplierItemAdapter.addSupplierItem(input)
      : localSupplierItemAdapter.addSupplierItem(input);
  },
  linkSupplierItemToProduct(id: string, params: SupplierScopeParams, input: SupplierItemLinkInput) {
    return isRemoteOrganization(params.organizationId)
      ? supabaseSupplierItemAdapter.linkSupplierItemToProduct(id, params, input)
      : localSupplierItemAdapter.linkSupplierItemToProduct(id, params, input);
  },
  startProductCreationFromSupplierItem(id: string, params: SupplierScopeParams) {
    return isRemoteOrganization(params.organizationId)
      ? supabaseSupplierItemAdapter.startProductCreationFromSupplierItem(id, params)
      : localSupplierItemAdapter.startProductCreationFromSupplierItem(id, params);
  },
  updateSupplierItem(id: string, params: SupplierScopeParams, patch: SupplierItemUpdateInput) {
    return isRemoteOrganization(params.organizationId)
      ? supabaseSupplierItemAdapter.updateSupplierItem(id, params, patch)
      : localSupplierItemAdapter.updateSupplierItem(id, params, patch);
  },
  updateSupplierItemTerms(id: string, params: SupplierScopeParams, patch: SupplierItemTermsInput) {
    return isRemoteOrganization(params.organizationId)
      ? supabaseSupplierItemAdapter.updateSupplierItemTerms(id, params, patch)
      : localSupplierItemAdapter.updateSupplierItemTerms(id, params, patch);
  },
  deactivateSupplierItem(id: string, params: SupplierScopeParams, expectedVersion: number) {
    return isRemoteOrganization(params.organizationId)
      ? supabaseSupplierItemAdapter.deactivateSupplierItem(id, params, expectedVersion)
      : localSupplierItemAdapter.deactivateSupplierItem(id, params, expectedVersion);
  },
};

export { SupplierAdapterError } from "../types";
export type {
  SupplierAdapter,
  SupplierItemAdapter,
  SupplierItemCreateInput,
  SupplierItemLinkInput,
  SupplierItemListParams,
  SupplierItemProductHandoff,
  SupplierItemTermsInput,
  SupplierItemUpdateInput,
} from "../types";
