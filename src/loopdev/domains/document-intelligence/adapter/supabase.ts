import { createClient } from "@supabase/supabase-js";
import type { DocumentIntelligenceAdapter } from "./index";
import type { ExtractionListParams, ExtractionMutationResult, ExtractionPage, ExtractionRecord, ExtractionMetrics, StartExtractionInput, ConfirmExtractionInput, RejectExtractionInput } from "./types";

const client = createClient(
  import.meta.env.VITE_SUPABASE_URL || "https://sukjcsylkljiyvfklxvj.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845",
);

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
    fieldConfidence: fields.fieldConfidence ?? {},
    overallConfidence: Number(fields.overallConfidence ?? 0),
    extractedAt: row.completed_at ?? row.created_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    return data ? mapExtraction(data) : null;
  },
  async getMetrics(organizationId): Promise<ExtractionMetrics> {
    const page = await this.listExtractions({ organizationId, limit: 100 });
    const completedCount = page.items.filter((item) => item.status === "completed").length;
    const reviewCount = page.items.filter((item) => item.status === "review").length;
    return { totalProcessed: page.items.length, completedCount, reviewCount, averageConfidence: 0, averageDurationMs: 0, estimatedCostUsd: 0 };
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
    const document = await client.from("document_intelligence_documents").insert({ organization_id: input.organizationId, status: "review", retention_class: "standard", concurrency_token: `doc-${Date.now()}-${Math.random()}` }).select().single();
    if (document.error) return { ok: false, error: { code: "DOCUMENT_CREATE_FAILED", message: document.error.message } };
    const version = await client.from("document_intelligence_versions").insert({ document_id: document.data.id, organization_id: input.organizationId, version_number: 1, source_reference: input.sourceReferenceId ?? input.title ?? null, concurrency_token: `version-${Date.now()}-${Math.random()}` }).select().single();
    if (version.error) return { ok: false, error: { code: "DOCUMENT_VERSION_FAILED", message: version.error.message } };
    const extraction = await client.from("document_intelligence_extractions").insert({ document_version_id: version.data.id, organization_id: input.organizationId, status: "review", attempt: 1, provider: "gemini", provider_version: "gemini-2.5-flash", schema_version: "identity-v1", concurrency_token: `extraction-${Date.now()}-${Math.random()}`, fields: { title: input.title ?? file.name, sourceSuite: input.sourceSuite, sourceReferenceId: input.sourceReferenceId, documentType: extracted.classification?.type ?? "unknown", identity: extracted.fields, fieldConfidence: extracted.fieldConfidence ?? {}, overallConfidence: 0, usage: extracted.usage ?? null, files: { front: { name: file.name, size: file.size, mimeType: file.type, url: documentPath } } } }).select().single();
    if (extraction.error) return { ok: false, error: { code: "EXTRACTION_CREATE_FAILED", message: extraction.error.message } };
    await client.from("document_intelligence_versions").update({ extraction_id: extraction.data.id }).eq("id", version.data.id);
    await client.from("document_intelligence_documents").update({ current_version_id: version.data.id }).eq("id", document.data.id);
    return { ok: true, extraction: mapExtraction(extraction.data) };
  },
  async confirmExtraction(input: ConfirmExtractionInput) {
    const current = await this.getExtraction(input.extractionId);
    if (!current) return { ok: false, error: { code: "NOT_FOUND", message: "Extraction not found." } };
    const { data, error } = await client.from("document_intelligence_extractions").update({ status: "approved", completed_at: new Date().toISOString(), fields: { ...current.fields, identity: { ...current.fields, ...input.fields } } }).eq("id", input.extractionId).select().single();
    if (error) return { ok: false, error: { code: "EXTRACTION_UPDATE_FAILED", message: error.message } };
    return { ok: true, extraction: mapExtraction(data) };
  },
  async rejectExtraction(input: RejectExtractionInput) {
    const { data, error } = await client.from("document_intelligence_extractions").update({ status: "rejected", fields: { rejectionReason: input.reason ?? null } }).eq("id", input.extractionId).select().single();
    if (error) return { ok: false, error: { code: "EXTRACTION_UPDATE_FAILED", message: error.message } };
    return { ok: true, extraction: mapExtraction(data) };
  },
  async deleteExtraction(id) {
    const { error } = await client.from("document_intelligence_extractions").delete().eq("id", id);
    return { ok: !error };
  },
};
