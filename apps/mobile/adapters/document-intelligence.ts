import { mobileSupabaseClient } from "./supabase";
import type { ExtractionDocumentFile, ExtractionRecord, IdentityDocumentFields } from "../domains/document-intelligence";

const emptyFields = (): IdentityDocumentFields => ({ documentType: "unknown", issuingCountry: null, fullName: null, givenNames: null, surnames: null, firstSurname: null, secondSurname: null, documentNumber: null, birthDate: null, nationality: null, sex: null, issueDate: null, expiryDate: null, birthplace: null, supportNumber: null, address: null, mrz: null });

function mapRow(row: any): ExtractionRecord {
  const fields = row.fields ?? {};
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: fields.title ?? "Document extraction",
    documentType: fields.documentType ?? "unknown",
    status: row.status === "approved" ? "completed" : row.status === "queued" ? "processing" : row.status,
    sourceSuite: fields.sourceSuite ?? "standalone",
    files: fields.files ?? { front: null, back: null },
    fields: { ...emptyFields(), ...(fields.identity ?? fields) },
    fieldConfidence: fields.fieldConfidence ?? {},
    overallConfidence: Number(fields.overallConfidence ?? 0),
    extractedAt: row.completed_at ?? row.created_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const mobileDocumentIntelligenceAdapter = {
  async listExtractions(input: { organizationId: string; limit: number }) {
    if (!input.organizationId) return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
    const { data, error } = await mobileSupabaseClient.from("document_intelligence_extractions").select("*").eq("organization_id", input.organizationId).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw new Error(error.message);
    const items = (data ?? []).map(mapRow);
    return { items, nextCursor: null, hasMore: false, totalCount: items.length };
  },
  async startExtraction(input: { organizationId: string; title?: string; sourceSuite?: ExtractionRecord["sourceSuite"]; sourceReferenceId?: string | null; frontFile: File | ExtractionDocumentFile; backFile?: File | ExtractionDocumentFile | null }) {
    if (!input.organizationId) return { ok: false as const, error: { code: "INVALID_SCOPE", message: "An organization is required." } };
    const document = await mobileSupabaseClient.from("document_intelligence_documents").insert({ organization_id: input.organizationId, status: "uploaded", retention_class: "standard", concurrency_token: `mobile-${Date.now()}` }).select().single();
    if (document.error) return { ok: false as const, error: { code: "DOCUMENT_CREATE_FAILED", message: document.error.message } };
    const version = await mobileSupabaseClient.from("document_intelligence_versions").insert({ document_id: document.data.id, organization_id: input.organizationId, version_number: 1, source_reference: input.sourceReferenceId ?? input.title ?? null, concurrency_token: `mobile-version-${Date.now()}` }).select().single();
    if (version.error) return { ok: false as const, error: { code: "DOCUMENT_VERSION_FAILED", message: version.error.message } };
    const extraction = await mobileSupabaseClient.from("document_intelligence_extractions").insert({ document_version_id: version.data.id, organization_id: input.organizationId, status: "review", attempt: 1, provider: "loopdev-mobile", provider_version: "v1", schema_version: "identity-v1", fields: { title: input.title ?? "Documento móvil", sourceSuite: input.sourceSuite ?? "standalone", sourceReferenceId: input.sourceReferenceId ?? null } }).select().single();
    if (extraction.error) return { ok: false as const, error: { code: "EXTRACTION_CREATE_FAILED", message: extraction.error.message } };
    return { ok: true as const, extraction: mapRow(extraction.data) };
  },
  async confirmExtraction(input: { extractionId: string; fields: Partial<IdentityDocumentFields> }) {
    const current = await mobileSupabaseClient.from("document_intelligence_extractions").select("*").eq("id", input.extractionId).single();
    if (current.error || !current.data) return { ok: false as const, error: { code: "NOT_FOUND", message: current.error?.message ?? "Extraction not found." } };
    const { data, error } = await mobileSupabaseClient.from("document_intelligence_extractions").update({ status: "approved", completed_at: new Date().toISOString(), fields: { ...(current.data.fields ?? {}), identity: { ...(current.data.fields?.identity ?? {}), ...input.fields } } }).eq("id", input.extractionId).select().single();
    if (error || !data) return { ok: false as const, error: { code: "EXTRACTION_UPDATE_FAILED", message: error?.message ?? "Extraction update failed." } };
    return { ok: true as const, extraction: mapRow(data) };
  },
  async deleteExtraction(id: string) {
    const { error } = await mobileSupabaseClient.from("document_intelligence_extractions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  },
};
