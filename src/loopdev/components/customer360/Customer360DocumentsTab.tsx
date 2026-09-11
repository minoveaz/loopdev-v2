import { useEffect, useMemo, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, Paperclip, Save, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import type { CRMContact } from "@/loopdev/domains/crm/adapter";
import { localPlatformAdapter } from "@/loopdev/domains/platform";
import { FilePreviewDialog, FilesDropzone } from "@/loopdev/components/files";
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [activePendingIndex, setActivePendingIndex] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<(typeof files)[number] | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dropzoneKey, setDropzoneKey] = useState(0);
  const [localFiles, setLocalFiles] = useState<Record<string, File>>({});
  const [previewTarget, setPreviewTarget] = useState<(typeof files)[number] | null>(null);
  const visibleFiles = files.filter((file) => file.status !== "deleted" && (category === "all" || file.category === category));
  const activePendingFile = pendingFiles[activePendingIndex] ?? null;
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!activePendingFile || (!activePendingFile.type.startsWith("image/") && activePendingFile.type !== "application/pdf")) {
      setActivePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(activePendingFile);
    setActivePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [activePendingFile]);

  const resetPending = () => {
    setPendingFiles([]);
    setActivePendingIndex(0);
    setReviewOpen(false);
    setDropzoneKey((value) => value + 1);
  };

  const handleFiles = (selected: File[]) => {
    if (!selected.length) return;
    setPendingFiles(selected);
    setActivePendingIndex(0);
    setReviewOpen(true);
  };

  const handleSave = async () => {
    if (!pendingFiles.length) return;
    setSaving(true);
    try {
      for (const file of pendingFiles) {
        const created = await createMetadata({
          scope,
          relation,
          fileName: file.name,
          mimeType: file.type,
          byteSize: file.size,
          category: "other",
          source: "upload",
        });
        setLocalFiles((current) => ({ ...current, [created.id]: file }));
      }
      resetPending();
      toast({ title: "Documents saved", description: `${pendingFiles.length} document${pendingFiles.length === 1 ? "" : "s"} added to this customer.` });
    } catch (cause) {
      toast({ title: "Unable to save documents", description: cause instanceof Error ? cause.message : "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <FilesDropzone
        key={dropzoneKey}
        acceptedTypes={["image/*", "application/pdf", "text/plain", "text/csv"]}
        maxSizeBytes={25 * 1024 * 1024}
        onOpenReady={onUploadTriggerReady}
        onFilesSelected={handleFiles}
        onValidationError={(errors) => toast({ title: "Document not accepted", description: errors.join(" "), variant: "destructive" })}
      />

      <Dialog open={reviewOpen} onOpenChange={(open) => {
        if (open) {
          setReviewOpen(true);
        } else if (pendingFiles.length && !saving) {
          setDiscardOpen(true);
        }
      }}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review document upload</DialogTitle>
            <DialogDescription>
              Review the selected file before saving it to this customer. Nothing is stored until you click Save documents.
            </DialogDescription>
          </DialogHeader>
          {activePendingFile && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((file, index) => (
                  <Button
                    key={`${file.name}-${file.lastModified}-${file.size}`}
                    type="button"
                    size="sm"
                    variant={index === activePendingIndex ? "default" : "outline"}
                    onClick={() => setActivePendingIndex(index)}
                  >
                    {file.name}
                  </Button>
                ))}
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="mb-3 flex items-center gap-2">
                  {activePendingFile.type.startsWith("image/") ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  <span className="min-w-0 truncate text-sm font-medium">{activePendingFile.name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(activePendingFile.size)} · Local preview</span>
                </div>
                {activePendingFile.type.startsWith("image/") ? (
                  <div className="flex min-h-[18rem] items-center justify-center overflow-auto rounded-md bg-background p-2">
                    {activePreviewUrl && <img src={activePreviewUrl} alt={activePendingFile.name} className="max-h-[55vh] max-w-full object-contain" />}
                  </div>
                ) : activePendingFile.type === "application/pdf" ? (
                  <iframe title={`Preview of ${activePendingFile.name}`} src={activePreviewUrl ?? undefined} className="h-[55vh] w-full rounded-md border border-border bg-background" />
                ) : (
                  <div className="flex min-h-[18rem] items-center justify-center rounded-md bg-background text-sm text-muted-foreground">
                    Preview is not available for this format.
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDiscardOpen(true)} disabled={saving}>
              <X className="mr-1.5 h-4 w-4" />Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              {saving ? "Saving…" : "Save documents"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard selected documents?"
        description="The local previews and selected files will be removed. They have not been saved to this customer."
        confirmLabel="Discard documents"
        cancelLabel="Keep reviewing"
        tone="destructive"
        onConfirm={() => {
          resetPending();
          setDiscardOpen(false);
          toast({ title: "Upload cancelled", description: "The selected documents were discarded." });
        }}
      />

      <div className="flex gap-1 overflow-x-auto rounded-md bg-card-muted p-1" role="tablist" aria-label="Document categories">
        {categories.map((item) => (
          <button key={item.value} type="button" role="tab" aria-selected={category === item.value} onClick={() => setCategory(item.value)} className={`shrink-0 rounded px-2.5 py-1.5 text-xs ${category === item.value ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
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
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setPreviewTarget(file)}>
                <p className="truncate text-sm font-medium">{file.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.byteSize)} · Uploaded {formatDate(file.createdAt)} · {sourceLabel(file.source)} · {file.status}
                </p>
              </button>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Delete ${file.fileName}`} onClick={() => setDeleteTarget(file)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <FilePreviewDialog
        file={previewTarget}
        localFile={previewTarget ? localFiles[previewTarget.id] : undefined}
        open={previewTarget !== null}
        onOpenChange={(open) => { if (!open) setPreviewTarget(null); }}
        onDelete={() => {
          if (previewTarget) setDeleteTarget(previewTarget);
          setPreviewTarget(null);
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}
        title={`Delete ${deleteTarget?.fileName ?? "this document"}?`}
        description="This document will be removed from the customer record."
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
