import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import {
  DocumentLifecycleError,
  type PromoteDocumentCommand,
} from "./lifecycle-contracts";
import { getDocumentExpiry } from "./lifecycle";

const client = defaultWebAuthAdapter.getClient();

/**
 * Remote promotion keeps Files authoritative: the temporary object is copied
 * first, metadata is inserted second, and the temporary object is deleted
 * only after both database writes succeed. Replays are returned by key.
 */
export async function promoteDocumentToPlatformFile(command: PromoteDocumentCommand) {
  if (!client) throw new DocumentLifecycleError("UNAUTHORIZED", "Shared Supabase client unavailable.");
  const existing = await client
    .from("document_intelligence_associations")
    .select("platform_file_id, document_id")
    .eq("organization_id", command.organizationId)
    .eq("idempotency_key", command.idempotencyKey)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return { platformFileId: existing.data.platform_file_id, replayed: true };

  const { data: document, error: documentError } = await client
    .from("document_intelligence_documents")
    .select("id, version, retention_days, document_type, associated_contact_id")
    .eq("id", command.documentId)
    .eq("organization_id", command.organizationId)
    .maybeSingle();
  if (documentError) throw documentError;
  if (!document) throw new DocumentLifecycleError("NOT_FOUND", "Document not found.");
  if (document.version !== command.expectedVersion) {
    throw new DocumentLifecycleError("CONFLICT", "Document changed while it was being promoted.", true);
  }
  if (document.associated_contact_id && document.associated_contact_id !== command.contactId) {
    throw new DocumentLifecycleError("CONFLICT", "Document is already associated with another contact.");
  }
  const existingAssociation = await client
    .from("document_intelligence_associations")
    .select("platform_file_id")
    .eq("organization_id", command.organizationId)
    .eq("document_id", command.documentId)
    .maybeSingle();
  if (existingAssociation.error) throw existingAssociation.error;
  if (existingAssociation.data) {
    return { platformFileId: existingAssociation.data.platform_file_id, replayed: true };
  }

  const download = await client.storage.from("document-intelligence-temp").download(command.tempStoragePath);
  if (download.error || !download.data) {
    throw new DocumentLifecycleError("PROMOTION_INCOMPLETE", download.error?.message ?? "Temporary object unavailable.", true);
  }
  const permanentPath = `organizations/${command.organizationId}/contacts/${command.contactId}/documents/${command.documentId}/${command.fileName}`;
  const upload = await client.storage.from("platform-files").upload(permanentPath, download.data, {
    contentType: command.mediaType,
    upsert: false,
  });
  if (upload.error && !upload.error.message.toLowerCase().includes("already exists")) {
    throw new DocumentLifecycleError("PROMOTION_INCOMPLETE", upload.error.message, true);
  }

  const fileId = crypto.randomUUID();
  const file = await client.from("platform_files").insert({
    id: fileId,
    organization_id: command.organizationId,
    name: command.fileName,
    category: "document",
    source: "document_intelligence",
    media_type: command.mediaType,
    size: command.size,
    relation_type: "contact",
    relation_id: command.contactId,
    storage_path: permanentPath,
  }).select("id").single();
  if (file.error) throw new DocumentLifecycleError("PROMOTION_INCOMPLETE", file.error.message, true);

  const policy = await client
    .from("document_intelligence_retention_policies")
    .select("retention_days")
    .eq("organization_id", command.organizationId)
    .eq("document_type", document.document_type)
    .maybeSingle();
  if (policy.error) throw new DocumentLifecycleError("PROMOTION_INCOMPLETE", policy.error.message, true);
  const retentionDays = policy.data?.retention_days ?? document.retention_days ?? 365;
  const expiresAt = getDocumentExpiry(new Date().toISOString(), retentionDays);
  const association = await client.from("document_intelligence_associations").insert({
    organization_id: command.organizationId,
    document_id: command.documentId,
    extraction_id: command.extractionId,
    contact_id: command.contactId,
    platform_file_id: file.data.id,
    idempotency_key: command.idempotencyKey,
    created_by: command.actorId ?? null,
  });
  if (association.error && association.error.code !== "23505") {
    throw new DocumentLifecycleError("PROMOTION_INCOMPLETE", association.error.message, true);
  }
  if (association.error?.code === "23505") {
    const replay = await client
      .from("document_intelligence_associations")
      .select("platform_file_id")
      .eq("organization_id", command.organizationId)
      .eq("document_id", command.documentId)
      .single();
    if (replay.error) throw new DocumentLifecycleError("PROMOTION_INCOMPLETE", replay.error.message, true);
    return { platformFileId: replay.data.platform_file_id, replayed: true };
  }
  const update = await client.from("document_intelligence_documents").update({
    status: "linked",
    associated_contact_id: command.contactId,
    platform_file_id: file.data.id,
    retention_class: "associated",
    retention_days: retentionDays,
    expires_at: expiresAt,
    version: document.version + 1,
  }).eq("id", command.documentId).eq("organization_id", command.organizationId).eq("version", document.version);
  if (update.error) throw new DocumentLifecycleError("PROMOTION_INCOMPLETE", update.error.message, true);
  const cleanup = await client.storage.from("document-intelligence-temp").remove([command.tempStoragePath]);
  if (cleanup.error) {
    throw new DocumentLifecycleError("PROMOTION_INCOMPLETE", cleanup.error.message, true);
  }
  return { platformFileId: file.data.id, permanentPath, replayed: false };
}
