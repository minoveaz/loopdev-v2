import { FileText } from "lucide-react";
import type { FileRecord } from "@/loopdev/domains/files";

export function FileList({ files, onSelect }: { files: FileRecord[]; onSelect?: (file: FileRecord) => void }) {
  return <ul className="space-y-2" aria-label="Files">{files.map((file) => <li key={file.id}><button type="button" className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left" onClick={() => onSelect?.(file)}><FileText className="h-5 w-5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{file.fileName}</span><span className="text-xs text-muted-foreground">{file.status}</span></button></li>)}</ul>;
}
