import { localLoopdevAdapter } from "./local";
import { desktopContactAdapter } from "./contact";
import { supabaseCrmAdapter } from "./supabase-crm";
import { supabaseCommunicationsAdapter } from "@/loopdev/domains/communications/adapter/supabase";
import type { ContactPort } from "../../../../../packages/contracts/src/contact-port";
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
  CRMCustomerProduct,
  CRMCreateCustomerProductInput,
  CRMPotentialDuplicate,
  CRMDuplicateReviewResult,
} from "./types";
import type { CRMOperationsAdapter } from "../operations/types";
import type { CRMAutomationsAdapter } from "../automations";
import type { CommunicationsAdapter } from "@/loopdev/domains/communications";
import type { GlobalNotesAdapter } from "@/loopdev/domains/notes";

const isTestRuntime = Boolean(
  (typeof process !== "undefined" && (process.env?.VITEST || process.env?.NODE_ENV === "test"))
  || (typeof import.meta !== "undefined" && ((import.meta as any).env?.VITEST || (import.meta as any).env?.MODE === "test")),
);

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
  listLeads(organizationId?: string): Promise<CRMLead[]>;
  createLead(input: CRMCreateLeadInput): Promise<CRMLeadMutationResult>;
  updateLead(leadId: string, input: CRMUpdateLeadInput): Promise<CRMLeadMutationResult>;
  archiveLead(leadId: string, organizationId: string, expectedUpdatedAt?: string): Promise<CRMLeadMutationResult>;
  bulkArchiveLeads?(leadIds: string[], organizationId: string): Promise<{ successCount: number; failureCount: number }>;
  listOpportunities(params: CRMOpportunityListParams): Promise<CRMPipelineOpportunity[]>;
  bulkArchiveOpportunities?(opportunityIds: string[], organizationId: string): Promise<{ successCount: number; failureCount: number }>;
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
  findPotentialDuplicates(contactId: string): Promise<CRMPotentialDuplicate[]>;
  dismissDuplicateReview(contactId: string, candidateId: string, confirmation: string): Promise<CRMDuplicateReviewResult>;
  listCustomerProducts(contactId: string): Promise<CRMCustomerProduct[]>;
  createCustomerProduct(input: CRMCreateCustomerProductInput): Promise<CRMCustomerProduct>;
  bulkArchiveContacts?(contactIds: string[]): Promise<{ successCount: number; failureCount: number }>;
}

export interface LoopdevAdapter {
  platform: PlatformAdapter;
  catalog: CatalogAdapter;
  crm: LoopdevCrmAdapter;
  communications: CommunicationsAdapter;
  notes: GlobalNotesAdapter;
  referenceData: ReferenceDataAdapter;
}

// The adapter boundary is global to Loopdev; CRM connects contacts to desktopContactAdapter (Supabase with local fallback)
export const loopdevAdapter: LoopdevAdapter = {
  ...localLoopdevAdapter,
  communications: isTestRuntime ? localLoopdevAdapter.communications : supabaseCommunicationsAdapter,
  crm: {
    ...localLoopdevAdapter.crm,
    listContacts: (params) => desktopContactAdapter.listContacts(params),
    createContact: (input) => desktopContactAdapter.createContact(input),
    updateContact: (contactId, patch, expectedUpdatedAt) =>
      desktopContactAdapter.updateContact(contactId, patch, expectedUpdatedAt),
    archiveContact: (contactId, expectedUpdatedAt) =>
      desktopContactAdapter.archiveContact(contactId, expectedUpdatedAt),
    getCustomer360: (contactId) => isTestRuntime
      ? localLoopdevAdapter.crm.getCustomer360(contactId)
      : desktopContactAdapter.getCustomer360(contactId) as unknown as Promise<Customer360View | null>,
    findPotentialDuplicates: (contactId) => desktopContactAdapter.findPotentialDuplicates(contactId),
    dismissDuplicateReview: (contactId, candidateId, confirmation) =>
      desktopContactAdapter.dismissDuplicateReview(contactId, candidateId, confirmation),
    bulkArchiveContacts: (contactIds) => desktopContactAdapter.bulkArchiveContacts?.(contactIds) ?? Promise.resolve({ successCount: 0, failureCount: contactIds.length }),
    listLeads: (organizationId) => isTestRuntime ? localLoopdevAdapter.crm.listLeads() : supabaseCrmAdapter.listLeads(organizationId),
    createLead: (input) => isTestRuntime ? localLoopdevAdapter.crm.createLead(input) : supabaseCrmAdapter.createLead(input),
    updateLead: (leadId, input) => isTestRuntime ? localLoopdevAdapter.crm.updateLead(leadId, input) : supabaseCrmAdapter.updateLead(leadId, input),
    archiveLead: (leadId, organizationId, expectedUpdatedAt) => supabaseCrmAdapter.archiveLead(leadId, organizationId, expectedUpdatedAt),
    bulkArchiveLeads: (leadIds, organizationId) => supabaseCrmAdapter.bulkArchiveLeads(leadIds, organizationId),
    listOpportunities: (params) => isTestRuntime ? localLoopdevAdapter.crm.listOpportunities(params) : supabaseCrmAdapter.listOpportunities(params),
    bulkArchiveOpportunities: (opportunityIds, organizationId) => isTestRuntime ? localLoopdevAdapter.crm.bulkArchiveOpportunities?.(opportunityIds, organizationId) ?? Promise.resolve({ successCount: 0, failureCount: opportunityIds.length }) : supabaseCrmAdapter.bulkArchiveOpportunities(opportunityIds, organizationId),
    createOpportunity: (input) => isTestRuntime ? localLoopdevAdapter.crm.createOpportunity(input) : supabaseCrmAdapter.createOpportunity(input),
    updateOpportunity: (opportunityId, input) => isTestRuntime ? localLoopdevAdapter.crm.updateOpportunity(opportunityId, input) : supabaseCrmAdapter.updateOpportunity(opportunityId, input),
    moveOpportunityStage: (opportunityId, input) => isTestRuntime ? localLoopdevAdapter.crm.moveOpportunityStage(opportunityId, input as CRMMoveOpportunityStageInput) : supabaseCrmAdapter.moveOpportunityStage(opportunityId, input as CRMMoveOpportunityStageInput),
    reopenOpportunity: (opportunityId, input) => isTestRuntime ? localLoopdevAdapter.crm.reopenOpportunity(opportunityId, input) : supabaseCrmAdapter.reopenOpportunity(opportunityId, input),
    createOpportunityFromLead: (leadId, input) => isTestRuntime ? localLoopdevAdapter.crm.createOpportunityFromLead(leadId, input) : supabaseCrmAdapter.createOpportunityFromLead(leadId, input),
    listOpportunityStageHistory: (opportunityId) => isTestRuntime ? localLoopdevAdapter.crm.listOpportunityStageHistory(opportunityId) : supabaseCrmAdapter.listOpportunityStageHistory(opportunityId),
  },
};
export const contactPort: ContactPort = desktopContactAdapter;
export { desktopContactAdapter } from "./contact";
export type { ContactPort } from "../../../../../packages/contracts/src/contact-port";

export * from "./types";
export * from "../operations/types";
