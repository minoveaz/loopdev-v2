import { createLocalStore } from "@/lib/localStore";
import type { SupplierRecord } from "../types";

const localOrganizationId = "local-development-organization";
const now = "2026-10-25T00:00:00.000Z";

export const localSuppliersStore = createLocalStore<SupplierRecord>({
  key: "loopdev:erp:suppliers",
  idPrefix: "supplier",
  seed: [
    {
      id: "supplier_iberica",
      organizationId: localOrganizationId,
      kind: "organization",
      legalName: "Suministros Ibéricos Demo",
      countryCode: "ES",
      status: "active",
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "supplier_northstar",
      organizationId: localOrganizationId,
      kind: "organization",
      legalName: "Northstar Components Demo",
      countryCode: "US",
      status: "on_hold",
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  ],
});
