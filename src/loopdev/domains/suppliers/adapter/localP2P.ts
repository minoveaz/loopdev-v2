import { localPlatformAdapter } from "@/loopdev/domains/platform/adapter";
import { localSupplierP2PStore } from "../data/localSupplierP2P";
import { localSupplierAdapter } from "./local";
import { supplierP2PValidationError } from "../rules";
import { SupplierAdapterError } from "../types";
import type {
  SupplierP2PAdapter,
  SupplierP2PSetup,
  SupplierP2PSetupInput,
  SupplierScopeParams,
} from "../types";

const emptyPurchaseDefaults = {
  currency: null,
  paymentTermCode: null,
  deliveryTermCode: null,
  deliveryAddressId: null,
  financeReference: null,
};

function assertPermission(permission: "supplier.read" | "supplier.manage", organizationId: string): void {
  if (!organizationId || !localPlatformAdapter.hasPermission(permission, { organizationId, workspaceId: null })) {
    throw new SupplierAdapterError("You do not have permission to access supplier setup in this organization.", "forbidden");
  }
}

function loadRecord(supplierId: string, params: SupplierScopeParams) {
  const supplier = localSupplierP2PStore.list().find((record) =>
    record.supplierId === supplierId && record.organizationId === params.organizationId);
  return supplier;
}

function createSetup(record?: ReturnType<typeof loadRecord>): SupplierP2PSetup {
  return {
    version: record?.version ?? 0,
    contacts: record?.contacts.filter((contact) => contact.status === "active") ?? [],
    addresses: record?.addresses.filter((address) => address.status === "active") ?? [],
    purchaseDefaults: record?.purchaseDefaults ?? emptyPurchaseDefaults,
    payeeInstructions: [],
  };
}

function secureStorageRequired(): never {
  throw new SupplierAdapterError(
    "Payment instructions are unavailable in local demo mode because bank details require secure remote storage.",
    "secure-storage-required",
  );
}

export const localSupplierP2PAdapter: SupplierP2PAdapter = {
  async canReviewPayee(params) {
    return Boolean(params.organizationId
      && localPlatformAdapter.hasPermission("supplier.verify", { organizationId: params.organizationId, workspaceId: null }));
  },

  async getSetup(supplierId, params) {
    assertPermission("supplier.read", params.organizationId);
    const supplier = await localSupplierAdapter.getSupplier(supplierId, params);
    if (!supplier) throw new SupplierAdapterError("Supplier not found in this organization.", "not-found");
    return createSetup(loadRecord(supplierId, params));
  },

  async saveSetup(supplierId, params, input) {
    assertPermission("supplier.manage", params.organizationId);
    const supplier = await localSupplierAdapter.getSupplier(supplierId, params);
    if (!supplier) throw new SupplierAdapterError("Supplier not found in this organization.", "not-found");
    const validationError = supplierP2PValidationError(input);
    if (validationError) throw new SupplierAdapterError(validationError, "invalid-input");

    const existing = loadRecord(supplierId, params);
    if ((existing?.version ?? 0) !== input.expectedVersion) {
      throw new SupplierAdapterError("Supplier setup changed since it was loaded. Refresh and try again.", "conflict");
    }
    for (const contact of input.contacts) {
      const current = existing?.contacts.find((item) => item.id === contact.id);
      if ((current && current.version !== contact.expectedVersion)
        || (!current && contact.expectedVersion !== undefined)) {
        throw new SupplierAdapterError("Supplier contact changed since it was loaded. Refresh and try again.", "conflict");
      }
    }
    for (const address of input.addresses) {
      const current = existing?.addresses.find((item) => item.id === address.id);
      if ((current && current.version !== address.expectedVersion)
        || (!current && address.expectedVersion !== undefined)) {
        throw new SupplierAdapterError("Supplier address changed since it was loaded. Refresh and try again.", "conflict");
      }
    }
    const activeContactIds = new Set(input.contacts.map((contact) => contact.id).filter((id): id is string => Boolean(id)));
    const activeAddressIds = new Set(input.addresses.map((address) => address.id).filter((id): id is string => Boolean(id)));
    const data = {
      organizationId: params.organizationId,
      supplierId,
      contacts: [
        ...(existing?.contacts ?? []).filter((contact) => contact.status === "inactive"
          || !activeContactIds.has(contact.id)).map((contact) => ({
          ...contact,
          status: "inactive" as const,
          isPrimary: false,
          version: contact.status === "active" ? contact.version + 1 : contact.version,
        })),
        ...input.contacts.map((contact, index) => ({
          id: contact.id ?? `${supplierId}-contact-${index + 1}`,
          name: contact.name.trim(),
          email: contact.email?.trim() || null,
          phone: contact.phone?.trim() || null,
          role: contact.role,
          isPrimary: contact.isPrimary,
          status: "active" as const,
          version: (contact.expectedVersion ?? 0) + 1,
        })),
      ],
      addresses: [
        ...(existing?.addresses ?? []).filter((address) => address.status === "inactive"
          || !activeAddressIds.has(address.id)).map((address) => ({
          ...address,
          status: "inactive" as const,
          isPrimary: false,
          version: address.status === "active" ? address.version + 1 : address.version,
        })),
        ...input.addresses.map((address, index) => ({
          id: address.id ?? `${supplierId}-address-${index + 1}`,
          label: address.label.trim(),
          purpose: address.purpose,
          countryCode: address.countryCode.trim().toUpperCase(),
          region: address.region?.trim() || null,
          locality: address.locality?.trim() || null,
          postalCode: address.postalCode?.trim() || null,
          addressLines: address.addressLines.map((line) => line.trim()).filter(Boolean),
          isPrimary: address.isPrimary,
          status: "active" as const,
          version: (address.expectedVersion ?? 0) + 1,
        })),
      ],
      purchaseDefaults: {
        currency: input.purchaseDefaults.currency?.trim().toUpperCase() ?? null,
        paymentTermCode: input.purchaseDefaults.paymentTermCode?.trim() || null,
        deliveryTermCode: input.purchaseDefaults.deliveryTermCode?.trim() || null,
        deliveryAddressId: input.purchaseDefaults.deliveryAddressId,
        financeReference: input.purchaseDefaults.financeReference?.trim() || null,
      },
      version: (existing?.version ?? 0) + 1,
    };
    if (existing) {
      const updated = localSupplierP2PStore.update(existing.id, data);
      if (!updated) throw new SupplierAdapterError("Supplier setup could not be saved.", "server-error");
      return createSetup(updated);
    }
    return createSetup(localSupplierP2PStore.create(data));
  },

  async createPayeeInstruction() {
    return secureStorageRequired();
  },

  async updatePayeeInstruction() {
    return secureStorageRequired();
  },

  async verifyPayeeInstruction() {
    return secureStorageRequired();
  },

  async rejectPayeeInstruction() {
    return secureStorageRequired();
  },
};
