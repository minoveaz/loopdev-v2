import type {
  CreateGlobalNoteInput,
  GlobalNoteRecord,
  GlobalNotesAdapter,
  NoteAttachment,
  NoteRelationRef,
  WorkspaceUser,
} from "../types";

export const LOCAL_NOTES_STORAGE_KEY = "loopdev.global-notes.v1";
export const LOCAL_NOTES_ORGANIZATION_ID = "local-development-organization";
const STORAGE_VERSION = 1;
const organizationId = LOCAL_NOTES_ORGANIZATION_ID;

const users: WorkspaceUser[] = [
  { id: "local-development-user", displayName: "Alex Morgan", email: "alex@example.test", organizationId: "local-development-organization" },
  { id: "agent-maya", displayName: "Maya Chen", email: "maya@example.test", organizationId: "local-development-organization" },
  { id: "agent-jordan", displayName: "Jordan Lee", email: "jordan@example.test", organizationId: "local-development-organization" },
];

interface PersistedNotes {
  version: typeof STORAGE_VERSION;
  notes: GlobalNoteRecord[];
  seededIds: string[];
}

type NotesStorage = Pick<Storage, "getItem" | "setItem">;

function storageFailure(operation: "read" | "write", cause: unknown): Error {
  const detail = cause instanceof Error && cause.message ? ` ${cause.message}` : "";
  return new Error(`Unable to ${operation} local notes in browser storage.${detail}`);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isRelation(value: unknown): value is NoteRelationRef {
  return isObject(value)
    && ["contact", "conversation", "lead", "opportunity", "task"].includes(String(value.type))
    && isString(value.id)
    && isString(value.label);
}

function isAttachment(value: unknown): value is NoteAttachment {
  return isObject(value)
    && isString(value.id)
    && isString(value.name)
    && isString(value.mimeType)
    && typeof value.size === "number"
    && Number.isFinite(value.size)
    && value.size >= 0
    && isString(value.url)
    && ["uploading", "uploaded", "error"].includes(String(value.status))
    && (value.error === undefined || isString(value.error));
}

function isRecord(value: unknown): value is GlobalNoteRecord {
  return isObject(value)
    && ["id", "organizationId", "authorId", "authorName", "title", "plainTextPreview", "createdAt", "updatedAt"].every((key) => isString(value[key]))
    && ["quick", "rich"].includes(String(value.mode))
    && ["private", "team", "organization"].includes(String(value.visibility))
    && Array.isArray(value.relations)
    && value.relations.every(isRelation)
    && isObject(value.content)
    && Array.isArray(value.mentions)
    && value.mentions.every((mention) => isObject(mention) && isString(mention.userId) && isString(mention.displayName))
    && Array.isArray(value.attachments)
    && value.attachments.every(isAttachment)
    && isObject(value.permissions)
    && typeof value.permissions.canEdit === "boolean"
    && typeof value.permissions.canDelete === "boolean";
}

function parseState(raw: string | null): PersistedNotes {
  if (raw === null) return { version: STORAGE_VERSION, notes: [], seededIds: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    if (cause instanceof SyntaxError) throw new Error("Stored notes contain invalid JSON.");
    throw cause;
  }
  if (!isObject(parsed)
    || parsed.version !== STORAGE_VERSION
    || !Array.isArray(parsed.notes)
    || !parsed.notes.every(isRecord)
    || !Array.isArray(parsed.seededIds)
    || !parsed.seededIds.every(isString)) {
    throw new Error("Stored notes do not match the supported local notes format.");
  }
  return parsed as unknown as PersistedNotes;
}

function cloneRecord(record: GlobalNoteRecord): GlobalNoteRecord {
  return {
    ...record,
    relations: record.relations.map((relation) => ({ ...relation })),
    content: cloneContent(record.content),
    mentions: record.mentions.map((mention) => ({ ...mention })),
    attachments: record.attachments.map((attachment) => ({ ...attachment })),
    permissions: { ...record.permissions },
  };
}

function cloneContent(content: GlobalNoteRecord["content"]): GlobalNoteRecord["content"] {
  try {
    return JSON.parse(JSON.stringify(content)) as GlobalNoteRecord["content"];
  } catch (cause) {
    const detail = cause instanceof Error && cause.message ? ` ${cause.message}` : "";
    throw new Error(`Note content could not be serialized.${detail}`);
  }
}

function matchesRelation(note: GlobalNoteRecord, relation?: NoteRelationRef): boolean {
  return !relation || note.relations.some((item) => item.type === relation.type && item.id === relation.id);
}

function defaultStorage(): NotesStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch (cause) {
    return {
      getItem: () => { throw storageFailure("read", cause); },
      setItem: () => { throw storageFailure("write", cause); },
    };
  }
}

export function createLocalNotesAdapter(storage: NotesStorage | null = defaultStorage()): GlobalNotesAdapter {
  let memoryState: PersistedNotes = { version: STORAGE_VERSION, notes: [], seededIds: [] };
  const liveAttachmentUrls = new Map<string, string>();

  const read = () => {
    if (!storage) return memoryState;
    try {
      return parseState(storage.getItem(LOCAL_NOTES_STORAGE_KEY));
    } catch (cause) {
      if (cause instanceof Error && (
        cause.message === "Stored notes contain invalid JSON."
        || cause.message === "Stored notes do not match the supported local notes format."
      )) {
        throw cause;
      }
      throw storageFailure("read", cause);
    }
  };
  const write = (state: PersistedNotes) => {
    const durableState: PersistedNotes = {
      ...state,
      notes: state.notes.map((note) => ({
        ...cloneRecord(note),
        attachments: note.attachments.map((attachment) => ({
          ...attachment,
          url: attachment.url.startsWith("blob:") ? "" : attachment.url,
        })),
      })),
    };
    let serialized: string;
    try {
      serialized = JSON.stringify(durableState);
    } catch (cause) {
      throw storageFailure("write", cause);
    }
    if (!storage) {
      memoryState = durableState;
      return;
    }
    try {
      storage.setItem(LOCAL_NOTES_STORAGE_KEY, serialized);
    } catch (cause) {
      throw storageFailure("write", cause);
    }
  };
  const rememberAttachmentUrls = (attachments: readonly NoteAttachment[]) => {
    attachments.forEach((attachment) => {
      if (attachment.url.startsWith("blob:")) liveAttachmentUrls.set(attachment.id, attachment.url);
    });
  };
  const hydrate = (record: GlobalNoteRecord) => {
    const hydrated = cloneRecord(record);
    hydrated.attachments = hydrated.attachments.map((attachment) => ({
      ...attachment,
      url: liveAttachmentUrls.get(attachment.id) ?? attachment.url,
    }));
    return hydrated;
  };
  const release = (attachment: NoteAttachment) => {
    const url = liveAttachmentUrls.get(attachment.id);
    if (url) {
      URL.revokeObjectURL(url);
      liveAttachmentUrls.delete(attachment.id);
    }
  };

  return {
    async list(relation) {
      return read().notes
        .filter((note) => note.organizationId === organizationId && matchesRelation(note, relation))
        .map(hydrate);
    },
    async create(input) {
      if (input.organizationId !== organizationId) throw new Error("Notes can only be created in the active organization.");
      const state = read();
      const now = new Date().toISOString();
      const record: GlobalNoteRecord = {
        id: `local-note-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${state.notes.length + 1}`}`,
        organizationId: input.organizationId,
        authorId: input.authorId,
        authorName: input.authorName,
        title: input.title?.trim() ?? "",
        mode: input.mode,
        visibility: input.visibility,
        relations: input.relations.map((relation) => ({ ...relation })),
        content: cloneContent(input.content),
        plainTextPreview: input.plainTextPreview,
        mentions: input.mentions?.map((mention) => ({ ...mention })) ?? [],
        attachments: input.attachments?.map((attachment) => ({ ...attachment })) ?? [],
        createdAt: now,
        updatedAt: now,
        permissions: { canEdit: true, canDelete: true },
      };
      rememberAttachmentUrls(record.attachments);
      write({ ...state, notes: [record, ...state.notes] });
      return hydrate(record);
    },
    async update(noteId, input) {
      const state = read();
      const index = state.notes.findIndex((note) => note.id === noteId);
      if (index < 0) throw new Error("Note not found.");
      if (input.organizationId && input.organizationId !== organizationId) throw new Error("Notes cannot be moved to another organization.");
      const previous = state.notes[index];
      const attachments = input.attachments?.map((attachment) => ({ ...attachment })) ?? previous.attachments;
      previous.attachments
        .filter((attachment) => !attachments.some((item) => item.id === attachment.id))
        .forEach(release);
      rememberAttachmentUrls(attachments);
      const updated: GlobalNoteRecord = {
        ...previous,
        ...input,
        title: input.title?.trim() ?? previous.title,
        relations: input.relations?.map((relation) => ({ ...relation })) ?? previous.relations,
        content: input.content ? cloneContent(input.content) : previous.content,
        mentions: input.mentions?.map((mention) => ({ ...mention })) ?? previous.mentions,
        attachments,
        updatedAt: new Date().toISOString(),
      };
      state.notes[index] = updated;
      write(state);
      return hydrate(updated);
    },
    async delete(noteId) {
      const state = read();
      const index = state.notes.findIndex((note) => note.id === noteId);
      if (index < 0) throw new Error("Note not found.");
      state.notes[index].attachments.forEach(release);
      state.notes.splice(index, 1);
      write(state);
    },
    async seed(records) {
      const state = read();
      let changed = false;
      records.forEach((record) => {
        if (record.organizationId !== organizationId) return;
        if (!state.seededIds.includes(record.id)) {
          state.seededIds.push(record.id);
          if (!state.notes.some((note) => note.id === record.id)) state.notes.push(cloneRecord(record));
          changed = true;
        }
      });
      if (changed) write(state);
    },
    async uploadAttachment(file) {
      const allowed = ["image/", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument"];
      if (!allowed.some((prefix) => file.type.startsWith(prefix))) throw new Error("This file type is not supported.");
      if (file.size > 10 * 1024 * 1024) throw new Error("Attachments must be 10 MB or smaller.");
      if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
        throw new Error("Local attachment previews are unavailable in this browser.");
      }
      const attachment: NoteAttachment = {
        id: `local-attachment-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        url: URL.createObjectURL(file),
        status: "uploaded",
      };
      rememberAttachmentUrls([attachment]);
      return attachment;
    },
    releaseAttachment: release,
    async listWorkspaceUsers(requestedOrganizationId) {
      return users.filter((user) => user.organizationId === requestedOrganizationId);
    },
  };
}

export const localNotesAdapter = createLocalNotesAdapter();
