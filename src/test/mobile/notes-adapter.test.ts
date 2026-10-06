import { describe, expect, it } from "vitest";
import { mobileNotesAdapter } from "../../../apps/mobile/adapters/notes";
import type { CreateNoteInput } from "../../../packages/contracts/src/notes";

const scope = { organizationId: "local-development-organization", workspaceId: null };
const relation = { type: "contact" as const, id: "crm_cust_1", label: "Jordan Davis", scope };

function input(overrides: Partial<CreateNoteInput> = {}): CreateNoteInput {
  return {
    scope,
    authorId: "local-development-user",
    mode: "rich",
    content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Renewal follow-up" }] }] },
    plainTextPreview: "Renewal follow-up",
    visibility: "team",
    relations: [relation],
    idempotencyKey: `test-${Date.now()}-${Math.random()}`,
    ...overrides,
  };
}

describe("mobile Notes adapter", () => {
  it("supports rich create, relation-scoped list, update and delete", async () => {
    const created = await mobileNotesAdapter.createNote(input());
    expect(created.status).toBe("success");
    if (created.status !== "success") return;

    const listed = await mobileNotesAdapter.listNotes({ scope, relation, limit: 25 });
    expect(listed.status).toBe("success");
    if (listed.status !== "success") return;
    expect(listed.data.items.some((note) => note.id === created.data.id && note.mode === "rich")).toBe(true);

    const updated = await mobileNotesAdapter.updateNote(created.data.id, { mode: "quick", plainTextPreview: "Updated quick note", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Updated quick note" }] }] }, expectedVersion: created.data.version, idempotencyKey: "update-test" });
    expect(updated.status).toBe("success");
    if (updated.status !== "success") return;

    const deleted = await mobileNotesAdapter.deleteNote(created.data.id, { expectedVersion: updated.data.version, idempotencyKey: "delete-test" });
    expect(deleted.status).toBe("success");
  });

  it("returns an explicit conflict for a stale update", async () => {
    const created = await mobileNotesAdapter.createNote(input({ mode: "quick", plainTextPreview: "Conflict note" }));
    expect(created.status).toBe("success");
    if (created.status !== "success") return;
    const conflict = await mobileNotesAdapter.updateNote(created.data.id, { plainTextPreview: "Stale", expectedVersion: 0, idempotencyKey: "stale-test" });
    expect(conflict).toMatchObject({ status: "error", error: { code: "NOTES_CONFLICT" } });
  });
});
