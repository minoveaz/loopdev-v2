import type {
  ExtractionRecord,
  ExtractionListParams,
  ExtractionPage,
  ExtractionMetrics,
  StartExtractionInput,
  ConfirmExtractionInput,
  RejectExtractionInput,
  ExtractionMutationResult,
} from "./types";

export interface DocumentIntelligenceAdapter {
  listExtractions(params: ExtractionListParams): Promise<ExtractionPage>;
  getExtraction(id: string): Promise<ExtractionRecord | null>;
  getMetrics(organizationId: string): Promise<ExtractionMetrics>;
  startExtraction(input: StartExtractionInput): Promise<ExtractionMutationResult>;
  confirmExtraction(input: ConfirmExtractionInput): Promise<ExtractionMutationResult>;
  rejectExtraction(input: RejectExtractionInput): Promise<ExtractionMutationResult>;
  deleteExtraction(id: string): Promise<{ ok: boolean }>;
}

export * from "./types";
export { localDocumentIntelligenceAdapter } from "./local";
