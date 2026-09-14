import { describe, expect, it } from "vitest";
import {
  isNoteContentValid,
  type NotesPort,
  type NotesErrorCode,
  type TipTapDocument,
} from "@/../packages/contracts/src/notes";

const richDocument: TipTapDocument = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Renewal follow-up", marks: [{ type: "bold" }] },
        { type: "mention", attrs: { id: "user-1", label: "Maya Chen" } },
      ],
    },
  ],
};

describe("NotesPort contract", () => {
  it("exposes the complete client-agnostic operation catalog", () => {
    const operations: Array<keyof NotesPort> = [
      "listNotes",
      "createNote",
      "updateNote",
      "deleteNote",
      "applyVisibilityAndPermissions",
      "relateToContact",
    ];

    expect(operations).toHaveLength(6);
    expect(new Set(operations).size).toBe(6);
  });

  it("accepts rich TipTap-compatible documents with a plain-text preview", () => {
    expect(isNoteContentValid(richDocument, "Renewal follow-up Maya Chen")).toBe(true);
    expect(isNoteContentValid({ type: "doc", content: [] }, "   ")).toBe(false);
  });

  it("keeps shared error codes stable for every adapter", () => {
    const errors: NotesErrorCode[] = [
      "NOTES_FORBIDDEN",
      "NOTES_NOT_FOUND",
      "NOTES_VALIDATION",
      "NOTES_INVALID_SCOPE",
      "NOTES_CONFLICT",
      "NOTES_IDEMPOTENCY_REPLAY",
      "NOTES_OFFLINE_PENDING",
      "NOTES_NETWORK",
      "NOTES_RATE_LIMITED",
    ];

    expect(new Set(errors).size).toBe(9);
  });
});
