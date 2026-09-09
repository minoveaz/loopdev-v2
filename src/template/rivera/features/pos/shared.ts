import { storage } from "@/lib/storage";
import type { StatusTone } from "@/components/common";
import { getStatusVariant } from "@/lib/formatters";

export interface PosSettings {
  storeName: string;
  storeAddress: string;
  taxRate: number;     // percent (e.g. 8 = 8%)
  currency: "USD" | "EUR" | "GBP";
  receiptFooter: string;
  registerId: string;
  cashier: string;
}

const SETTINGS_KEY = "pos:settings";

const DEFAULTS: PosSettings = {
  storeName: "Rivera Flagship Store",
  storeAddress: "221B Market Street, San Francisco, CA",
  taxRate: 8,
  currency: "USD",
  receiptFooter: "Thanks for shopping with Rivera. Returns within 30 days.",
  registerId: "R-1",
  cashier: "Mia Chen",
};

export function getPosSettings(): PosSettings {
  return { ...DEFAULTS, ...storage.get<Partial<PosSettings>>(SETTINGS_KEY, {}) };
}

export function setPosSettings(settings: PosSettings): void {
  storage.set(SETTINGS_KEY, settings);
}

/** Loyalty: 1 point per whole currency unit spent. */
export function loyaltyPointsFor(amount: number): number {
  return Math.floor(amount);
}

export const LOW_STOCK_THRESHOLD = 50;

export function statusTone(status: string): StatusTone {
  const v = getStatusVariant(status);
  return v === "danger" ? "destructive" : (v as StatusTone);
}