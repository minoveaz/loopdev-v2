import { describe, expect, it } from "vitest";
import {
  DEFAULT_PERSISTED_DOCUMENT_RETENTION_DAYS,
  TEMPORARY_DOCUMENT_RETENTION_DAYS,
  assertDocumentTransition,
  canTransitionDocument,
  getDocumentExpiry,
  getDocumentRetentionDays,
  type DocumentRetentionSettings,
} from "@/loopdev/domains/document-intelligence/lifecycle";

const settings: DocumentRetentionSettings = {
  organizationId: "org-1",
  defaultRetentionDays: DEFAULT_PERSISTED_DOCUMENT_RETENTION_DAYS,
  temporaryRetentionDays: TEMPORARY_DOCUMENT_RETENTION_DAYS,
  policies: [
    {
      organizationId: "org-1",
      documentType: "passport",
      retentionDays: 730,
    },
  ],
};

describe("Document Intelligence lifecycle", () => {
  it("allows only approved lifecycle transitions", () => {
    expect(canTransitionDocument("temporary", "processing")).toBe(true);
    expect(canTransitionDocument("review", "linked")).toBe(true);
    expect(canTransitionDocument("linked", "processing")).toBe(false);
    expect(canTransitionDocument("deleted", "temporary")).toBe(false);
    expect(() => assertDocumentTransition("linked", "review")).toThrow(
      "Invalid document lifecycle transition",
    );
  });

  it("uses a document-type policy and defaults to one year", () => {
    expect(getDocumentRetentionDays(settings, "passport")).toBe(730);
    expect(getDocumentRetentionDays(settings, "spanish-dni")).toBe(365);
  });

  it("calculates temporary and persisted expiry dates deterministically", () => {
    expect(getDocumentExpiry("2026-09-26T00:00:00.000Z", TEMPORARY_DOCUMENT_RETENTION_DAYS))
      .toBe("2026-10-26T00:00:00.000Z");
    expect(getDocumentExpiry("2026-09-26T00:00:00.000Z", DEFAULT_PERSISTED_DOCUMENT_RETENTION_DAYS))
      .toBe("2027-09-26T00:00:00.000Z");
  });

  it("rejects invalid retention and dates", () => {
    expect(() => getDocumentExpiry("2026-09-26T00:00:00.000Z", 0)).toThrow();
    expect(() => getDocumentExpiry("not-a-date", 30)).toThrow();
  });
});
