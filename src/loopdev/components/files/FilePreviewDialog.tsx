import { useEffect, useState } from "react";
import { ExternalLink, FileText, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/formatters";
import type { FileRecord } from "@/loopdev/domains/files";

export interface FilePreviewDialogProps {
  file: FileRecord | null;
  localFile?: File;
  previewUrl?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
}

export function FilePreviewDialog({ file, localFile, previewUrl: providedPreviewUrl, open, onOpenChange, onDelete }: FilePreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(providedPreviewUrl ?? null);
  const isImage = file?.mimeType.startsWith("image/") ?? false;
  const isPdf = file?.mimeType === "application/pdf";

  useEffect(() => {
    if (providedPreviewUrl) {
      setPreviewUrl(providedPreviewUrl);
      return;
    }
    if (!localFile || !isImage && !isPdf) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(localFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [isImage, isPdf, localFile, providedPreviewUrl]);

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            <span className="truncate">{file.fileName}</span>
          </DialogTitle>
          <DialogDescription>
            {file.category} · {file.byteSize.toLocaleString()} bytes · Uploaded {formatDate(file.createdAt)}
          </DialogDescription>
        </DialogHeader>

        {previewUrl && isImage ? (
          <div className="flex min-h-[22rem] items-center justify-center overflow-auto rounded-lg border bg-muted/30 p-4">
            <img src={previewUrl} alt={file.fileName} className="max-h-[60vh] max-w-full object-contain" />
          </div>
        ) : previewUrl && isPdf ? (
          <iframe title={`Preview of ${file.fileName}`} src={previewUrl} className="h-[60vh] w-full rounded-lg border bg-background" />
        ) : (
          <div className="flex min-h-[22rem] items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Preview is not available for this document in the current local session.
          </div>
        )}

        <DialogFooter className="justify-between sm:justify-between">
          <div>
            {onDelete && (
              <Button type="button" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={onDelete}>
                <Trash2 className="mr-1.5 h-4 w-4" />Delete
              </Button>
            )}
          </div>
          {previewUrl && (
            <Button type="button" variant="outline" asChild>
              <a href={previewUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />Open in tab
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
