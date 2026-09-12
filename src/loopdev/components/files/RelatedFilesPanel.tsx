import { useMemo, useState } from "react";
import { FileList } from "./FileList";
import { FilePicker } from "./FilePicker";
import { FilePreviewDialog } from "./FilePreviewDialog";
import { localFilesAdapter, useFiles } from "@/loopdev/domains/files";
import type { FileRecord, FileRelation } from "@/loopdev/domains/files";

export function RelatedFilesPanel({ relation }: { relation: FileRelation }) {
  const params = useMemo(() => ({ scope: relation.scope, relation }), [relation]);
  const files = useFiles(params, localFilesAdapter);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FileRecord | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<FileRecord | null>(null);
  return (
    <section className="space-y-3 rounded-lg border border-border p-3" aria-label="Related files">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Files</h3>
        <FilePicker multiple onFilesSelected={(selectedFiles) => Promise.all(selectedFiles.map((file) => files.createMetadata({ scope: relation.scope, relation, fileName: file.name, mimeType: file.type, byteSize: file.size, file })))} />
      </div>
      {replaceTarget && <div className="rounded-md border border-primary/30 bg-primary/5 p-2 text-sm">Replacing <strong>{replaceTarget.fileName}</strong><FilePicker multiple={false} onFilesSelected={async (selectedFiles) => { const file = selectedFiles[0]; if (!file) return; await files.replaceVersion({ id: replaceTarget.id, expectedVersion: replaceTarget.currentVersion, file, fileName: file.name, mimeType: file.type, byteSize: file.size }); setReplaceTarget(null); }} /></div>}
      <input className="w-full rounded-md border border-border px-3 py-2 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files..." aria-label="Search related files" />
      <FileList files={files.files} query={query} onSelect={setSelected} onDelete={(file) => void files.remove(file.id, file.currentVersion)} onRetry={(file) => void files.replaceVersion({ id: file.id, expectedVersion: file.currentVersion })} onReplace={setReplaceTarget} />
      <FilePreviewDialog file={selected} open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }} onDelete={async () => { if (selected) { await files.remove(selected.id, selected.currentVersion); setSelected(null); } }} />
    </section>
  );
}
