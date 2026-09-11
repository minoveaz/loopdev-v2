import { localPlatformAdapter, isScopeVisible, type EntityScope } from "@/loopdev/domains/platform";
import type { CreateFileMetadataInput, FileListParams, FileRecord, FilePreviewSource, FileRelation, FileVersion, FilesAdapter, ReplaceFileVersionInput, UpdateFileMetadataInput } from "../types";
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
    async updateMetadata(input: UpdateFileMetadataInput) {
      const records = read();
      const index = records.findIndex((record) => record.id === input.id);
      if (index < 0) throw new Error("File not found.");
      const record = records[index];
      if (record.currentVersion !== input.expectedVersion) throw new Error("File has changed; refresh before retrying.");
      assertScope(record.scope, "work.write");
      if (input.relation && !isScopeVisible(input.relation.scope, record.scope)) throw new Error("The file relation does not match its scope.");
      const updated = {
        ...record,
        fileName: input.fileName?.trim() || record.fileName,
        category: input.category ?? record.category,
        source: input.source ?? record.source,
        relation: input.relation ? { ...input.relation, scope: { ...input.relation.scope } } : record.relation,
        currentVersion: record.currentVersion + 1,
        updatedAt: new Date().toISOString(),
      };
      records[index] = updated;
      write(records);
      return clone(updated);
    },
    async archive(id: string, expectedVersion: number) {
      const records = read();
      const index = records.findIndex((record) => record.id === id);
      if (index < 0) throw new Error("File not found.");
      const record = records[index];
      if (record.currentVersion !== expectedVersion) throw new Error("File has changed; refresh before retrying.");
      assertScope(record.scope, "work.write");
      const archived = { ...record, status: "archived" as const, archivedAt: new Date().toISOString(), currentVersion: record.currentVersion + 1, updatedAt: new Date().toISOString() };
      records[index] = archived;
      write(records);
      return clone(archived);
    },
    async restore(id: string, expectedVersion: number) {
      const records = read();
      const index = records.findIndex((record) => record.id === id);
      if (index < 0) throw new Error("File not found.");
      const record = records[index];
      if (record.currentVersion !== expectedVersion) throw new Error("File has changed; refresh before retrying.");
      assertScope(record.scope, "work.write");
      const restored = { ...record, status: "ready" as const, archivedAt: null, deletedAt: null, currentVersion: record.currentVersion + 1, updatedAt: new Date().toISOString() };
      records[index] = restored;
      write(records);
      return clone(restored);
    },
    async replaceVersion(input: ReplaceFileVersionInput) {
      const records = read();
      const index = records.findIndex((record) => record.id === input.id);
      if (index < 0) throw new Error("File not found.");
      const record = records[index];
      if (record.currentVersion !== input.expectedVersion) throw new Error("File has changed; refresh before retrying.");
      assertScope(record.scope, "work.write");
      const now = new Date().toISOString();
      const nextVersion = record.versions.length + 1;
      const version: FileVersion = { id: `${record.id}-v${nextVersion}`, fileId: record.id, version: nextVersion, fileName: input.fileName ?? record.fileName, mimeType: input.mimeType ?? record.mimeType, byteSize: input.byteSize ?? record.byteSize, checksum: input.checksum ?? null, storageKey: null, createdById: localPlatformAdapter.getOrganizationContext().userId, createdAt: now };
      const replaced = { ...record, fileName: version.fileName, mimeType: version.mimeType, byteSize: version.byteSize, status: "ready" as const, versions: [...record.versions, version], currentVersion: record.currentVersion + 1, updatedAt: now };
      records[index] = replaced;
      write(records);
      return clone(replaced);
    },
    async relate(id: string, relation: FileRelation, expectedVersion: number) {
      return this.updateMetadata({ id, expectedVersion, relation });
    },
    async unrelate(id: string, expectedVersion: number) {
      const records = read();
      const index = records.findIndex((record) => record.id === id);
      if (index < 0) throw new Error("File not found.");
      const record = records[index];
      if (record.currentVersion !== expectedVersion) throw new Error("File has changed; refresh before retrying.");
      assertScope(record.scope, "work.write");
      const unrelated = { ...record, relation: { entityType: "unlinked", entityId: record.id, scope: { ...record.scope } }, currentVersion: record.currentVersion + 1, updatedAt: new Date().toISOString() };
      records[index] = unrelated;
      write(records);
      return clone(unrelated);
    },
    async getPreviewSource(id: string): Promise<FilePreviewSource | null> {
      const record = read().find((candidate) => candidate.id === id);
      if (!record) throw new Error("File not found.");
      assertScope(record.scope, "work.read");
      return { url: null, mimeType: record.mimeType };
    },
  };
}

export const localFilesAdapter = createLocalFilesAdapter();
