import { beforeEach, describe, expect, it } from "vitest";
import { localSupplierP2PStore } from "@/loopdev/domains/suppliers/data/localSupplierP2P";
import { localSuppliersStore } from "@/loopdev/domains/suppliers/data/localSuppliers";
import { localSupplierAdapter } from "@/loopdev/domains/suppliers/adapter/local";
import { localSupplierP2PAdapter } from "@/loopdev/domains/suppliers/adapter/localP2P";
import { supplierP2PValidationError } from "@/loopdev/domains/suppliers/rules";

const organizationId = "local-development-organization";

describe("Supplier P2P setup adapter", () => {
  beforeEach(() => {
    localSuppliersStore.reset();
    localSupplierP2PStore.reset();
  });

  it("saves contacts, addresses and purchasing defaults with optimistic versioning", async () => {
    const supplier = await localSupplierAdapter.createSupplier({
      organizationId,
      kind: "organization",
      legalName: "P2P setup test supplier",
      countryCode: "ES",
    });
    const input = {
      expectedVersion: 0,
      contacts: [{
        id: "contact-purchasing",
        name: "Purchasing contact",
        email: "buyer@example.test",
        phone: null,
        role: "purchasing" as const,
        isPrimary: true,
      }],
      addresses: [{
        id: "address-order",
        label: "Order address",
        purpose: "order" as const,
        countryCode: "ES",
        region: "Madrid",
        locality: "Madrid",
        postalCode: "28001",
        addressLines: ["Calle de Prueba 1"],
        isPrimary: true,
      }],
      purchaseDefaults: {
        currency: "EUR",
        paymentTermCode: "NET30",
        deliveryTermCode: "DAP",
        deliveryAddressId: "address-order",
        financeReference: "AP-100",
      },
    };

    const saved = await localSupplierP2PAdapter.saveSetup(supplier.id, { organizationId }, input);

    expect(saved.version).toBe(1);
    expect(saved.contacts).toEqual([expect.objectContaining({ name: "Purchasing contact", version: 1 })]);
    expect(saved.addresses).toEqual([expect.objectContaining({ label: "Order address", version: 1 })]);
    expect(saved.purchaseDefaults).toEqual(input.purchaseDefaults);
    await expect(localSupplierP2PAdapter.saveSetup(supplier.id, { organizationId }, input))
      .rejects.toMatchObject({ code: "conflict" });
  });

  it("keeps removed contacts and addresses inactive and rejects stale child versions", async () => {
    const supplier = await localSupplierAdapter.createSupplier({
      organizationId,
      kind: "organization",
      legalName: "P2P lifecycle test supplier",
      countryCode: "ES",
    });
    const saved = await localSupplierP2PAdapter.saveSetup(supplier.id, { organizationId }, {
      expectedVersion: 0,
      contacts: [{
        id: "contact-to-remove",
        name: "Purchasing contact",
        email: null,
        phone: null,
        role: "purchasing",
        isPrimary: true,
      }],
      addresses: [{
        id: "address-to-remove",
        label: "Order address",
        purpose: "order",
        countryCode: "ES",
        region: null,
        locality: "Madrid",
        postalCode: null,
        addressLines: ["Calle de Prueba 2"],
        isPrimary: true,
      }],
      purchaseDefaults: {
        currency: null,
        paymentTermCode: null,
        deliveryTermCode: null,
        deliveryAddressId: "address-to-remove",
        financeReference: null,
      },
    });

    await expect(localSupplierP2PAdapter.saveSetup(supplier.id, { organizationId }, {
      expectedVersion: saved.version,
      contacts: [{ ...saved.contacts[0], expectedVersion: 0 }],
      addresses: [{ ...saved.addresses[0], expectedVersion: saved.addresses[0].version }],
      purchaseDefaults: saved.purchaseDefaults,
    })).rejects.toMatchObject({ code: "conflict" });

    const removed = await localSupplierP2PAdapter.saveSetup(supplier.id, { organizationId }, {
      expectedVersion: saved.version,
      contacts: [],
      addresses: [],
      purchaseDefaults: {
        ...saved.purchaseDefaults,
        deliveryAddressId: null,
      },
    });

    expect(removed.contacts).toEqual([]);
    expect(removed.addresses).toEqual([]);
    expect(localSupplierP2PStore.list().find((record) => record.supplierId === supplier.id))
      .toEqual(expect.objectContaining({
        contacts: [expect.objectContaining({ id: "contact-to-remove", status: "inactive", version: 2 })],
        addresses: [expect.objectContaining({ id: "address-to-remove", status: "inactive", version: 2 })],
      }));
  });

  it("rejects invalid defaults and never stores payee details in local demo mode", async () => {
    expect(supplierP2PValidationError({
      expectedVersion: 0,
      contacts: [],
      addresses: [],
      purchaseDefaults: {
        currency: null,
        paymentTermCode: null,
        deliveryTermCode: null,
        deliveryAddressId: "missing-address",
        financeReference: null,
      },
    })).toContain("Default delivery address");

    await expect(localSupplierP2PAdapter.createPayeeInstruction("supplier_iberica", { organizationId }, {
      beneficiaryName: "Synthetic beneficiary",
      bankCountryCode: "ES",
      bankName: null,
      accountIdentifier: "SYNTHETIC-ACCOUNT-123",
      currency: "EUR",
    })).rejects.toMatchObject({ code: "secure-storage-required" });
    expect(JSON.stringify(localSupplierP2PStore.list())).not.toContain("SYNTHETIC-ACCOUNT-123");
  });
});
