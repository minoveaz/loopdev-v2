import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import { SupplierAdapterError } from "../types";
import type {
  SupplierAdapter,
  SupplierCreateInput,
  SupplierListParams,
  SupplierRecord,
  SupplierScopeParams,
  SupplierUpdateInput,
} from "../types";

type SupplierRow = {
  id: string;
  organization_id: string;
  kind: SupplierRecord["kind"];
  legal_name: string;
  country_code: string;
  status: SupplierRecord["status"];
  version: number;
  created_at: string;
  updated_at: string;
};

function clientOrThrow() {
  const client = defaultWebAuthAdapter.getClient();
  if (!client) throw new SupplierAdapterError("Supabase is not configured for the active organization.", "server-error");
  return client;
}

function mapSupplier(row: SupplierRow): SupplierRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    kind: row.kind,
    legalName: row.legal_name,
    countryCode: row.country_code,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapError(error: { code?: string; message: string }): SupplierAdapterError {
  if (error.code === "42501" || /permission|policy|forbidden/i.test(error.message)) {
    return new SupplierAdapterError("You do not have permission to access suppliers in this organization.", "forbidden");
  }
  if (error.code === "23514") return new SupplierAdapterError(error.message, "server-error");
  if (error.code === "PGRST116") return new SupplierAdapterError("Supplier changed or no longer exists.", "conflict");
  return new SupplierAdapterError(error.message, "server-error");
}

export const supabaseSupplierAdapter: SupplierAdapter = {
  async listSuppliers(params: SupplierListParams) {
    let query = clientOrThrow()
      .from("erp_suppliers")
      .select("*")
      .eq("organization_id", params.organizationId)
      .order("legal_name");
    if (!params.includeInactive) query = query.neq("status", "inactive");
    if (params.status?.length) query = query.in("status", params.status);
    const { data, error } = await query;
    if (error) throw mapError(error);
    return ((data ?? []) as SupplierRow[]).map(mapSupplier);
  },

  async getSupplier(id: string, params: SupplierScopeParams) {
    const { data, error } = await clientOrThrow()
      .from("erp_suppliers")
      .select("*")
      .eq("id", id)
      .eq("organization_id", params.organizationId)
      .maybeSingle();
    if (error) throw mapError(error);
    return data ? mapSupplier(data as SupplierRow) : null;
  },

  async createSupplier(input: SupplierCreateInput) {
    const { data, error } = await clientOrThrow()
      .from("erp_suppliers")
      .insert({
        organization_id: input.organizationId,
        kind: input.kind,
        legal_name: input.legalName.trim(),
        country_code: input.countryCode.trim().toUpperCase(),
      })
      .select("*")
      .single();
    if (error) throw mapError(error);
    if (!data) throw new SupplierAdapterError("Supplier could not be created.", "server-error");
    return mapSupplier(data as SupplierRow);
  },

  async updateSupplier(id: string, params: SupplierScopeParams, patch: SupplierUpdateInput) {
    const { expectedVersion, ...changes } = patch;
    const { data, error } = await clientOrThrow()
      .from("erp_suppliers")
      .update({
        ...(changes.kind !== undefined ? { kind: changes.kind } : {}),
        ...(changes.legalName !== undefined ? { legal_name: changes.legalName.trim() } : {}),
        ...(changes.countryCode !== undefined ? { country_code: changes.countryCode.trim().toUpperCase() } : {}),
        ...(changes.status !== undefined ? { status: changes.status } : {}),
      })
      .eq("id", id)
      .eq("organization_id", params.organizationId)
      .eq("version", expectedVersion)
      .select("*")
      .maybeSingle();
    if (error) throw mapError(error);
    if (!data) throw new SupplierAdapterError("Supplier changed or no longer exists. Refresh and try again.", "conflict");
    return mapSupplier(data as SupplierRow);
  },

  async deactivateSupplier(id: string, params: SupplierScopeParams, expectedVersion: number) {
    return this.updateSupplier(id, params, { status: "inactive", expectedVersion });
  },

  async reactivateSupplier(id: string, params: SupplierScopeParams, expectedVersion: number) {
    return this.updateSupplier(id, params, { status: "active", expectedVersion });
  },
};
