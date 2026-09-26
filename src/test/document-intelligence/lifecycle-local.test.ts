import { describe, expect, it } from "vitest";
import { LocalDocumentLifecycleStore } from "@/loopdev/domains/document-intelligence/lifecycle-local";

describe("local document lifecycle promotion queue", () => {
  it("associates once and replays idempotently", () => {
    const store = new LocalDocumentLifecycleStore();
    store.seed({
      documentId: "doc-1", organizationId: "org-1", extractionId: "ext-1",
      state: "review", contactId: null, platformFileId: null, retentionDays: 365,
      expiresAt: "2026-10-01T00:00:00.000Z", version: 1,
    });
    const command = {
      documentId: "doc-1", extractionId: "ext-1", organizationId: "org-1",
      contactId: "contact-1", expectedVersion: 1, idempotencyKey: "associate-1",
    };
    const first = store.associate(command);
    const second = store.associate(command);
    expect(first.document.contactId).toBe("contact-1");
    expect(second.replayed).toBe(true);
    expect(second.document.version).toBe(first.document.version);
  });

  it("rejects stale concurrent associations", () => {
    const store = new LocalDocumentLifecycleStore();
    store.seed({
      documentId: "doc-2", organizationId: "org-1", extractionId: "ext-2",
      state: "review", contactId: null, platformFileId: null, retentionDays: 365,
      expiresAt: "2026-10-01T00:00:00.000Z", version: 1,
    });
    store.associate({ documentId: "doc-2", extractionId: "ext-2", organizationId: "org-1", contactId: "c-1", expectedVersion: 1, idempotencyKey: "a" });
    expect(() => store.associate({ documentId: "doc-2", extractionId: "ext-2", organizationId: "org-1", contactId: "c-2", expectedVersion: 1, idempotencyKey: "b" })).toThrow("changed");
  });
});
