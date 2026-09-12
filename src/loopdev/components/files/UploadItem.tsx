import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FilesDropzoneItem } from "./FilesDropzone";

export function UploadItem({ item, onRemove }: { item: FilesDropzoneItem; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
      <span className="min-w-0 flex-1 truncate">{item.file.name}</span>
      <span className={item.state === "rejected" ? "text-destructive" : "text-muted-foreground"}>{item.error ?? "Ready"}</span>
      {onRemove && <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.file.name}`} onClick={onRemove}><X className="h-4 w-4" /></Button>}
    </div>
  );
}
