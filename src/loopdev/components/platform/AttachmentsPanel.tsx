import { useRef, type ChangeEvent } from "react";
import { FileUp, Paperclip } from "lucide-react";
import { DataCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import type { AttachmentRecord } from "@/loopdev/domains/platform";

export function PlatformAttachmentsPanel({
  attachments,
  loading = false,
  error,
  onUpload,
}: {
  attachments: AttachmentRecord[];
  loading?: boolean;
  error?: string | null;
  onUpload?: (file: { fileName: string; mimeType: string; byteSize: number }) => Promise<unknown>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) void onUpload({ fileName: file.name, mimeType: file.type, byteSize: file.size });
    event.target.value = "";
  };
  return (
    <DataCard title="Attachments" description="Local visual uploader; Storage remains a future adapter" loading={loading} error={error} empty={!loading && !error && attachments.length === 0} emptyIcon={Paperclip} emptyTitle="No attachments" emptyDescription="Attach a file to this CRM record when needed." action={onUpload ? <><input ref={inputRef} type="file" className="sr-only" onChange={selectFile} /><Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}><FileUp className="mr-1.5 h-3.5 w-3.5" />Upload</Button></> : undefined}>
      <ul className="space-y-2" aria-label="Attachments">{attachments.map((file) => <li key={file.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"><span className="truncate text-sm font-medium">{file.fileName}</span><span className="shrink-0 text-xs text-muted-foreground">{Math.ceil(file.byteSize / 1024)} KB · {file.attachmentStatus}</span></li>)}</ul>
    </DataCard>
  );
}
