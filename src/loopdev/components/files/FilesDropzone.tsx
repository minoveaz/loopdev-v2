import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import { FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { processLocalUpload, validateFile, type FileValidationOptions } from "@/loopdev/domains/files";

export type FilesDropzoneItem = {
  file: File;
  state: "queued" | "uploading" | "processing" | "ready" | "failed" | "cancelled" | "rejected";
  error?: string;
  progress?: number;
};

export interface FilesDropzoneProps extends FileValidationOptions {
  multiple?: boolean;
  maxFiles?: number;
  allowDuplicates?: boolean;
  disabled?: boolean;
  accept?: string;
  className?: string;
  onFilesSelected?: (files: File[]) => void;
  onValidationError?: (errors: string[]) => void;
  onOpenReady?: (open: () => void) => void;
}

export function FilesDropzone({
  multiple = true,
  maxFiles = 10,
  allowDuplicates = false,
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
  const controllers = useRef(new Map<File, AbortController>());
  const open = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  useEffect(() => {
    onOpenReady?.(open);
  }, [onOpenReady, open]);

  const select = (selected: File[]) => {
    const existing = queue;
    const remaining = Math.max(maxFiles - existing.length, 0);
    const candidates = (multiple ? selected : selected.slice(0, 1)).slice(0, remaining);
    const duplicate = (file: File) => existing.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified);
    const items = candidates.map((file) => {
      const result = validateFile(file, { acceptedTypes, maxSizeBytes });
      const isDuplicate = !allowDuplicates && duplicate(file);
      return { file, state: result.valid && !isDuplicate ? "ready" : "rejected", error: isDuplicate ? "Duplicate file." : result.error } as FilesDropzoneItem;
    });
    const limitError = selected.length > candidates.length ? `Maximum ${maxFiles} files allowed.` : undefined;
    setQueue((current) => multiple ? [...current, ...items] : items);
    const validItems = items.filter((item) => item.state === "ready");
    const valid = validItems.map((item) => item.file);
    const errors = items.flatMap((item) => item.error ? [item.error] : []);
    if (limitError) errors.push(limitError);
    if (validItems.length > 0) {
      void Promise.all(validItems.map(async (item) => {
        const controller = new AbortController();
        controllers.current.set(item.file, controller);
        try {
          await processLocalUpload(item.file, (progress) => {
            setQueue((current) => current.map((queued) => queued.file === item.file ? { ...queued, state: progress.state, progress: progress.progress } : queued));
          }, controller.signal);
          return item.file;
        } catch (cause) {
          const cancelled = cause instanceof DOMException && cause.name === "AbortError";
          setQueue((current) => current.map((queued) => queued.file === item.file ? { ...queued, state: cancelled ? "cancelled" : "failed", error: cancelled ? "Upload cancelled." : cause instanceof Error ? cause.message : "Upload failed." } : queued));
          return null;
        } finally {
          controllers.current.delete(item.file);
        }
      })).then((results) => {
        const ready = results.filter((file): file is File => file !== null);
        if (ready.length > 0) onFilesSelected?.(ready);
      });
    }
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
  const remove = (file: File) => {
    controllers.current.get(file)?.abort();
    controllers.current.delete(file);
    setQueue((current) => current.filter((item) => item.file !== file));
  };
  const retry = (file: File) => {
    setQueue((current) => current.map((item) => item.file === file ? { ...item, state: "queued", error: undefined, progress: 0 } : item));
    const controller = new AbortController();
    controllers.current.set(file, controller);
    void processLocalUpload(file, (progress) => {
      setQueue((current) => current.map((item) => item.file === file ? { ...item, state: progress.state, progress: progress.progress } : item));
    }, controller.signal).then(() => onFilesSelected?.([file])).catch((cause) => {
      const cancelled = cause instanceof DOMException && cause.name === "AbortError";
      setQueue((current) => current.map((item) => item.file === file ? { ...item, state: cancelled ? "cancelled" : "failed", error: cancelled ? "Upload cancelled." : "Upload failed." } : item));
    }).finally(() => controllers.current.delete(file));
  };

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
                {item.error ?? `${item.state}${item.progress === undefined ? "" : ` (${item.progress}%)`}`}
              </span>
              {(item.state === "failed" || item.state === "cancelled") && (
                <button type="button" className="text-xs text-primary" onClick={() => retry(item.file)}>Retry</button>
              )}
              {(item.state === "queued" || item.state === "uploading" || item.state === "processing") && (
                <button type="button" className="text-xs text-muted-foreground" onClick={() => controllers.current.get(item.file)?.abort()}>Cancel</button>
              )}
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
