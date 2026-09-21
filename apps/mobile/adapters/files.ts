export type FileCategory =
  | "identity"
  | "contracts"
  | "proposals"
  | "billing"
  | "communications"
  | "other";

export type FileSource = "upload" | "conversation" | "manager" | "generated" | "temporary";

export interface FileRecord {
  id: string;
  organizationId: string;
  name: string;
  category: FileCategory;
  source: FileSource;
  mediaType: string;
  size: number;
  status: "active" | "archived" | "deleted";
  relation: {
    entityType: "contact" | "lead" | "opportunity" | "task" | "note";
    entityId: string;
    label?: string;
  };
  createdAt: string;
  updatedAt: string;
  uri?: string;
}

const FILES_STORAGE_KEY = "loopdev_mobile_files_records";
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"]);
let memoryFiles: FileRecord[] = [];

function getStorage() {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
}

export const mobileFilesAdapter = {
  async listFiles(params: { organizationId?: string; relation?: { entityType: string; entityId: string } }): Promise<{ items: FileRecord[] }> {
    const storage = getStorage();
    const organizationId = params.organizationId;
    try {
      const raw = storage?.getItem(FILES_STORAGE_KEY);
      const items: FileRecord[] = raw ? JSON.parse(raw) : memoryFiles;
      const filtered = items.filter((file) => {
        if (file.status === "deleted") return false;
        if (organizationId && file.organizationId !== organizationId) return false;
        if (params.relation) {
          return (
            file.relation?.entityType === params.relation.entityType &&
            file.relation?.entityId === params.relation.entityId
          );
        }
        return true;
      });
      return { items: filtered };
    } catch (cause) {
      throw new Error(cause instanceof Error ? `Unable to read local files: ${cause.message}` : "Unable to read local files.");
    }
  },

  async createFile(input: {
    organizationId: string;
    name: string;
    category: FileCategory;
    source: FileSource;
    relation: { entityType: "contact" | "lead" | "opportunity" | "task" | "note"; entityId: string; label?: string };
    mediaType: string;
    size: number;
  }): Promise<FileRecord> {
    const storage = getStorage();
    if (!input.organizationId) throw new Error("An organization is required.");
    if (!input.name.trim()) throw new Error("A file name is required.");
    if (!Number.isFinite(input.size) || input.size < 0 || input.size > MAX_FILE_SIZE) {
      throw new Error("File size must be between 0 and 25 MB.");
    }
    if (input.mediaType && !ALLOWED_MEDIA_TYPES.has(input.mediaType)) {
      throw new Error("This file type is not supported.");
    }
    const now = new Date().toISOString();
    const record: FileRecord = {
      id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      organizationId: input.organizationId,
      name: input.name,
      category: input.category,
      source: input.source,
      mediaType: input.mediaType,
      size: input.size,
      status: "active",
      relation: input.relation,
      createdAt: now,
      updatedAt: now,
    };

    if (storage) {
      try {
        const raw = storage.getItem(FILES_STORAGE_KEY);
        const list: FileRecord[] = raw ? JSON.parse(raw) : [];
        list.unshift(record);
        storage.setItem(FILES_STORAGE_KEY, JSON.stringify(list));
      } catch (cause) {
        throw new Error(cause instanceof Error ? `Unable to persist local file: ${cause.message}` : "Unable to persist local file.");
      }
    } else {
      memoryFiles = [record, ...memoryFiles];
    }
    return record;
  },

  async deleteFile(fileId: string): Promise<void> {
    const storage = getStorage();
    try {
      const raw = storage?.getItem(FILES_STORAGE_KEY);
      const list: FileRecord[] = raw ? JSON.parse(raw) : memoryFiles;
      if (!list.some((file) => file.id === fileId)) throw new Error("File not found.");
      const updated = list.map((f) => (f.id === fileId ? { ...f, status: "deleted" as const } : f));
      if (storage) storage.setItem(FILES_STORAGE_KEY, JSON.stringify(updated));
      else memoryFiles = updated;
    } catch (cause) {
      throw new Error(cause instanceof Error ? `Unable to delete local file: ${cause.message}` : "Unable to delete local file.");
    }
  },
};
