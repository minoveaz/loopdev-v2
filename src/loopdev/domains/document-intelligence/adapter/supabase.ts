import type { DocumentIntelligenceAdapter } from "./index";
import type { ExtractionListParams, ExtractionMutationResult, ExtractionPage, ExtractionRecord, ExtractionMetrics, StartExtractionInput, ConfirmExtractionInput, RejectExtractionInput } from "./types";
import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import { TEMPORARY_DOCUMENT_RETENTION_DAYS, getDocumentExpiry } from "../lifecycle";
import type { IdentityDocumentFields, ReopenExtractionInput } from "./types";

const client = defaultWebAuthAdapter.getClient();
if (!client) {
  throw new Error("Document Intelligence requires the shared Supabase client.");
}

function mapExtraction(row: any): ExtractionRecord {
  const fields = row.fields ?? {};
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: fields.title ?? "Document extraction",
    documentType: fields.documentType ?? "unknown",
    status: row.status === "approved" ? "completed" : row.status === "queued" ? "processing" : row.status,
    sourceSuite: fields.sourceSuite ?? "standalone",
    sourceReferenceId: fields.sourceReferenceId ?? null,
    files: fields.files ?? { front: null, back: null },
    fields: fields.identity ?? fields,
    initialFields: fields.initialIdentity ?? fields.identity ?? fields,
    fieldConfidence: fields.fieldConfidence ?? {},
    overallConfidence: fields.overallConfidence == null || Number(fields.overallConfidence) === 0
      ? calculateModelConfidence(fields.fieldConfidence, fields.identity ?? fields)
      : Number(fields.overallConfidence),
    validatedAccuracy: fields.validatedAccuracy == null ? null : Number(fields.validatedAccuracy),
    provider: row.provider ?? null,
    model: row.provider_version ?? null,
    usage: fields.usage ?? null,
    extractedAt: row.completed_at ?? row.created_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lifecycle: row.lifecycle ?? null,
  };
}

function calculateFieldCoverage(fields: Partial<IdentityDocumentFields> | undefined): number {
  const values = Object.values(fields ?? {});
  if (!values.length) return 0;
  const populated = values.filter((value) => typeof value === "string" && value.trim().length > 0);
  return populated.length / values.length;
}

function calculateModelConfidence(
  fieldConfidence: Record<string, number> | undefined,
  fields?: Partial<IdentityDocumentFields>,
): number {
  const values = Object.values(fieldConfidence ?? {}).filter((value) => Number.isFinite(value));
  if (!values.length) return calculateFieldCoverage(fields);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateValidatedAccuracy(
  originalFields: Record<string, string | null>,
  reviewedFields: Record<string, string | null>,
): number | null {
  const extractedKeys = Object.keys(originalFields).filter((key) => {
    const value = originalFields[key];
    return typeof value === "string" && value.trim().length > 0;
  });
  if (!extractedKeys.length) return null;
  const unchanged = extractedKeys.filter((key) => (originalFields[key] ?? "").trim() === (reviewedFields[key] ?? "").trim());
  return unchanged.length / extractedKeys.length;
}

function documentTitle(
  documentType: string | null | undefined,
  fullName: string | null | undefined,
  fallback: string,
): string {
  const name = fullName?.trim();
  if (!name) return fallback;
  const typeLabel: Record<string, string> = {
    "spanish-dni": "DNI",
    "spanish-nie": "NIE",
    passport: "Pasaporte",
    "driver-license": "Licencia de conducir",
    "foreign-id": "Documento de identidad",
    unknown: "Documento",
  };
  return `${typeLabel[documentType ?? "unknown"] ?? "Documento"} - ${name}`;
}

async function hydrateExtractionFileUrl(record: ExtractionRecord, row: any): Promise<ExtractionRecord> {
  const frontFile = record.files.front;
  if (!frontFile) return record;

  let bucket = "document-intelligence-temp";
  let storagePath = typeof frontFile.url === "string" ? frontFile.url : null;

  if (row.document_version_id) {
    const { data: version, error: versionError } = await client
      .from("document_intelligence_versions")
      .select("document_id")
      .eq("id", row.document_version_id)
      .eq("organization_id", row.organization_id)
      .maybeSingle();
    if (versionError) throw versionError;

    if (version?.document_id) {
      const { data: document, error: documentError } = await client
        .from("document_intelligence_documents")
        .select("platform_file_id, temporary_storage_path")
        .eq("id", version.document_id)
        .eq("organization_id", row.organization_id)
        .maybeSingle();
      if (documentError) throw documentError;

      if (document?.platform_file_id) {
        const { data: platformFile, error: platformFileError } = await client
          .from("platform_files")
          .select("storage_path")
          .eq("id", document.platform_file_id)
          .eq("organization_id", row.organization_id)
          .maybeSingle();
        if (platformFileError) throw platformFileError;
        if (platformFile?.storage_path) {
          bucket = "platform-files";
          storagePath = platformFile.storage_path;
        }
      }
      if (bucket === "document-intelligence-temp" && document?.temporary_storage_path) {
        storagePath = document.temporary_storage_path;
      }
    }
  }

  if (!storagePath) return record;

  const { data: signedUrl, error: signedUrlError } = await client.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60 * 60);
  if (signedUrlError) return record;

  return {
    ...record,
    files: {
      ...record.files,
      front: {
        ...frontFile,
        previewUrl: signedUrl.signedUrl,
      },
    },
  };
}

function fileFromInput(input: StartExtractionInput): File | null {
  if (typeof File !== "undefined" && input.frontFile instanceof File) return input.frontFile;
  return "file" in input.frontFile ? input.frontFile.file ?? null : null;
}

function extensionFor(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "jpeg" || extension === "jpg" || extension === "png" || extension === "pdf") return extension;
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  return "jpg";
}

export const supabaseDocumentIntelligenceAdapter: DocumentIntelligenceAdapter = {
  async listExtractions(params: ExtractionListParams): Promise<ExtractionPage> {
    let query = client.from("document_intelligence_extractions").select("*").eq("organization_id", params.organizationId).order("created_at", { ascending: params.sortDirection === "asc" });
    if (params.status?.length) query = query.in("status", params.status.map((status) => status === "completed" ? "approved" : status));
    const { data, error } = await query;
    if (error) throw error;
    const items = (data ?? []).map(mapExtraction);
    return { items, nextCursor: null, hasMore: false, totalCount: items.length };
  },
  async getExtraction(id) {
    const { data, error } = await client.from("document_intelligence_extractions").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? hydrateExtractionFileUrl(mapExtraction(data), data) : null;
  },
  async getMetrics(organizationId): Promise<ExtractionMetrics> {
    const page = await this.listExtractions({ organizationId, limit: 100 });
    const { data: usageRows, error: usageError } = await client
      .from("document_intelligence_extractions")
      .select("fields")
      .eq("organization_id", organizationId);
    if (usageError) throw usageError;
    const completedCount = page.items.filter((item) => item.status === "completed").length;
    const reviewCount = page.items.filter((item) => item.status === "review").length;
    const averageConfidence = page.items.length
      ? page.items.reduce((sum, item) => sum + item.overallConfidence, 0) / page.items.length
      : 0;
    const estimatedCostUsd = (usageRows ?? []).reduce(
      (sum, row) => sum + (Number(row.fields?.usage?.estimatedCostUsd) || 0),
      0,
    );
    return {
      totalProcessed: page.items.length,
      completedCount,
      reviewCount,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      averageDurationMs: 0,
      estimatedCostUsd: Math.round(estimatedCostUsd * 1_000_000) / 1_000_000,
    };
  },
  async startExtraction(input: StartExtractionInput): Promise<ExtractionMutationResult> {
    const file = fileFromInput(input);
    if (!file) return { ok: false, error: { code: "FILE_REQUIRED", message: "Select a passport image or PDF before extracting." } };
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return { ok: false, error: { code: "UNAUTHORIZED", message: "An authenticated session is required." } };
    const fileId = crypto.randomUUID();
    const documentPath = `organizations/${input.organizationId}/${userId}/${fileId}.${extensionFor(file)}`;
    const upload = await client.storage.from("document-intelligence-temp").upload(documentPath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (upload.error) return { ok: false, error: { code: "UPLOAD_FAILED", message: upload.error.message } };

    const extractionRequest = await client.functions.invoke("extract-identity-document", {
      body: {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        documentReference: documentPath,
      },
    });
    if (extractionRequest.error || !extractionRequest.data?.fields) {
      return { ok: false, error: { code: "EXTRACTION_FAILED", message: extractionRequest.error?.message ?? "The document extraction failed." } };
    }

    const extracted = extractionRequest.data as {
      classification?: { type?: string | null };
      fields: Record<string, string | null>;
      fieldConfidence?: Record<string, number>;
      usage?: Record<string, unknown>;
    };
    const documentType = extracted.classification?.type ?? "unknown";
    const policy = await client
      .from("document_intelligence_retention_policies")
      .select("retention_days")
      .eq("organization_id", input.organizationId)
      .eq("document_type", documentType)
      .maybeSingle();
    if (policy.error) return { ok: false, error: { code: "RETENTION_POLICY_READ_FAILED", message: policy.error.message } };
    const now = new Date().toISOString();
    const document = await client.from("document_intelligence_documents").insert({
      organization_id: input.organizationId,
      status: "review",
      retention_class: "temporary",
      retention_days: TEMPORARY_DOCUMENT_RETENTION_DAYS,
      expires_at: getDocumentExpiry(now, TEMPORARY_DOCUMENT_RETENTION_DAYS),
      temporary_storage_path: documentPath,
      source_suite: input.sourceSuite ?? "standalone",
      document_type: documentType,
      concurrency_token: `doc-${Date.now()}-${Math.random()}`,
    }).select().single();
    if (document.error) return { ok: false, error: { code: "DOCUMENT_CREATE_FAILED", message: document.error.message } };
    const version = await client.from("document_intelligence_versions").insert({ document_id: document.data.id, organization_id: input.organizationId, version_number: 1, source_reference: input.sourceReferenceId ?? input.title ?? null, concurrency_token: `version-${Date.now()}-${Math.random()}` }).select().single();
    if (version.error) return { ok: false, error: { code: "DOCUMENT_VERSION_FAILED", message: version.error.message } };
    const overallConfidence = calculateModelConfidence(extracted.fieldConfidence, extracted.fields);
    const extraction = await client.from("document_intelligence_extractions").insert({ document_version_id: version.data.id, organization_id: input.organizationId, status: "review", attempt: 1, provider: "gemini", provider_version: "gemini-2.5-flash", schema_version: "identity-v1", concurrency_token: `extraction-${Date.now()}-${Math.random()}`, fields: { title: input.title ?? documentTitle(documentType, extracted.fields.fullName, file.name), sourceSuite: input.sourceSuite, sourceReferenceId: input.sourceReferenceId, documentType, identity: extracted.fields, initialIdentity: extracted.fields, fieldConfidence: extracted.fieldConfidence ?? {}, overallConfidence, validatedAccuracy: null, usage: extracted.usage ?? null, files: { front: { name: file.name, size: file.size, mimeType: file.type, url: documentPath } } } }).select().single();
    if (extraction.error) return { ok: false, error: { code: "EXTRACTION_CREATE_FAILED", message: extraction.error.message } };
    await client.from("platform_timeline_events").upsert({
      organization_id: input.organizationId,
      relation_type: null,
      relation_id: null,
      type: "document_extraction",
      actor_id: userId,
      actor_type: "user",
      origin: "document_intelligence",
      source_type: "document_intelligence_extraction",
      source_id: extraction.data.id,
      dedupe_key: `document-extraction:${extraction.data.id}`,
      summary: "Passport extraction completed",
      metadata: { extractionId: extraction.data.id, documentType, documentNumber: extracted.fields.documentNumber ?? "" },
      visibility: "organization",
      occurred_at: new Date().toISOString(),
    }, { onConflict: "organization_id,dedupe_key" });
    await client.from("document_intelligence_versions").update({ extraction_id: extraction.data.id }).eq("id", version.data.id);
    await client.from("document_intelligence_documents").update({ current_version_id: version.data.id }).eq("id", document.data.id);
    return {
      ok: true,
      extraction: {
        ...mapExtraction(extraction.data),
        lifecycle: {
          documentId: document.data.id,
          tempStoragePath: documentPath,
          version: 1,
        },
      },
    };
  },
  async confirmExtraction(input: ConfirmExtractionInput) {
    const { data: currentRow, error: currentError } = await client
      .from("document_intelligence_extractions")
      .select("*")
      .eq("id", input.extractionId)
      .maybeSingle();
    if (currentError) return { ok: false, error: { code: "NOT_FOUND", message: currentError.message } };
    if (!currentRow) return { ok: false, error: { code: "NOT_FOUND", message: "Extraction not found." } };
    const current = mapExtraction(currentRow);
    const reviewedFields = { ...current.fields, ...input.fields };
    const validatedAccuracy = calculateValidatedAccuracy(
      (current.initialFields ?? {}) as Record<string, string | null>,
      input.fields as Record<string, string | null>,
    );
    const { data, error } = await client.from("document_intelligence_extractions").update({
      status: "approved",
      completed_at: new Date().toISOString(),
      fields: {
        ...(currentRow.fields ?? {}),
        identity: reviewedFields,
        initialIdentity: currentRow.fields?.initialIdentity ?? current.initialFields ?? {},
        validatedAccuracy,
      },
    }).eq("id", input.extractionId).select().single();
    if (error) return { ok: false, error: { code: "EXTRACTION_UPDATE_FAILED", message: error.message } };
    return { ok: true, extraction: mapExtraction(data) };
  },
  async reopenExtraction(input: ReopenExtractionInput) {
    const { data: current, error: currentError } = await client
      .from("document_intelligence_extractions")
      .select("id, organization_id, document_version_id, status")
      .eq("id", input.extractionId)
      .maybeSingle();
    if (currentError) return { ok: false, error: { code: "NOT_FOUND", message: currentError.message } };
    if (!current) return { ok: false, error: { code: "NOT_FOUND", message: "Extraction not found." } };
    if (current.status !== "approved") {
      return { ok: false, error: { code: "INVALID_STATUS", message: "Only confirmed extractions can be reopened." } };
    }

    const { data, error } = await client
      .from("document_intelligence_extractions")
      .update({ status: "review", completed_at: null })
      .eq("id", input.extractionId)
      .eq("organization_id", current.organization_id)
      .select()
      .single();
    if (error) return { ok: false, error: { code: "EXTRACTION_UPDATE_FAILED", message: error.message } };

    const { error: auditError } = await client.from("document_intelligence_audit_events").insert({
      organization_id: current.organization_id,
      actor_type: "user",
      event_type: "retry_requested",
      document_version_id: current.document_version_id,
      extraction_id: current.id,
      metadata: { reason: "manual_reopen" },
    });
    if (auditError) return { ok: false, error: { code: "AUDIT_FAILED", message: auditError.message } };
    return { ok: true, extraction: mapExtraction(data) };
  },
  async rejectExtraction(input: RejectExtractionInput) {
    const { data, error } = await client.from("document_intelligence_extractions").update({ status: "rejected", fields: { rejectionReason: input.reason ?? null } }).eq("id", input.extractionId).select().single();
    if (error) return { ok: false, error: { code: "EXTRACTION_UPDATE_FAILED", message: error.message } };
    return { ok: true, extraction: mapExtraction(data) };
  },
  async deleteExtraction(id) {
    const { data: extraction, error: extractionReadError } = await client
      .from("document_intelligence_extractions")
      .select("id, organization_id, document_version_id, fields")
      .eq("id", id)
      .maybeSingle();
    if (extractionReadError) throw extractionReadError;
    if (!extraction) return { ok: true };

    const frontPath = extraction.fields?.files?.front?.url;
    if (typeof frontPath === "string" && frontPath.length > 0) {
      const { error: tempStorageError } = await client.storage
        .from("document-intelligence-temp")
        .remove([frontPath]);
      if (tempStorageError && !tempStorageError.message.toLowerCase().includes("not found")) {
        throw tempStorageError;
      }
    }

    const { data: version, error: versionReadError } = await client
      .from("document_intelligence_versions")
      .select("id, document_id")
      .eq("id", extraction.document_version_id)
      .eq("organization_id", extraction.organization_id)
      .maybeSingle();
    if (versionReadError) throw versionReadError;

    let platformStoragePath: string | null = null;
    let platformFileId: string | null = null;
    if (version?.document_id) {
      const { data: document, error: documentReadError } = await client
        .from("document_intelligence_documents")
        .select("platform_file_id, temporary_storage_path")
        .eq("id", version.document_id)
        .eq("organization_id", extraction.organization_id)
        .maybeSingle();
      if (documentReadError) throw documentReadError;
      platformFileId = document?.platform_file_id ?? null;

      if (typeof extraction.fields?.files?.front?.url !== "string" && document?.temporary_storage_path) {
        const { error: tempStorageError } = await client.storage
          .from("document-intelligence-temp")
          .remove([document.temporary_storage_path]);
        if (tempStorageError && !tempStorageError.message.toLowerCase().includes("not found")) {
          throw tempStorageError;
        }
      }

      if (platformFileId) {
        const { data: platformFile, error: platformFileReadError } = await client
          .from("platform_files")
          .select("storage_path")
          .eq("id", platformFileId)
          .eq("organization_id", extraction.organization_id)
          .maybeSingle();
        if (platformFileReadError) throw platformFileReadError;
        platformStoragePath = platformFile?.storage_path ?? null;
      }
    }

    if (platformStoragePath) {
      const { error: platformStorageError } = await client.storage
        .from("platform-files")
        .remove([platformStoragePath]);
      if (platformStorageError && !platformStorageError.message.toLowerCase().includes("not found")) {
        throw platformStorageError;
      }
    }

    const { error: associationError } = await client
      .from("document_intelligence_associations")
      .delete()
      .eq("extraction_id", id)
      .eq("organization_id", extraction.organization_id);
    if (associationError) throw associationError;

    const { error: operationError } = await client
      .from("document_intelligence_lifecycle_operations")
      .delete()
      .eq("document_id", version?.document_id ?? "")
      .eq("organization_id", extraction.organization_id);
    if (operationError) throw operationError;

    const { error: extractionDeleteError } = await client
      .from("document_intelligence_extractions")
      .delete()
      .eq("id", id)
      .eq("organization_id", extraction.organization_id);
    if (extractionDeleteError) throw extractionDeleteError;

    if (platformFileId) {
      const { error: platformFileDeleteError } = await client
        .from("platform_files")
        .delete()
        .eq("id", platformFileId)
        .eq("organization_id", extraction.organization_id);
      if (platformFileDeleteError) throw platformFileDeleteError;
    }

    return { ok: true };
  },
};
