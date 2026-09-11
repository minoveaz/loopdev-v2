import { useEffect, useMemo, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, Paperclip, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import type { CRMContact } from "@/loopdev/domains/crm/adapter";
import { localPlatformAdapter } from "@/loopdev/domains/platform";
import { FilesDropzone } from "@/loopdev/components/files";
import {
  type FileCategory,
  type FileSource,
  useFiles,
} from "@/loopdev/domains/files";

const categories: Array<{ value: FileCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "identity", label: "Identity" },
  { value: "contracts", label: "Contracts" },
  { value: "proposals", label: "Proposals" },
  { value: "billing", label: "Billing" },
  { value: "communications", label: "Communications" },
  { value: "other", label: "Other" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sourceLabel(source: FileSource) {
  return {
    upload: "Uploaded",
    conversation: "Shared in chat",
    manager: "Added by manager",
    generated: "Generated",
    temporary: "Temporary",
  }[source];
}

export function Customer360DocumentsTab({
  contact,
  onUploadTriggerReady,
}: {
  contact: CRMContact;
  onUploadTriggerReady?: (trigger: () => void) => void;
}) {
  const scope = useMemo(() => localPlatformAdapter.getScope(), []);
  const relation = useMemo(() => ({
    entityType: "contact",
    entityId: contact.id,
    scope,
    label: `${contact.firstName} ${contact.lastName ?? ""}`.trim(),
  }), [contact.firstName, contact.id, contact.lastName, scope]);
  const request = useMemo(() => ({ scope, relation }), [relation, scope]);
  const { files, loading, error, createMetadata, remove } = useFiles(request);
  const [category, setCategory] = useState<FileCategory | "all">("all");
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(typeof files)[number] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const visibleFiles = files.filter((file) => file.status !== "deleted" && (category === "all" || file.category === category));

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const handleFiles = async (selected: File[]) => {
    for (const file of selected) {
      await createMetadata({
        scope,
        relation,
        fileName: file.name,
        mimeType: file.type,
        byteSize: file.size,
        category: "other",
        source: "upload",
      });
    }
    const first = selected[0];
    if (first && (first.type.startsWith("image/") || first.type === "application/pdf")) {
      if (preview) URL.revokeObjectURL(preview.url);
      setPreview({ file: first, url: URL.createObjectURL(first) });
    }
  };

  return (
    <div className="space-y-5">
      <FilesDropzone
        acceptedTypes={["image/*", "application/pdf", "text/plain", "text/csv"]}
        maxSizeBytes={25 * 1024 * 1024}
        onOpenReady={onUploadTriggerReady}
        onFilesSelected={(selected) => void handleFiles(selected)}
      />

      {preview && (
        <div className="rounded-lg border border-border bg-card-muted/30 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {preview.file.type.startsWith("image/") ? <ImageIcon className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
              <span className="truncate text-sm font-medium">{preview.file.name}</span>
              <span className="text-xs text-muted-foreground">Local preview</span>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPreview(null)} aria-label="Close preview">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {preview.file.type.startsWith("image/") ? (
            <img src={preview.url} alt="" className="max-h-56 w-full rounded-md object-contain" />
          ) : (
            <iframe title={`Preview of ${preview.file.name}`} src={preview.url} className="h-56 w-full rounded-md border border-border" />
          )}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-md bg-card-muted p-1" role="tablist" aria-label="Document categories">
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={category === item.value}
            onClick={() => setCategory(item.value)}
            className={`shrink-0 rounded px-2.5 py-1.5 text-xs ${category === item.value ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading documents...</div>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && visibleFiles.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Paperclip className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">No documents in this category</p>
          <p className="mt-1 text-xs text-muted-foreground">Upload a document or save one from a conversation.</p>
        </div>
      )}
      {visibleFiles.length > 0 && (
        <ul className="space-y-2" aria-label="Customer documents">
          {visibleFiles.map((file) => (
            <li key={file.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.byteSize)} · Uploaded {formatDate(file.createdAt)} · {sourceLabel(file.source)} · {file.status}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${file.fileName}`}
                onClick={() => setDeleteTarget(file)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}
        title={`Delete ${deleteTarget?.fileName ?? "this document"}?`}
        description="This document will be removed from the customer record. The action is logical and can be audited by the storage adapter."
        confirmLabel="Delete document"
        cancelLabel="Keep document"
        tone="destructive"
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await remove(deleteTarget.id, deleteTarget.currentVersion);
            setDeleteTarget(null);
            toast({ title: "Document deleted", description: `${deleteTarget.fileName} was removed from this customer.` });
          } catch (cause) {
            toast({ title: "Unable to delete document", description: cause instanceof Error ? cause.message : "Please try again.", variant: "destructive" });
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
