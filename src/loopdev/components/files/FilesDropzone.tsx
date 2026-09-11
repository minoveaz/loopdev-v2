import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import { FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateFile, type FileValidationOptions } from "@/loopdev/domains/files";

export type FilesDropzoneItem = {
  file: File;
  state: "ready" | "rejected";
  error?: string;
};

export interface FilesDropzoneProps extends FileValidationOptions {
  multiple?: boolean;
  disabled?: boolean;
  accept?: string;
  className?: string;
  onFilesSelected?: (files: File[]) => void;
  onValidationError?: (errors: string[]) => void;
  onOpenReady?: (open: () => void) => void;
}

export function FilesDropzone({
  multiple = true,
  disabled = false,
  acceptedTypes,
  maxSizeBytes,
  accept,
  className,
  onFilesSelected,
  onValidationError,
  onOpenReady,
}: FilesDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<FilesDropzoneItem[]>([]);
  const open = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  useEffect(() => {
    onOpenReady?.(open);
  }, [onOpenReady, open]);

  const select = (selected: File[]) => {
    const candidates = multiple ? selected : selected.slice(0, 1);
    const items = candidates.map((file) => {
      const result = validateFile(file, { acceptedTypes, maxSizeBytes });
      return { file, state: result.valid ? "ready" : "rejected", error: result.error } as FilesDropzoneItem;
    });
    setQueue((current) => multiple ? [...current, ...items] : items);
    const valid = items.filter((item) => item.state === "ready").map((item) => item.file);
    const errors = items.flatMap((item) => item.error ? [item.error] : []);
    if (valid.length > 0) onFilesSelected?.(valid);
    if (errors.length > 0) onValidationError?.(errors);
  };
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    select(Array.from(event.target.files ?? []));
    event.target.value = "";
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) select(Array.from(event.dataTransfer.files));
  };
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
    const image = imageItem?.getAsFile();
    if (!image) return;
    event.preventDefault();
    const extension = image.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const pastedFile = new File([image], `screenshot-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`, { type: image.type });
    select([pastedFile]);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === "Enter" || event.key === " ") && !disabled) {
      event.preventDefault();
      inputRef.current?.click();
    }
  };
  const remove = (file: File) => setQueue((current) => current.filter((item) => item.file !== file));

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Upload files"
        onClick={open}
        onKeyDown={onKeyDown}
        onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={onDrop}
        onPaste={onPaste}
        className={cn(
          "rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragging ? "border-primary bg-primary/5" : "border-border",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          onChange={onChange}
        />
        <FileUp className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Drop files here or browse</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Drop, browse or paste an image with Cmd/Ctrl + V.
        </p>
      </div>
      {queue.length > 0 && (
        <ul aria-label="Upload queue" className="space-y-2">
          {queue.map((item) => (
            <li
              key={`${item.file.name}-${item.file.lastModified}-${item.file.size}`}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate">{item.file.name}</span>
              <span className={cn("shrink-0 text-xs", item.state === "rejected" ? "text-destructive" : "text-muted-foreground")}>
                {item.error ?? "Ready"}
              </span>
              <button
                type="button"
                className="shrink-0 rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Remove ${item.file.name}`}
                onClick={() => remove(item.file)}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
