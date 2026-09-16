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
}

const FILES_STORAGE_KEY = "loopdev_mobile_files_records";

function getStorage() {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
}

export const mobileFilesAdapter = {
  async listFiles(params: { organizationId?: string; relation?: { entityType: string; entityId: string } }): Promise<{ items: FileRecord[] }> {
    const storage = getStorage();
    if (!storage) return { items: [] };
    try {
      const raw = storage.getItem(FILES_STORAGE_KEY);
      const items: FileRecord[] = raw ? JSON.parse(raw) : [];
      const filtered = items.filter((file) => {
        if (file.status === "deleted") return false;
        if (params.relation) {
          return (
            file.relation?.entityType === params.relation.entityType &&
            file.relation?.entityId === params.relation.entityId
          );
        }
        return true;
      });
      return { items: filtered };
    } catch {
      return { items: [] };
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
      } catch {
        // noop
      }
    }
    return record;
  },

  async deleteFile(fileId: string): Promise<void> {
    const storage = getStorage();
    if (!storage) return;
    try {
      const raw = storage.getItem(FILES_STORAGE_KEY);
      const list: FileRecord[] = raw ? JSON.parse(raw) : [];
      const updated = list.map((f) => (f.id === fileId ? { ...f, status: "deleted" as const } : f));
      storage.setItem(FILES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // noop
    }
  },
};
