import {
  DEFAULT_ASSOCIATED_RETENTION_DAYS,
  DocumentLifecycleError,
  type AssociateDocumentCommand,
  type DocumentLifecycleEventPayload,
} from "./lifecycle-contracts";
import { assertDocumentTransition, getDocumentExpiry, type DocumentLifecycleState } from "./lifecycle";

export interface LocalLifecycleDocument {
  documentId: string;
  organizationId: string;
  extractionId: string;
  state: DocumentLifecycleState;
  contactId: string | null;
  platformFileId: string | null;
  retentionDays: number;
  expiresAt: string;
  version: number;
}

export interface LocalLifecycleResult {
  document: LocalLifecycleDocument;
  event: DocumentLifecycleEventPayload;
  replayed: boolean;
}

/** Deterministic local-first store used by offline queues and component tests. */
export class LocalDocumentLifecycleStore {
  private readonly documents = new Map<string, LocalLifecycleDocument>();
  private readonly idempotency = new Map<string, LocalLifecycleResult>();

  seed(document: LocalLifecycleDocument): void {
    this.documents.set(document.documentId, { ...document });
  }

  associate(command: AssociateDocumentCommand): LocalLifecycleResult {
    const replay = this.idempotency.get(command.idempotencyKey);
    if (replay) return { ...replay, replayed: true };
    const current = this.documents.get(command.documentId);
    if (!current || current.organizationId !== command.organizationId) {
      throw new DocumentLifecycleError("NOT_FOUND", "Document not found in organization.");
    }
    if (current.version !== command.expectedVersion) {
      throw new DocumentLifecycleError("CONFLICT", "Document was changed by another actor.", true);
    }
    if (current.contactId && current.contactId !== command.contactId) {
      throw new DocumentLifecycleError("CONFLICT", "Document is already associated with another contact.");
    }
    assertDocumentTransition(current.state, "linked");
    const now = new Date().toISOString();
    const next = {
      ...current,
      state: "linked" as const,
      contactId: command.contactId,
      retentionDays: current.retentionDays || DEFAULT_ASSOCIATED_RETENTION_DAYS,
      expiresAt: getDocumentExpiry(now, current.retentionDays || DEFAULT_ASSOCIATED_RETENTION_DAYS),
      version: current.version + 1,
    };
    const event: DocumentLifecycleEventPayload = {
      eventId: crypto.randomUUID(),
      eventType: "document.linked",
      organizationId: command.organizationId,
      documentId: command.documentId,
      extractionId: command.extractionId,
      contactId: command.contactId,
      occurredAt: now,
      actorId: command.actorId,
      idempotencyKey: command.idempotencyKey,
    };
    const result = { document: next, event, replayed: false };
    this.documents.set(next.documentId, next);
    this.idempotency.set(command.idempotencyKey, result);
    return result;
  }
}
