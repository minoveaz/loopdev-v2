import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import { SupplierAdapterError } from "../types";
import { supplierP2PValidationError } from "../rules";
import type {
  SupplierAddress,
  SupplierContactSummary,
  SupplierPayeeInstruction,
  SupplierPayeeInstructionInput,
  SupplierP2PAdapter,
  SupplierP2PSetup,
  SupplierP2PSetupInput,
  SupplierScopeParams,
} from "../types";
import { supabaseSupplierAdapter } from "./supabase";

type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: SupplierContactSummary["role"];
  is_primary: boolean;
  status: SupplierContactSummary["status"];
  version: number;
};

type AddressRow = {
  id: string;
  label: string;
  purpose: SupplierAddress["purpose"];
  country_code: string;
  region: string | null;
  locality: string | null;
  postal_code: string | null;
  address_lines: string[];
  is_primary: boolean;
  status: SupplierAddress["status"];
  version: number;
};

type PurchaseDefaultsRow = {
  currency: string | null;
  payment_term_code: string | null;
  delivery_term_code: string | null;
  delivery_address_id: string | null;
  finance_reference: string | null;
  version: number;
};

type PayeeInstructionRow = {
  id: string;
  beneficiary_name: string;
  bank_country_code: string;
  bank_name: string | null;
  account_identifier: string;
  currency: string;
  status: SupplierPayeeInstruction["status"];
  rejection_reason: string | null;
  updated_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  version: number;
};

function clientOrThrow() {
  const client = defaultWebAuthAdapter.getClient();
  if (!client) throw new SupplierAdapterError("Supabase is not configured for the active organization.", "server-error");
  return client;
}

function mapError(error: { code?: string; message: string }): SupplierAdapterError {
  if (/failed to fetch|network|offline/i.test(error.message)) {
    return new SupplierAdapterError("Supplier setup is unavailable while offline.", "offline");
  }
  if (error.code === "42501" || /permission|policy|forbidden/i.test(error.message)) {
    return new SupplierAdapterError("You do not have permission to manage supplier setup in this organization.", "forbidden");
  }
  if (error.code === "23505") return new SupplierAdapterError("A primary contact or address already exists for this purpose.", "conflict");
  if (error.code === "23514") return new SupplierAdapterError(error.message, "invalid-input");
  if (error.code === "P0002") return new SupplierAdapterError("Supplier setup record was not found in this organization.", "not-found");
  if (error.code === "PGRST116" || error.code === "40001") {
    return new SupplierAdapterError("Supplier setup changed since it was loaded. Refresh and try again.", "conflict");
  }
  return new SupplierAdapterError(error.message, "server-error");
}

function mapContact(row: ContactRow): SupplierContactSummary {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isPrimary: row.is_primary,
    status: row.status,
    version: row.version,
  };
}

function mapAddress(row: AddressRow): SupplierAddress {
  return {
    id: row.id,
    label: row.label,
    purpose: row.purpose,
    countryCode: row.country_code,
    region: row.region,
    locality: row.locality,
    postalCode: row.postal_code,
    addressLines: row.address_lines,
    isPrimary: row.is_primary,
    status: row.status,
    version: row.version,
  };
}

function mapPayeeInstruction(row: PayeeInstructionRow): SupplierPayeeInstruction {
  return {
    id: row.id,
    beneficiaryName: row.beneficiary_name,
    bankCountryCode: row.bank_country_code,
    bankName: row.bank_name,
    accountIdentifier: row.account_identifier,
    currency: row.currency,
    status: row.status,
    rejectionReason: row.rejection_reason,
    updatedBy: row.updated_by,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    version: row.version,
  };
}

export const supabaseSupplierP2PAdapter: SupplierP2PAdapter = {
  async canReviewPayee(params) {
    const { data, error } = await clientOrThrow().rpc("can_review_erp_supplier_payee", {
      p_organization_id: params.organizationId,
    });
    if (error) throw mapError(error);
    return data === true;
  },

  async getSetup(supplierId, params) {
    const supplier = await supabaseSupplierAdapter.getSupplier(supplierId, params);
    if (!supplier) throw new SupplierAdapterError("Supplier not found in this organization.", "not-found");
    const client = clientOrThrow();
    const [contactsResult, addressesResult, defaultsResult, payeeResult] = await Promise.all([
      client.from("erp_supplier_contacts").select("*").eq("organization_id", params.organizationId).eq("supplier_id", supplierId).eq("status", "active"),
      client.from("erp_supplier_addresses").select("*").eq("organization_id", params.organizationId).eq("supplier_id", supplierId).eq("status", "active"),
      client.from("erp_supplier_purchase_defaults").select("*").eq("organization_id", params.organizationId).eq("supplier_id", supplierId).maybeSingle(),
      client.from("erp_supplier_payment_instructions").select("*").eq("organization_id", params.organizationId).eq("supplier_id", supplierId).neq("status", "inactive"),
    ]);
    if (contactsResult.error) throw mapError(contactsResult.error);
    if (addressesResult.error) throw mapError(addressesResult.error);
    if (defaultsResult.error) throw mapError(defaultsResult.error);
    if (payeeResult.error) throw mapError(payeeResult.error);

    const defaults = defaultsResult.data as PurchaseDefaultsRow | null;
    return {
      version: defaults?.version ?? 0,
      contacts: ((contactsResult.data ?? []) as ContactRow[]).map(mapContact),
      addresses: ((addressesResult.data ?? []) as AddressRow[]).map(mapAddress),
      purchaseDefaults: {
        currency: defaults?.currency ?? null,
        paymentTermCode: defaults?.payment_term_code ?? null,
        deliveryTermCode: defaults?.delivery_term_code ?? null,
        deliveryAddressId: defaults?.delivery_address_id ?? null,
        financeReference: defaults?.finance_reference ?? null,
      },
      payeeInstructions: ((payeeResult.data ?? []) as PayeeInstructionRow[]).map(mapPayeeInstruction),
    };
  },

  async saveSetup(supplierId, params, input) {
    const supplier = await supabaseSupplierAdapter.getSupplier(supplierId, params);
    if (!supplier) throw new SupplierAdapterError("Supplier not found in this organization.", "not-found");
    const validationError = supplierP2PValidationError(input);
    if (validationError) throw new SupplierAdapterError(validationError, "invalid-input");
    const client = clientOrThrow();
    const currentSetup = await this.getSetup(supplierId, params);
    const contactIds = new Set(input.contacts.map((contact) => contact.id).filter((id): id is string => Boolean(id)));
    const addressIds = new Set(input.addresses.map((address) => address.id).filter((id): id is string => Boolean(id)));

    for (const contact of currentSetup.contacts.filter((item) => !contactIds.has(item.id))) {
      const { error, data } = await client.from("erp_supplier_contacts")
        .update({ status: "inactive", is_primary: false })
        .eq("id", contact.id)
        .eq("organization_id", params.organizationId)
        .eq("supplier_id", supplierId)
        .eq("version", contact.version)
        .select("id")
        .maybeSingle();
      if (error) throw mapError(error);
      if (!data) throw new SupplierAdapterError("Supplier contact changed since it was loaded. Refresh and try again.", "conflict");
    }
    for (const address of currentSetup.addresses.filter((item) => !addressIds.has(item.id))) {
      const { error, data } = await client.from("erp_supplier_addresses")
        .update({ status: "inactive", is_primary: false })
        .eq("id", address.id)
        .eq("organization_id", params.organizationId)
        .eq("supplier_id", supplierId)
        .eq("version", address.version)
        .select("id")
        .maybeSingle();
      if (error) throw mapError(error);
      if (!data) throw new SupplierAdapterError("Supplier address changed since it was loaded. Refresh and try again.", "conflict");
    }

    for (const contact of [...input.contacts].sort((left, right) => Number(left.isPrimary) - Number(right.isPrimary))) {
      const values = {
        organization_id: params.organizationId,
        supplier_id: supplierId,
        name: contact.name.trim(),
        email: contact.email?.trim() || null,
        phone: contact.phone?.trim() || null,
        role: contact.role,
        is_primary: contact.isPrimary,
        ...(contact.id && contact.expectedVersion === undefined ? { id: contact.id } : {}),
      };
      const result = contact.expectedVersion === undefined
        ? await client.from("erp_supplier_contacts").insert(values).select("*").single()
        : await client.from("erp_supplier_contacts")
          .update(values)
          .eq("id", contact.id)
          .eq("organization_id", params.organizationId)
          .eq("supplier_id", supplierId)
          .eq("version", contact.expectedVersion)
          .select("*")
          .maybeSingle();
      if (result.error) throw mapError(result.error);
      if (!result.data) throw new SupplierAdapterError("Supplier contact changed or no longer exists. Refresh and try again.", "conflict");
    }

    for (const address of [...input.addresses].sort((left, right) => Number(left.isPrimary) - Number(right.isPrimary))) {
      const values = {
        organization_id: params.organizationId,
        supplier_id: supplierId,
        label: address.label.trim(),
        purpose: address.purpose,
        country_code: address.countryCode.trim().toUpperCase(),
        region: address.region?.trim() || null,
        locality: address.locality?.trim() || null,
        postal_code: address.postalCode?.trim() || null,
        address_lines: address.addressLines.map((line) => line.trim()).filter(Boolean),
        is_primary: address.isPrimary,
        ...(address.id && address.expectedVersion === undefined ? { id: address.id } : {}),
      };
      const result = address.expectedVersion === undefined
        ? await client.from("erp_supplier_addresses").insert(values).select("*").single()
        : await client.from("erp_supplier_addresses")
          .update(values)
          .eq("id", address.id)
          .eq("organization_id", params.organizationId)
          .eq("supplier_id", supplierId)
          .eq("version", address.expectedVersion)
          .select("*")
          .maybeSingle();
      if (result.error) throw mapError(result.error);
      if (!result.data) throw new SupplierAdapterError("Supplier address changed or no longer exists. Refresh and try again.", "conflict");
    }

    const defaults = {
      organization_id: params.organizationId,
      supplier_id: supplierId,
      currency: input.purchaseDefaults.currency?.trim().toUpperCase() || null,
      payment_term_code: input.purchaseDefaults.paymentTermCode?.trim() || null,
      delivery_term_code: input.purchaseDefaults.deliveryTermCode?.trim() || null,
      delivery_address_id: input.purchaseDefaults.deliveryAddressId,
      finance_reference: input.purchaseDefaults.financeReference?.trim() || null,
    };
    const defaultsResult = input.expectedVersion === 0
      ? await client.from("erp_supplier_purchase_defaults").insert(defaults).select("*").single()
      : await client.from("erp_supplier_purchase_defaults")
        .update(defaults)
        .eq("organization_id", params.organizationId)
        .eq("supplier_id", supplierId)
        .eq("version", input.expectedVersion)
        .select("*")
        .maybeSingle();
    if (defaultsResult.error) throw mapError(defaultsResult.error);
    if (!defaultsResult.data) throw new SupplierAdapterError("Purchase defaults changed since they were loaded. Refresh and try again.", "conflict");

    return this.getSetup(supplierId, params);
  },

  async createPayeeInstruction(supplierId, params, input) {
    const supplier = await supabaseSupplierAdapter.getSupplier(supplierId, params);
    if (!supplier) throw new SupplierAdapterError("Supplier not found in this organization.", "not-found");
    const { data, error } = await clientOrThrow()
      .from("erp_supplier_payment_instructions")
      .insert({
        organization_id: params.organizationId,
        supplier_id: supplierId,
        beneficiary_name: input.beneficiaryName.trim(),
        bank_country_code: input.bankCountryCode.trim().toUpperCase(),
        bank_name: input.bankName?.trim() || null,
        account_identifier: input.accountIdentifier.trim(),
        currency: input.currency.trim().toUpperCase(),
        status: "pending_review",
      })
      .select("*")
      .single();
    if (error) throw mapError(error);
    if (!data) throw new SupplierAdapterError("Payee instruction could not be saved.", "server-error");
    return mapPayeeInstruction(data as PayeeInstructionRow);
  },

  async updatePayeeInstruction(id, supplierId, params, input) {
    if (input.expectedVersion === undefined) {
      throw new SupplierAdapterError("Expected payee version is required for updates.", "invalid-input");
    }
    const { data, error } = await clientOrThrow()
      .from("erp_supplier_payment_instructions")
      .update({
        beneficiary_name: input.beneficiaryName.trim(),
        bank_country_code: input.bankCountryCode.trim().toUpperCase(),
        bank_name: input.bankName?.trim() || null,
        account_identifier: input.accountIdentifier.trim(),
        currency: input.currency.trim().toUpperCase(),
      })
      .eq("id", id)
      .eq("organization_id", params.organizationId)
      .eq("supplier_id", supplierId)
      .eq("version", input.expectedVersion)
      .select("*")
      .maybeSingle();
    if (error) throw mapError(error);
    if (!data) throw new SupplierAdapterError("Payee instruction changed or no longer exists. Refresh and try again.", "conflict");
    return mapPayeeInstruction(data as PayeeInstructionRow);
  },

  async verifyPayeeInstruction(id, params, expectedVersion) {
    const { data, error } = await clientOrThrow().rpc("review_erp_supplier_payee_instruction", {
      p_instruction_id: id,
      p_organization_id: params.organizationId,
      p_expected_version: expectedVersion,
      p_decision: "verified",
      p_rejection_reason: null,
    });
    if (error) throw mapError(error);
    if (!data) throw new SupplierAdapterError("Payee instruction changed or no longer exists. Refresh and try again.", "conflict");
    return mapPayeeInstruction(data as PayeeInstructionRow);
  },

  async rejectPayeeInstruction(id, params, expectedVersion, reason) {
    if (!reason.trim()) throw new SupplierAdapterError("A rejection reason is required.", "invalid-input");
    const { data, error } = await clientOrThrow().rpc("review_erp_supplier_payee_instruction", {
      p_instruction_id: id,
      p_organization_id: params.organizationId,
      p_expected_version: expectedVersion,
      p_decision: "rejected",
      p_rejection_reason: reason.trim(),
    });
    if (error) throw mapError(error);
    if (!data) throw new SupplierAdapterError("Payee instruction changed or no longer exists. Refresh and try again.", "conflict");
    return mapPayeeInstruction(data as PayeeInstructionRow);
  },
};
