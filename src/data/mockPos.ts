import type { PosTransaction } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const PAYMENTS: PosTransaction["payment"][] = ["cash", "card", "wallet", "voucher"];
const STATUSES: PosTransaction["status"][] = ["completed", "completed", "completed", "voided", "refunded", "pending"];
const CASHIERS = ["Mia Chen", "Lukas Vogt", "Priya Kapoor", "Diego Salas", "Hana Park"];

export const mockPosTransactions: PosTransaction[] = Array.from({ length: 28 }).map((_, i) => {
  const subtotal = 12 + ((i * 17) % 240);
  const tax = +(subtotal * 0.08).toFixed(2);
  return {
    id: `pos_${i + 1}`,
    reference: `POS-${(2400 + i).toString().padStart(4, "0")}`,
    cashier: CASHIERS[i % CASHIERS.length],
    registerId: `R-${(i % 4) + 1}`,
    items: 1 + (i % 6),
    subtotal,
    tax,
    total: +(subtotal + tax).toFixed(2),
    currency: "USD",
    payment: PAYMENTS[i % PAYMENTS.length],
    status: STATUSES[i % STATUSES.length],
    createdAt: ago(i / 4),
    updatedAt: ago(i / 4),
  };
});

export const posStore = createLocalStore<PosTransaction>({
  key: "data:pos",
  seed: mockPosTransactions,
  idPrefix: "pos",
});