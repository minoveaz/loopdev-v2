export type DocumentIntelligenceSourceSuite = "standalone" | "crm" | "communications" | "files";

export type DocumentType =
  | "spanish-dni"
  | "spanish-nie"
  | "passport"
  | "driver-license"
  | "foreign-id"
  | "unknown";

export type ExtractionStatus =
  | "draft"
  | "processing"
  | "review"
  | "completed"
  | "rejected"
  | "failed";

export type ExtractionConfidenceLevel = "high" | "medium" | "low";

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

export type ExtractionFieldConfidence = Partial<Record<keyof IdentityDocumentFields, number>>;

export interface ExtractionDocumentFile {
  name: string;
  size: number;
  mimeType: string;
  url?: string;
  file?: File;
  previewUrl?: string;
}

export interface ExtractionFiles {
  front: ExtractionDocumentFile | null;
  back: ExtractionDocumentFile | null;
}

export interface ExtractionRecord {
  id: string;
  organizationId: string;
  title: string;
  documentType: DocumentType;
  status: ExtractionStatus;
  sourceSuite: DocumentIntelligenceSourceSuite;
  sourceReferenceId?: string | null; // e.g. contactId or messageId
  files: ExtractionFiles;
  fields: IdentityDocumentFields;
  fieldConfidence: ExtractionFieldConfidence;
  overallConfidence: number;
  extractedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lifecycle?: {
    documentId: string;
    tempStoragePath: string;
    version: number;
  } | null;
}

export interface ExtractionListParams {
  organizationId: string;
  query?: string;
  cursor?: string | null;
  limit: number;
  status?: ExtractionStatus[];
  sourceSuite?: DocumentIntelligenceSourceSuite[];
  documentType?: DocumentType[];
  sortBy?: "createdAt" | "title" | "confidence" | "status";
  sortDirection?: "asc" | "desc";
}

export interface ExtractionPage {
  items: ExtractionRecord[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

export interface ExtractionMetrics {
  totalProcessed: number;
  completedCount: number;
  reviewCount: number;
  averageConfidence: number;
  averageDurationMs: number;
  estimatedCostUsd: number;
}

export interface StartExtractionInput {
  organizationId: string;
  title?: string;
  sourceSuite?: DocumentIntelligenceSourceSuite;
  sourceReferenceId?: string | null;
  frontFile: File | ExtractionDocumentFile;
  backFile?: File | ExtractionDocumentFile | null;
  fixtureId?: string;
}

export interface ConfirmExtractionInput {
  extractionId: string;
  fields: Partial<IdentityDocumentFields>;
}

export interface RejectExtractionInput {
  extractionId: string;
  reason?: string;
}

export type ExtractionMutationResult =
  | { ok: true; extraction: ExtractionRecord }
  | { ok: false; error: { code: string; message: string } };

export const resolveConfidenceLevel = (confidence: number | undefined): ExtractionConfidenceLevel => {
  if (confidence === undefined) return "medium";
  if (confidence >= 0.9) return "high";
  if (confidence >= 0.75) return "medium";
  return "low";
};
