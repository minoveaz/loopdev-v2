import type { DocumentType, DocumentIntelligenceSourceSuite } from "./adapter/types";

export const DOCUMENT_LIFECYCLE_API_VERSION = "2026-09-26";
export const TEMPORARY_RETENTION_DAYS = 30;
export const DEFAULT_ASSOCIATED_RETENTION_DAYS = 365;

export type DocumentLifecycleErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "IDEMPOTENCY_REPLAY"
  | "INVALID_RETENTION"
  | "PROMOTION_INCOMPLETE"
  | "STORAGE_RECONCILIATION_REQUIRED";

export class DocumentLifecycleError extends Error {
  constructor(
    public readonly code: DocumentLifecycleErrorCode,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "DocumentLifecycleError";
  }
}

export interface DocumentLifecycleEventPayload {
  eventId: string;
  eventType:
    | "document.received"
    | "document.extraction.started"
    | "document.extraction.completed"
    | "document.extraction.failed"
    | "document.linked"
    | "document.promoted"
    | "document.expired"
    | "document.deleted";
  organizationId: string;
  documentId: string;
  extractionId?: string | null;
  contactId?: string | null;
  platformFileId?: string | null;
  occurredAt: string;
  actorId?: string | null;
  idempotencyKey: string;
}

export interface AssociateDocumentCommand {
  organizationId: string;
  documentId: string;
  extractionId: string;
  contactId: string;
  idempotencyKey: string;
  expectedVersion: number;
  actorId?: string;
}

export interface PromoteDocumentCommand extends AssociateDocumentCommand {
  sourceSuite: DocumentIntelligenceSourceSuite;
  documentType: DocumentType;
  fileName: string;
  mediaType: string;
  size: number;
  tempStoragePath: string;
}

export function validateRetentionDays(days: number): void {
  if (!Number.isInteger(days) || days < 1 || days > 3650) {
    throw new DocumentLifecycleError(
      "INVALID_RETENTION",
      "Retention must be an integer between 1 and 3650 days.",
    );
  }
}

export function lifecycleIdempotencyKey(scope: string, key: string): string {
  return `${scope}:${key.trim()}`;
}
