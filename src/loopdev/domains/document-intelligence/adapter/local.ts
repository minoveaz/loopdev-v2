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
import type { DocumentIntelligenceAdapter } from "./index";
import { INITIAL_EXTRACTIONS_STORE, DEMO_DOCUMENT_FIXTURES } from "../data/fixtures";

let extractionsStore: ExtractionRecord[] = [...INITIAL_EXTRACTIONS_STORE];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const localDocumentIntelligenceAdapter: DocumentIntelligenceAdapter = {
  async listExtractions(params: ExtractionListParams): Promise<ExtractionPage> {
    await delay(120);
    let filtered = extractionsStore.filter(
      (item) => item.organizationId === params.organizationId,
    );

    if (params.query?.trim()) {
      const q = params.query.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.fields.fullName?.toLowerCase().includes(q) ||
          item.fields.documentNumber?.toLowerCase().includes(q),
      );
    }

    if (params.status?.length) {
      filtered = filtered.filter((item) => params.status!.includes(item.status));
    }

    if (params.sourceSuite?.length) {
      filtered = filtered.filter((item) => params.sourceSuite!.includes(item.sourceSuite));
    }

    if (params.documentType?.length) {
      filtered = filtered.filter((item) => params.documentType!.includes(item.documentType));
    }

    // Ordenación
    const sortBy = params.sortBy ?? "createdAt";
    const sortDirection = params.sortDirection ?? "desc";
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === "confidence") {
        comparison = a.overallConfidence - b.overallConfidence;
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status);
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });

    const totalCount = filtered.length;
    const limit = Math.max(1, Math.min(params.limit || 10, 50));
    let startIndex = 0;

    if (params.cursor) {
      const foundIndex = filtered.findIndex((item) => item.id === params.cursor);
      if (foundIndex >= 0) {
        startIndex = foundIndex + 1;
      }
    }

    const items = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < filtered.length;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    return {
      items: JSON.parse(JSON.stringify(items)),
      nextCursor,
      hasMore,
      totalCount,
    };
  },

  async getExtraction(id: string): Promise<ExtractionRecord | null> {
    await delay(80);
    const found = extractionsStore.find((item) => item.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  async getMetrics(organizationId: string): Promise<ExtractionMetrics> {
    await delay(60);
    const orgItems = extractionsStore.filter((item) => item.organizationId === organizationId);
    const totalProcessed = orgItems.length;
    const completedCount = orgItems.filter((item) => item.status === "completed").length;
    const reviewCount = orgItems.filter((item) => item.status === "review").length;
    const averageConfidence =
      totalProcessed > 0
        ? orgItems.reduce((acc, curr) => acc + curr.overallConfidence, 0) / totalProcessed
        : 0;

    return {
      totalProcessed,
      completedCount,
      reviewCount,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      averageDurationMs: 3800,
      estimatedCostUsd: totalProcessed * 0.008,
    };
  },

  async startExtraction(input: StartExtractionInput): Promise<ExtractionMutationResult> {
    await delay(200);
    const fixture = DEMO_DOCUMENT_FIXTURES.find((f) => f.id === input.fixtureId) ?? DEMO_DOCUMENT_FIXTURES[0];
    const newId = `ext-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const isFile = (f: unknown): f is File => typeof File !== "undefined" && f instanceof File;

    const frontFileObj = isFile(input.frontFile)
      ? {
          name: input.frontFile.name,
          size: input.frontFile.size,
          mimeType: input.frontFile.type,
          file: input.frontFile,
          previewUrl: URL.createObjectURL(input.frontFile),
        }
      : input.frontFile;

    const newRecord: ExtractionRecord = {
      id: newId,
      organizationId: input.organizationId,
      title: input.title || fixture.record.title,
      documentType: fixture.record.documentType,
      status: "review",
      sourceSuite: input.sourceSuite ?? "standalone",
      sourceReferenceId: input.sourceReferenceId ?? null,
      files: {
        front: frontFileObj,
        back: input.backFile ? (isFile(input.backFile) ? {
          name: input.backFile.name,
          size: input.backFile.size,
          mimeType: input.backFile.type,
          file: input.backFile,
          previewUrl: URL.createObjectURL(input.backFile),
        } : input.backFile) : null,
      },
      fields: JSON.parse(JSON.stringify(fixture.record.fields)),
      fieldConfidence: JSON.parse(JSON.stringify(fixture.record.fieldConfidence)),
      overallConfidence: fixture.record.overallConfidence,
      extractedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    extractionsStore.unshift(newRecord);

    return {
      ok: true,
      extraction: JSON.parse(JSON.stringify(newRecord)),
    };
  },

  async confirmExtraction(input: ConfirmExtractionInput): Promise<ExtractionMutationResult> {
    await delay(150);
    const index = extractionsStore.findIndex((item) => item.id === input.extractionId);
    if (index === -1) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Extracción no encontrada." } };
    }

    const current = extractionsStore[index];
    const now = new Date().toISOString();
    const updated: ExtractionRecord = {
      ...current,
      fields: {
        ...current.fields,
        ...input.fields,
      },
      status: "completed",
      completedAt: now,
      updatedAt: now,
    };

    extractionsStore[index] = updated;

    return {
      ok: true,
      extraction: JSON.parse(JSON.stringify(updated)),
    };
  },

  async rejectExtraction(input: RejectExtractionInput): Promise<ExtractionMutationResult> {
    await delay(120);
    const index = extractionsStore.findIndex((item) => item.id === input.extractionId);
    if (index === -1) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Extracción no encontrada." } };
    }

    const current = extractionsStore[index];
    const now = new Date().toISOString();
    const updated: ExtractionRecord = {
      ...current,
      status: "rejected",
      updatedAt: now,
    };

    extractionsStore[index] = updated;

    return {
      ok: true,
      extraction: JSON.parse(JSON.stringify(updated)),
    };
  },

  async deleteExtraction(id: string): Promise<{ ok: boolean }> {
    await delay(100);
    extractionsStore = extractionsStore.filter((item) => item.id !== id);
    return { ok: true };
  },
};
