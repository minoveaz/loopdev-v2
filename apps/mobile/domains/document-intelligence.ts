export type DocumentType = "spanish-dni" | "spanish-nie" | "passport" | "driver-license" | "foreign-id" | "unknown";
export type ExtractionStatus = "draft" | "processing" | "review" | "completed" | "rejected" | "failed";
export type ExportProfileId = "aseguradora-1" | "aseguradora-2" | "icao-internacional";
export type ExportProfileField = keyof IdentityDocumentFields;

export interface IdentityDocumentFields {
  documentType: DocumentType;
  issuingCountry: string | null;
  fullName: string | null;
  givenNames: string | null;
  surnames: string | null;
  firstSurname: string | null;
  secondSurname: string | null;
  documentNumber: string | null;
  birthDate: string | null;
  nationality: string | null;
  sex: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  birthplace: string | null;
  supportNumber: string | null;
  address: string | null;
  mrz: string | null;
}

export interface ExtractionDocumentFile {
  name: string;
  size: number;
  mimeType: string;
  file?: File;
  previewUrl?: string;
}

export interface ExtractionRecord {
  id: string;
  organizationId: string;
  title: string;
  documentType: DocumentType;
  status: ExtractionStatus;
  sourceSuite: "standalone" | "crm" | "communications" | "files";
  files: { front: ExtractionDocumentFile | null; back: ExtractionDocumentFile | null };
  fields: IdentityDocumentFields;
  fieldConfidence: Partial<Record<keyof IdentityDocumentFields, number>>;
  overallConfidence: number;
  extractedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const emptyFields = (): IdentityDocumentFields => ({
  documentType: "spanish-dni", issuingCountry: "ESP", fullName: null, givenNames: null,
  surnames: null, firstSurname: null, secondSurname: null, documentNumber: null,
  birthDate: null, nationality: "ESP", sex: null, issueDate: null, expiryDate: null,
  birthplace: null, supportNumber: null, address: null, mrz: null,
});

let records: ExtractionRecord[] = [];

export const localDocumentIntelligenceAdapter = {
  async listExtractions(input: { organizationId: string; limit: number }) {
    const items = records.filter((record) => record.organizationId === input.organizationId).slice(0, input.limit);
    return { items, nextCursor: null, hasMore: false, totalCount: items.length };
  },

  async startExtraction(input: {
    organizationId: string;
    title?: string;
    sourceSuite?: ExtractionRecord["sourceSuite"];
    frontFile: File | ExtractionDocumentFile;
    backFile?: File | ExtractionDocumentFile | null;
  }) {
    const now = new Date().toISOString();
    const toDocumentFile = (file: File | ExtractionDocumentFile): ExtractionDocumentFile =>
      typeof File !== "undefined" && file instanceof File
        ? { name: file.name, size: file.size, mimeType: file.type, file, previewUrl: URL.createObjectURL(file) }
        : file;
    const extraction: ExtractionRecord = {
      id: `mobile-extraction-${Date.now()}`,
      organizationId: input.organizationId,
      title: input.title || "Documento móvil",
      documentType: "spanish-dni",
      status: "review",
      sourceSuite: input.sourceSuite || "standalone",
      files: { front: toDocumentFile(input.frontFile), back: input.backFile ? toDocumentFile(input.backFile) : null },
      fields: emptyFields(), fieldConfidence: {}, overallConfidence: 0,
      extractedAt: now, completedAt: null, createdAt: now, updatedAt: now,
    };
    records = [extraction, ...records];
    return { ok: true as const, extraction };
  },

  async confirmExtraction(input: { extractionId: string; fields: Partial<IdentityDocumentFields> }) {
    const current = records.find((record) => record.id === input.extractionId);
    if (!current) return { ok: false as const, error: { code: "NOT_FOUND", message: "Extracción no encontrada." } };
    const updated = { ...current, fields: { ...current.fields, ...input.fields }, status: "completed" as const, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    records = records.map((record) => record.id === updated.id ? updated : record);
    return { ok: true as const, extraction: updated };
  },

  async deleteExtraction(id: string) {
    records = records.filter((record) => record.id !== id);
    return { ok: true as const };
  },
};

export const DEFAULT_EXPORT_PROFILE_ID: ExportProfileId = "aseguradora-1";
export const EXPORT_PROFILES = [
  { id: "aseguradora-1" as const, label: "Aseguradora 1", description: "Campos separados.", fields: ["documentNumber", "supportNumber", "givenNames", "firstSurname", "secondSurname", "birthDate", "sex", "nationality", "expiryDate", "address"] as ExportProfileField[] },
  { id: "aseguradora-2" as const, label: "Aseguradora 2", description: "Nombre y apellidos agrupados.", fields: ["documentNumber", "supportNumber", "givenNames", "surnames", "birthDate", "sex", "nationality", "expiryDate", "address"] as ExportProfileField[] },
  { id: "icao-internacional" as const, label: "ICAO / Internacional", description: "Formato internacional.", fields: ["documentNumber", "issuingCountry", "givenNames", "surnames", "nationality", "birthDate", "sex", "expiryDate", "mrz"] as ExportProfileField[] },
];

export function splitSurnames(value: string | null) {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  return { firstSurname: parts[0] || null, secondSurname: parts.slice(1).join(" ") || null };
}

export function buildSurnames(firstSurname: string | null, secondSurname: string | null) {
  return [firstSurname, secondSurname].filter(Boolean).join(" ") || null;
}

export function formatFieldsForProfile(fields: IdentityDocumentFields, profileId: ExportProfileId) {
  const profile = EXPORT_PROFILES.find((item) => item.id === profileId) || EXPORT_PROFILES[0];
  return profile.fields.map((field) => `${field}: ${fields[field] ?? "—"}`).join("\n");
}

export function selectFieldsForProfile(fields: IdentityDocumentFields, profileId: ExportProfileId) {
  const profile = EXPORT_PROFILES.find((item) => item.id === profileId) || EXPORT_PROFILES[0];
  return Object.fromEntries(profile.fields.map((field) => [field, fields[field]]));
}
