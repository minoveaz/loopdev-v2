import type { DocumentType, DocumentIntelligenceSourceSuite } from "./adapter/types";

export const TEMPORARY_DOCUMENT_RETENTION_DAYS = 30;
export const DEFAULT_PERSISTED_DOCUMENT_RETENTION_DAYS = 365;

export type DocumentLifecycleState =
  | "temporary"
  | "processing"
  | "review"
  | "approved"
  | "linked"
  | "rejected"
  | "failed"
  | "expired"
  | "archived"
  | "deleted";

export type DocumentLifecycleEvent =
  | "document.received"
  | "document.extraction.started"
  | "document.extraction.completed"
  | "document.extraction.failed"
  | "document.approved"
  | "document.linked"
  | "document.promoted"
  | "document.expired"
  | "document.archived"
  | "document.deleted";

export interface DocumentRetentionPolicy {
  organizationId: string;
  documentType: DocumentType;
  retentionDays: number;
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface DocumentRetentionSettings {
  organizationId: string;
  defaultRetentionDays: number;
  policies: DocumentRetentionPolicy[];
  temporaryRetentionDays: typeof TEMPORARY_DOCUMENT_RETENTION_DAYS;
}

export interface DocumentAssociation {
  organizationId: string;
  entityType: "contact";
  entityId: string;
  entityLabel?: string | null;
}

export interface DocumentLifecycleRecord {
  documentId: string;
  organizationId: string;
  state: DocumentLifecycleState;
  sourceSuite: DocumentIntelligenceSourceSuite;
  extractionId?: string | null;
  platformFileId?: string | null;
  association?: DocumentAssociation | null;
  retentionDays: number;
  expiresAt: string;
  version: number;
  concurrencyToken: string;
}

export interface LinkDocumentInput {
  documentId: string;
  extractionId: string;
  association: DocumentAssociation;
  idempotencyKey: string;
  expectedVersion: number;
}

export interface PromoteDocumentInput {
  documentId: string;
  extractionId: string;
  association: DocumentAssociation;
  idempotencyKey: string;
  expectedVersion: number;
}

export interface DocumentLifecycleMutationResult {
  documentId: string;
  state: DocumentLifecycleState;
  platformFileId?: string | null;
  association?: DocumentAssociation | null;
  expiresAt: string;
  version: number;
}

export interface DocumentLifecyclePort {
  getRetentionSettings(organizationId: string): Promise<DocumentRetentionSettings>;
  updateRetentionPolicy(policy: DocumentRetentionPolicy): Promise<DocumentRetentionPolicy>;
  linkDocument(input: LinkDocumentInput): Promise<DocumentLifecycleMutationResult>;
  promoteDocument(input: PromoteDocumentInput): Promise<DocumentLifecycleMutationResult>;
}

const transitions: Record<DocumentLifecycleState, readonly DocumentLifecycleState[]> = {
  temporary: ["processing", "expired", "deleted"],
  processing: ["review", "failed"],
  review: ["approved", "linked", "rejected", "failed", "expired"],
  approved: ["linked", "archived", "expired"],
  linked: ["archived", "deleted"],
  rejected: ["deleted"],
  failed: ["processing", "deleted"],
  expired: ["deleted"],
  archived: ["deleted"],
  deleted: [],
};

export function canTransitionDocument(
  from: DocumentLifecycleState,
  to: DocumentLifecycleState,
): boolean {
  return transitions[from].includes(to);
}

export function assertDocumentTransition(
  from: DocumentLifecycleState,
  to: DocumentLifecycleState,
): void {
  if (!canTransitionDocument(from, to)) {
    throw new Error(`Invalid document lifecycle transition: ${from} -> ${to}`);
  }
}

export function getDocumentRetentionDays(
  settings: DocumentRetentionSettings,
  documentType: DocumentType,
): number {
  const policy = settings.policies.find((item) => item.documentType === documentType);
  return policy?.retentionDays ?? settings.defaultRetentionDays;
}

export function getDocumentExpiry(
  createdAt: string,
  retentionDays: number,
): string {
  if (!Number.isInteger(retentionDays) || retentionDays < 1) {
    throw new Error("Document retention must be a positive number of days.");
  }

  const createdAtMs = Date.parse(createdAt);
  if (Number.isNaN(createdAtMs)) {
    throw new Error("Document createdAt must be a valid ISO date.");
  }

  return new Date(createdAtMs + retentionDays * 24 * 60 * 60 * 1000).toISOString();
}
