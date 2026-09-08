import { localLoopdevAdapter } from "./local";
import type { Customer360View, CRMContact } from "./types";

export interface LoopdevCrmAdapter {
  listContacts(): Promise<CRMContact[]>;
  getCustomer360(contactId: string): Promise<Customer360View | null>;
}

export interface LoopdevAdapter {
  crm: LoopdevCrmAdapter;
}

// The adapter boundary is global to Loopdev; CRM is the first connected domain.
export const loopdevAdapter: LoopdevAdapter = localLoopdevAdapter;

export * from "./types";
