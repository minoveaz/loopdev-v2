import { createLocalStore } from "@/lib/localStore";
import type {
  SupplierAddress,
  SupplierContactSummary,
  SupplierPurchaseDefaults,
} from "../../../../../packages/contracts/src/suppliers";

export interface LocalSupplierP2PRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  version: number;
  contacts: SupplierContactSummary[];
  addresses: SupplierAddress[];
  purchaseDefaults: SupplierPurchaseDefaults;
  createdAt: string;
  updatedAt: string;
}

export const localSupplierP2PStore = createLocalStore<LocalSupplierP2PRecord>({
  key: "loopdev:erp:supplier-p2p",
  idPrefix: "supplier-p2p",
  seed: [],
});
