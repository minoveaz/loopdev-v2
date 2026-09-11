import { localPlatformAdapter, isScopeVisible, type EntityScope } from "@/loopdev/domains/platform";
import type { CreateFileMetadataInput, FileListParams, FileRecord, FileVersion, FilesAdapter } from "../types";
import { FILES_LOCAL_STORAGE_KEY, localFilesDemoSeed } from "../data/localFiles";

type FileStorage = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): FileStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function clone(record: FileRecord): FileRecord {
  return {
    ...record,
    scope: { ...record.scope },
    relation: { ...record.relation, scope: { ...record.relation.scope } },
    versions: record.versions.map((version) => ({ ...version })),
    permissions: { ...record.permissions },
  };
}

function sameRelation(record: FileRecord, relation: FileListParams["relation"]): boolean {
  return !relation
    || (record.relation.entityType === relation.entityType && record.relation.entityId === relation.entityId);
}

export function createLocalFilesAdapter(storage: FileStorage | null = defaultStorage()): FilesAdapter {
  let memory: FileRecord[] = [];
  const read = (): FileRecord[] => {
    if (!storage) return memory;
    const raw = storage.getItem(FILES_LOCAL_STORAGE_KEY);
    if (!raw) return localFilesDemoSeed.map(clone);
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Stored files do not match the supported local files format.");
      const stored = parsed as FileRecord[];
      const storedIds = new Set(stored.map((record) => record.id));
      return [
        ...stored,
        ...localFilesDemoSeed.filter((record) => !storedIds.has(record.id)).map(clone),
      ];
    } catch (cause) {
      if (cause instanceof Error && cause.message.startsWith("Stored files")) throw cause;
      throw new Error("Stored files contain invalid JSON.");
    }
  };
  const write = (records: FileRecord[]) => {
    const serialized = JSON.stringify(records);
    if (storage) storage.setItem(FILES_LOCAL_STORAGE_KEY, serialized);
    else memory = records;
  };
  const assertScope = (scope: EntityScope, permission: "work.read" | "work.write") => {
    const active = localPlatformAdapter.getScope();
    if (!isScopeVisible(scope, active) || !localPlatformAdapter.hasPermission(permission, scope)) {
      throw new Error("You do not have permission for this file scope.");
    }
  };
  return {
    async list({ scope, relation }) {
      assertScope(scope, "work.read");
      if (relation && !isScopeVisible(relation.scope, scope)) {
        throw new Error("You do not have permission for this file scope.");
      }
      return read()
        .filter((record) => isScopeVisible(record.scope, scope) && sameRelation(record, relation))
        .map(clone);
    },
    async createMetadata(input: CreateFileMetadataInput) {
      assertScope(input.scope, "work.write");
      if (!isScopeVisible(input.relation.scope, input.scope)) {
        throw new Error("The file relation does not match its scope.");
      }
      if (!input.fileName.trim()) throw new Error("A file name is required.");
      if (!Number.isFinite(input.byteSize) || input.byteSize < 0) {
        throw new Error("File size must be a non-negative number.");
      }
      const now = new Date().toISOString();
      const existing = read();
      const id = `local-file-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${existing.length + 1}`}`;
      const version: FileVersion = {
        id: `${id}-v1`,
        fileId: id,
        version: 1,
        fileName: input.fileName,
        mimeType: input.mimeType || "application/octet-stream",
        byteSize: input.byteSize,
        checksum: null,
        storageKey: null,
        createdById: input.uploadedById ?? localPlatformAdapter.getOrganizationContext().userId,
        createdAt: now,
      };
      const record: FileRecord = {
        id,
        scope: { ...input.scope },
        relation: { ...input.relation, scope: { ...input.relation.scope } },
        fileName: version.fileName,
        mimeType: version.mimeType,
        byteSize: version.byteSize,
        status: "pending",
        category: input.category ?? "other",
        source: input.source ?? "upload",
        sourceMetadata: input.sourceMetadata,
        currentVersion: 1,
        versions: [version],
        uploadedById: version.createdById,
        createdAt: now,
        updatedAt: now,
        permissions: { canRead: true, canEdit: true, canDelete: true, canAssign: false, canModerate: false },
      };
      write([record, ...existing]);
      return clone(record);
    },
    async remove(id: string, expectedVersion: number) {
      const records = read();
      const index = records.findIndex((record) => record.id === id);
      if (index < 0) throw new Error("File not found.");
      const record = records[index];
      if (record.currentVersion !== expectedVersion) {
        throw new Error("File has changed; refresh before retrying.");
      }
      assertScope(record.scope, "work.write");
      const updated: FileRecord = {
        ...record,
        status: "deleted",
        currentVersion: record.currentVersion + 1,
        updatedAt: new Date().toISOString(),
      };
      records[index] = updated;
      write(records);
      return clone(updated);
    },
  };
}

export const localFilesAdapter = createLocalFilesAdapter();
