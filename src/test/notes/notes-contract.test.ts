import { beforeEach, describe, expect, it } from "vitest";
import {
  createLocalNotesAdapter,
  LOCAL_NOTES_STORAGE_KEY,
  noteMentions,
  notePlainText,
  type CreateGlobalNoteInput,
  type GlobalNoteRecord,
  type NoteRelationRef,
} from "@/loopdev/domains/notes";

const organizationId = "local-development-organization";
const relation: NoteRelationRef = { type: "contact", id: "contact-1", label: "Ada Lovelace" };

const input = (overrides: Partial<CreateGlobalNoteInput> = {}): CreateGlobalNoteInput => ({
  organizationId,
  authorId: "local-development-user",
  authorName: "Alex Morgan",
  title: "Follow-up",
  mode: "rich",
  visibility: "team",
  relations: [relation],
  content: {
    type: "doc",
    content: [{
      type: "paragraph",
      content: [
        { type: "text", text: "Follow up with " },
        { type: "mention", attrs: { id: "agent-maya", label: "Maya Chen" } },
      ],
    }],
  },
  plainTextPreview: "Follow up with Maya Chen",
  mentions: [{ userId: "agent-maya", displayName: "Maya Chen" }],
  attachments: [{
    id: "attachment-1",
    name: "brief.txt",
    mimeType: "text/plain",
    size: 42,
    url: "blob:browser-session-only",
    status: "uploaded",
  }],
  ...overrides,
});

beforeEach(() => {
  window.localStorage.removeItem(LOCAL_NOTES_STORAGE_KEY);
});

describe("global note serialization", () => {
  it("keeps rich JSON while producing a readable preview and unique mentions", () => {
    const content = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Follow up with " }, { type: "mention", attrs: { id: "agent-maya", label: "Maya Chen" } }] },
        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Confirm timeline" }] }] }] },
      ],
    };
    expect(notePlainText(content)).toBe("Follow up with Maya Chen\nConfirm timeline");
    expect(noteMentions(content)).toEqual([{ userId: "agent-maya", displayName: "Maya Chen" }]);
  });

  it("preserves explicit line breaks between blocks", () => {
    expect(notePlainText({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "First" }, { type: "hardBreak" }, { type: "text", text: "second" }] },
        { type: "paragraph", content: [{ type: "text", text: "Third" }] },
      ],
    })).toBe("First\nsecond\nThird");
  });
});

describe("local global notes adapter", () => {
  it("persists complete records and filters them by relation", async () => {
    const firstAdapter = createLocalNotesAdapter(window.localStorage);
    const created = await firstAdapter.create(input());
    await firstAdapter.create(input({
      title: "Other contact",
      relations: [{ type: "contact", id: "contact-2", label: "Grace Hopper" }],
      attachments: [],
    }));

    expect(created.content.content?.[0].content?.[1]).toMatchObject({ type: "mention" });
    expect(created.mentions).toEqual([{ userId: "agent-maya", displayName: "Maya Chen" }]);

    const reloadedAdapter = createLocalNotesAdapter(window.localStorage);
    const persisted = await reloadedAdapter.list(relation);
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({
      title: "Follow-up",
      mode: "rich",
      visibility: "team",
      plainTextPreview: "Follow up with Maya Chen",
      mentions: [{ userId: "agent-maya", displayName: "Maya Chen" }],
      content: input().content,
    });
    expect(persisted[0].attachments[0]).toMatchObject({
      name: "brief.txt",
      url: "",
      status: "uploaded",
    });
  });

  it("updates and deletes durable notes", async () => {
    const adapter = createLocalNotesAdapter(window.localStorage);
    const created = await adapter.create(input({ attachments: [] }));
    const updated = await adapter.update(created.id, input({
      title: "Updated",
      visibility: "private",
      plainTextPreview: "Updated body",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Updated body" }] }] },
      mentions: [],
      attachments: [],
    }));

    expect(updated).toMatchObject({ id: created.id, title: "Updated", visibility: "private", plainTextPreview: "Updated body" });
    expect((await createLocalNotesAdapter(window.localStorage).list(relation))[0]).toMatchObject({ id: created.id, title: "Updated" });

    await adapter.delete(created.id);
    await expect(adapter.delete(created.id)).rejects.toThrow("Note not found.");
    expect(await createLocalNotesAdapter(window.localStorage).list()).toEqual([]);
  });

  it("imports a legacy seed once and keeps a deletion deleted", async () => {
    const adapter = createLocalNotesAdapter(window.localStorage);
    const legacyInput = input({ mode: "quick", attachments: [], mentions: [] });
    const legacy: GlobalNoteRecord = {
      id: "legacy-contact-note",
      ...legacyInput,
      title: "",
      mentions: legacyInput.mentions ?? [],
      attachments: legacyInput.attachments ?? [],
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      permissions: { canEdit: true, canDelete: true },
    };

    await adapter.seed([legacy]);
    await adapter.update(legacy.id, { plainTextPreview: "Edited legacy note" });
    await adapter.seed([legacy]);
    expect((await adapter.list(relation))[0].plainTextPreview).toBe("Edited legacy note");

    await adapter.delete(legacy.id);
    await adapter.seed([legacy]);
    expect(await adapter.list(relation)).toEqual([]);
  });

  it("rejects malformed persisted data with a clear error", async () => {
    window.localStorage.setItem(LOCAL_NOTES_STORAGE_KEY, "{not-json");
    await expect(createLocalNotesAdapter(window.localStorage).list()).rejects.toThrow("Stored notes contain invalid JSON.");
  });

  it("surfaces browser storage failures instead of silently losing notes", async () => {
    const failingStorage = {
      getItem: () => { throw new Error("storage is disabled"); },
      setItem: () => { throw new Error("quota exceeded"); },
    };
    await expect(createLocalNotesAdapter(failingStorage).list()).rejects.toThrow(
      "Unable to read local notes in browser storage. storage is disabled",
    );

    const writeFailingStorage = {
      getItem: () => null,
      setItem: () => { throw new Error("quota exceeded"); },
    };
    await expect(createLocalNotesAdapter(writeFailingStorage).create(input())).rejects.toThrow(
      "Unable to write local notes in browser storage. quota exceeded",
    );
  });
});
