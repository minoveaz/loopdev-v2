import { localLoopdevAdapter } from "./local";
import type { ReferenceDataAdapter } from "@/loopdev/domains/reference-data";
import type {
  Customer360View,
  CRMContactListParams,
  CRMContactMutationResult,
  CRMContactPage,
  CRMCreateContactInput,
  CRMLead,
  CRMUpdateContactPatch,
} from "./types";

export interface LoopdevCrmAdapter {
  listContacts(params: CRMContactListParams): Promise<CRMContactPage>;
  createContact(input: CRMCreateContactInput): Promise<CRMContactMutationResult>;
  updateContact(
    contactId: string,
    patch: CRMUpdateContactPatch,
    expectedUpdatedAt: string,
  ): Promise<CRMContactMutationResult>;
  archiveContact(contactId: string, expectedUpdatedAt: string): Promise<CRMContactMutationResult>;
  listLeads(): Promise<CRMLead[]>;
  getCustomer360(contactId: string): Promise<Customer360View | null>;
}

export interface LoopdevAdapter {
  crm: LoopdevCrmAdapter;
  referenceData: ReferenceDataAdapter;
}

// The adapter boundary is global to Loopdev; CRM is the first connected domain.
export const loopdevAdapter: LoopdevAdapter = localLoopdevAdapter;

export * from "./types";
