export const supplierStates = [
  "loading",
  "empty",
  "error",
  "forbidden",
  "conflict",
  "offline",
  "pending",
  "success",
] as const;

export const supplierOperations = [
  "list_suppliers",
  "search_suppliers",
  "view_supplier",
  "create_supplier",
  "update_supplier",
  "deactivate_supplier",
  "reactivate_supplier",
] as const;

export const supplierAssortmentOperations = [
  "list_supplier_items",
  "add_supplier_item",
  "link_supplier_item_to_product",
  "start_product_creation_from_supplier_item",
  "update_supplier_item",
  "update_supplier_item_terms",
  "deactivate_supplier_item",
] as const;

export const supplierP2POperations = [
  "manage_supplier_contacts_addresses",
  "manage_supplier_purchase_defaults",
  "manage_supplier_tax_profile",
  "manage_supplier_payee_instructions",
  "verify_supplier_payee_account",
] as const;

export type SupplierOperation = (typeof supplierOperations)[number];
export type SupplierKind = "organization" | "individual";
export type SupplierStatus = "active" | "on_hold" | "inactive";
export type SupplierP2POperation = (typeof supplierP2POperations)[number];
export type SupplierContactRole = "purchasing" | "receiving" | "ap_invoices" | "remittance";
export type SupplierAddressPurpose = "legal" | "billing" | "order" | "ship_from" | "remit_to" | "returns";

export interface SupplierRecord {
  id: string;
  organizationId: string;
  kind: SupplierKind;
  legalName: string;
  countryCode: string;
  status: SupplierStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCreateInput {
  organizationId: string;
  kind: SupplierKind;
  legalName: string;
  countryCode: string;
}

export interface SupplierUpdateInput {
  kind?: SupplierKind;
  legalName?: string;
  countryCode?: string;
  status?: SupplierStatus;
  expectedVersion: number;
}

export interface SupplierContactSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: SupplierContactRole | null;
  isPrimary: boolean;
  status: "active" | "inactive";
  version: number;
}

export interface SupplierAddress {
  id: string;
  label: string;
  purpose: SupplierAddressPurpose;
  countryCode: string;
  region: string | null;
  locality: string | null;
  postalCode: string | null;
  addressLines: string[];
  isPrimary: boolean;
  status: "active" | "inactive";
  version: number;
}

export interface SupplierPurchaseDefaults {
  currency: string | null;
  paymentTermCode: string | null;
  deliveryTermCode: string | null;
  deliveryAddressId: string | null;
  financeReference: string | null;
}

export type SupplierTaxProfileStatus =
  | "not_configured"
  | "pending_review"
  | "verified"
  | "rejected";

export interface SupplierTaxProfileSummary {
  jurisdictionCode: string;
  status: SupplierTaxProfileStatus;
  policyVersion: string | null;
}

export type SupplierPayeeInstructionStatus = "pending_verification" | "verified" | "rejected";

export interface SupplierPayeeInstructionSummary {
  id: string;
  status: SupplierPayeeInstructionStatus;
  maskedDisplayLabel: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  version: number;
}

export interface SupplierP2PSummary {
  contacts: SupplierContactSummary[];
  addresses: SupplierAddress[];
  purchaseDefaults: SupplierPurchaseDefaults;
  taxProfiles: SupplierTaxProfileSummary[];
  payeeInstructions: SupplierPayeeInstructionSummary[];
}

export interface SupplierContactInput {
  id?: string;
  expectedVersion?: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: SupplierContactRole;
  isPrimary: boolean;
}

export interface SupplierAddressInput {
  id?: string;
  expectedVersion?: number;
  label: string;
  purpose: SupplierAddressPurpose;
  countryCode: string;
  region: string | null;
  locality: string | null;
  postalCode: string | null;
  addressLines: string[];
  isPrimary: boolean;
}

export interface SupplierP2PSetupInput {
  expectedVersion: number;
  contacts: SupplierContactInput[];
  addresses: SupplierAddressInput[];
  purchaseDefaults: SupplierPurchaseDefaults;
}

export interface SupplierPayeeInstruction {
  id: string;
  beneficiaryName: string;
  bankCountryCode: string;
  bankName: string | null;
  accountIdentifier: string;
  currency: string;
  status: "pending_review" | "verified" | "rejected" | "inactive";
  rejectionReason: string | null;
  updatedBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  version: number;
}

export interface SupplierPayeeInstructionInput {
  beneficiaryName: string;
  bankCountryCode: string;
  bankName: string | null;
  accountIdentifier: string;
  currency: string;
  expectedVersion?: number;
}

export type SupplierP2PErrorCode =
  | "forbidden"
  | "conflict"
  | "invalid-input"
  | "verification-required"
  | "secure-storage-required"
  | "server-error";

export interface SupplierItemRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  supplierItemCode: string | null;
  name: string;
  productId: string | null;
  variantId: string | null;
  purchaseUnit: string;
  unitsPerStockUnit: number;
  unitPrice: number | null;
  currency: string;
  minimumQuantity: number | null;
  leadTimeDays: number | null;
  status: "draft" | "active" | "inactive";
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function isSupplierItemPurchasable(
  item: SupplierItemRecord,
  linkedProductOrganizationId: string | null,
): boolean {
  return Boolean(
    item.status === "active"
    && Boolean(item.productId) !== Boolean(item.variantId)
    && linkedProductOrganizationId === item.organizationId
    && Number.isFinite(item.unitsPerStockUnit)
    && item.unitsPerStockUnit > 0,
  );
}
