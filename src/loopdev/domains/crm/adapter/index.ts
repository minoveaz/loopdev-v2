import { localLoopdevAdapter } from "./local";
import type { ReferenceDataAdapter } from "@/loopdev/domains/reference-data";
import type { CatalogAdapter } from "@/loopdev/domains/catalog";
import type { PlatformAdapter } from "@/loopdev/domains/platform";
import type {
  Customer360View,
  CRMContactListParams,
  CRMContactMutationResult,
  CRMContactPage,
  CRMCreateContactInput,
  CRMCreateLeadInput,
  CRMLead,
  CRMLeadMutationResult,
  CRMUpdateLeadInput,
  CRMCreateOpportunityFromLeadInput,
  CRMCreateOpportunityInput,
  CRMOpportunityListParams,
  CRMOpportunityMutationResult,
  CRMMoveOpportunityStageInput,
  CRMUpdateOpportunityInput,
  CRMReopenOpportunityInput,
  CRMOpportunityStageHistory,
  CRMStageDefinition,
  CRMPipelineOpportunity,
  CRMPipelineStageCode,
  CRMUpdateContactPatch,
} from "./types";
import type { CRMOperationsAdapter } from "../operations/types";
import type { CRMAutomationsAdapter } from "../automations";

export interface LoopdevCrmAdapter {
  operations: CRMOperationsAdapter;
  automations: CRMAutomationsAdapter;
  listContacts(params: CRMContactListParams): Promise<CRMContactPage>;
  createContact(input: CRMCreateContactInput): Promise<CRMContactMutationResult>;
  updateContact(
    contactId: string,
    patch: CRMUpdateContactPatch,
    expectedUpdatedAt: string,
  ): Promise<CRMContactMutationResult>;
  archiveContact(contactId: string, expectedUpdatedAt: string): Promise<CRMContactMutationResult>;
  listLeads(): Promise<CRMLead[]>;
  createLead(input: CRMCreateLeadInput): Promise<CRMLeadMutationResult>;
  updateLead(leadId: string, input: CRMUpdateLeadInput): Promise<CRMLeadMutationResult>;
  listOpportunities(params: CRMOpportunityListParams): Promise<CRMPipelineOpportunity[]>;
  moveOpportunityStage(opportunityId: string, input: CRMMoveOpportunityStageInput): Promise<CRMOpportunityMutationResult>;
  moveOpportunityStage(
    opportunityId: string,
    stageCode: CRMPipelineStageCode,
    expectedUpdatedAt: string,
  ): Promise<CRMOpportunityMutationResult>;
  updateOpportunity(
    opportunityId: string,
    input: CRMUpdateOpportunityInput,
  ): Promise<CRMOpportunityMutationResult>;
  createOpportunityFromLead(
    leadId: string,
    input: CRMCreateOpportunityFromLeadInput,
  ): Promise<CRMOpportunityMutationResult>;
  createOpportunity(input: CRMCreateOpportunityInput): Promise<CRMOpportunityMutationResult>;
  reopenOpportunity(opportunityId: string, input: CRMReopenOpportunityInput): Promise<CRMOpportunityMutationResult>;
  listPipelineStages(): Promise<CRMStageDefinition[]>;
  listOpportunityStageHistory(opportunityId: string): Promise<CRMOpportunityStageHistory[]>;
  getCustomer360(contactId: string): Promise<Customer360View | null>;
}

export interface LoopdevAdapter {
  platform: PlatformAdapter;
  catalog: CatalogAdapter;
  crm: LoopdevCrmAdapter;
  referenceData: ReferenceDataAdapter;
}

// The adapter boundary is global to Loopdev; CRM is the first connected domain.
export const loopdevAdapter: LoopdevAdapter = localLoopdevAdapter;

export * from "./types";
export * from "../operations/types";
