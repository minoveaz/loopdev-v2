import { useCallback, useEffect, useState } from "react";
import { localFilesAdapter } from "../adapter";
import type { CreateFileMetadataInput, FileListParams, FileRecord, FilesAdapter, ReplaceFileVersionInput, UpdateFileMetadataInput, FileRelation } from "../types";

export function useFiles(params: FileListParams, adapter: FilesAdapter = localFilesAdapter) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void adapter.list(params)
      .then((next) => { if (active) setFiles(next); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load files.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [adapter, params, reloadToken]);

  const createMetadata = useCallback(async (input: CreateFileMetadataInput) => {
    const created = await adapter.createMetadata(input);
    setFiles((current) => [created, ...current]);
    return created;
  }, [adapter]);
  const remove = useCallback(async (id: string, expectedVersion: number) => {
    const removed = await adapter.remove(id, expectedVersion);
    setFiles((current) => current.map((file) => file.id === removed.id ? removed : file));
    return removed;
  }, [adapter]);
  const mutate = useCallback(async (action: (current: FilesAdapter) => Promise<FileRecord>) => {
    const updated = await action(adapter);
    setFiles((current) => current.map((file) => file.id === updated.id ? updated : file));
    return updated;
  }, [adapter]);

  return {
    files,
    loading,
    error,
    createMetadata,
    remove,
    updateMetadata: (input: UpdateFileMetadataInput) => mutate((current) => current.updateMetadata(input)),
    archive: (id: string, expectedVersion: number) => mutate((current) => current.archive(id, expectedVersion)),
    restore: (id: string, expectedVersion: number) => mutate((current) => current.restore(id, expectedVersion)),
    replaceVersion: (input: ReplaceFileVersionInput) => mutate((current) => current.replaceVersion(input)),
    relate: (id: string, relation: FileRelation, expectedVersion: number) => mutate((current) => current.relate(id, relation, expectedVersion)),
    unrelate: (id: string, expectedVersion: number) => mutate((current) => current.unrelate(id, expectedVersion)),
    reload: () => setReloadToken((value) => value + 1),
  };
}
