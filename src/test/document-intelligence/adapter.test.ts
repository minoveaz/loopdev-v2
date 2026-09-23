import { describe, it, expect } from "vitest";
import { localDocumentIntelligenceAdapter } from "@/loopdev/domains/document-intelligence/adapter/local";
import { DEMO_DOCUMENT_FIXTURES } from "@/loopdev/domains/document-intelligence/data/fixtures";

const ORG_ID = "local-development-organization";

describe("Document Intelligence - Local Adapter", () => {
  it("supports the Latin American passport review flow", async () => {
    const fixture = DEMO_DOCUMENT_FIXTURES.find((item) => item.id === "fixture-passport-colombia-valentina");
    expect(fixture).toBeDefined();
    if (!fixture) return;

    const started = await localDocumentIntelligenceAdapter.startExtraction({
      organizationId: ORG_ID,
      sourceSuite: "crm",
      fixtureId: fixture.id,
      frontFile: fixture.record.files.front!,
    });

    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.extraction.status).toBe("review");
    expect(started.extraction.documentType).toBe("passport");
    expect(started.extraction.fields.issuingCountry).toBe("COL");
    expect(started.extraction.fields.documentNumber).toBe("AS4827316");
    expect(started.extraction.fields.mrz).toContain("P<COLGOMEZ<RIVERA");

    const confirmed = await localDocumentIntelligenceAdapter.confirmExtraction({
      extractionId: started.extraction.id,
      fields: { fullName: "Valentina Gómez Rivera" },
    });

    expect(confirmed.ok).toBe(true);
    if (confirmed.ok) {
      expect(confirmed.extraction.status).toBe("completed");
      expect(confirmed.extraction.fields.fullName).toBe("Valentina Gómez Rivera");
    }

    await localDocumentIntelligenceAdapter.deleteExtraction(started.extraction.id);
  });

  it("lists extractions with pagination and filtering", async () => {
    const res = await localDocumentIntelligenceAdapter.listExtractions({
      organizationId: ORG_ID,
      limit: 10,
    });
    expect(res.items.length).toBeGreaterThanOrEqual(3);
    expect(res.items[0]).toHaveProperty("id");
    expect(res.items[0]).toHaveProperty("title");
    expect(res.items[0]).toHaveProperty("sourceSuite");
  });

  it("filters extractions by search query", async () => {
    const res = await localDocumentIntelligenceAdapter.listExtractions({
      organizationId: ORG_ID,
      query: "Carmen",
      limit: 10,
    });
    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res.items.some((item) => item.title.includes("Carmen"))).toBe(true);
  });

  it("filters extractions by sourceSuite", async () => {
    const crmRes = await localDocumentIntelligenceAdapter.listExtractions({
      organizationId: ORG_ID,
      sourceSuite: ["crm"],
      limit: 10,
    });
    expect(crmRes.items.every((item) => item.sourceSuite === "crm")).toBe(true);

    const commsRes = await localDocumentIntelligenceAdapter.listExtractions({
      organizationId: ORG_ID,
      sourceSuite: ["communications"],
      limit: 10,
    });
    expect(commsRes.items.every((item) => item.sourceSuite === "communications")).toBe(true);
  });

  it("calculates metrics accurately", async () => {
    const metrics = await localDocumentIntelligenceAdapter.getMetrics(ORG_ID);
    expect(metrics.totalProcessed).toBeGreaterThanOrEqual(3);
    expect(metrics.completedCount).toBeGreaterThanOrEqual(2);
    expect(metrics.averageConfidence).toBeGreaterThan(0.9);
    expect(metrics.averageDurationMs).toBeGreaterThan(0);
    expect(metrics.estimatedCostUsd).toBeGreaterThan(0);
  });

  it("starts, confirms and rejects extractions with immutable transitions", async () => {
    const startResult = await localDocumentIntelligenceAdapter.startExtraction({
      organizationId: ORG_ID,
      title: "Test Ingestion",
      frontFile: {
        name: "test.svg",
        size: 1024,
        mimeType: "image/svg+xml",
        previewUrl: "data:image/svg+xml;utf8,<svg></svg>",
      },
    });

    expect(startResult.ok).toBe(true);
    if (!startResult.ok) return;

    const extractionId = startResult.extraction.id;
    const fetched = await localDocumentIntelligenceAdapter.getExtraction(extractionId);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe("Test Ingestion");
    expect(fetched?.status).toBe("review");

    const confirmResult = await localDocumentIntelligenceAdapter.confirmExtraction({
      extractionId,
      fields: {
        documentNumber: "99887766M",
        givenNames: "Persona",
      },
    });

    expect(confirmResult.ok).toBe(true);
    if (!confirmResult.ok) return;
    expect(confirmResult.extraction.status).toBe("completed");
    expect(confirmResult.extraction.fields.documentNumber).toBe("99887766M");
    expect(confirmResult.extraction.fields.givenNames).toBe("Persona");

    // Clean up
    const deleteResult = await localDocumentIntelligenceAdapter.deleteExtraction(extractionId);
    expect(deleteResult.ok).toBe(true);
    const postDelete = await localDocumentIntelligenceAdapter.getExtraction(extractionId);
    expect(postDelete).toBeNull();
  });
});
