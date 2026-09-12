import { useState, type ReactNode } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { RichNoteEditor } from "./NoteEditorDrawer";
import { FilePicker } from "@/loopdev/components/files";

type NoteComposerMode = "quick" | "rich";

export interface NoteComposerProps {
  onSubmit: (body: string, mode: NoteComposerMode, attachments?: File[]) => Promise<void> | void;
  placeholder?: string;
  submitLabel?: string;
  compact?: boolean;
  disabled?: boolean;
  error?: string | null;
  footerContent?: ReactNode;
  className?: string;
  onAttachmentUpload?: (file: File) => Promise<unknown>;
}

export function NoteComposer({
  onSubmit,
  placeholder = "Write an internal note…",
  submitLabel = "Add note",
  compact = false,
  disabled = false,
  error,
  footerContent,
  className,
  onAttachmentUpload,
}: NoteComposerProps) {
  const [mode, setMode] = useState<NoteComposerMode>("quick");
  const [body, setBody] = useState("");
  const [richBody, setRichBody] = useState("");
  const [pending, setPending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const submit = async () => {
    const value = (mode === "quick" ? body : richBody).trim();
    if (!value || pending || disabled) return;
    setPending(true);
    try {
      if (attachments.length) await onSubmit(value, mode, attachments);
      else await onSubmit(value, mode);
      setBody("");
      setRichBody("");
      setAttachments([]);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5" role="tablist" aria-label="Note format">
          <button type="button" role="tab" aria-selected={mode === "quick"} onClick={() => setMode("quick")} className={cn("rounded px-2.5 py-1 text-xs transition-colors", mode === "quick" ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Quick note</button>
          <button type="button" role="tab" aria-selected={mode === "rich"} onClick={() => setMode("rich")} className={cn("rounded px-2.5 py-1 text-xs transition-colors", mode === "rich" ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Rich note</button>
        </div>
        {mode === "rich" && <span className="text-[11px] text-muted-foreground">Formatting tools</span>}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-background">
        {mode === "rich" ? (
          <RichNoteEditor
            disabled={disabled || pending}
            placeholder={placeholder}
            onChange={({ plainTextPreview }) => setRichBody(plainTextPreview)}
          />
        ) : <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={placeholder} disabled={disabled || pending} className={cn("resize-none rounded-none border-0 shadow-none focus-visible:ring-0", compact ? "min-h-20" : "min-h-28")} aria-label="Add a note" />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {footerContent}
          {onAttachmentUpload ? <FilePicker multiple={false} onFilesSelected={(files) => { const file = files[0]; if (file) void onAttachmentUpload(file); }} /> : <FilePicker multiple onFilesSelected={(files) => setAttachments((current) => [...current, ...files])} />}
        </div>
        <Button type="button" size="sm" onClick={() => void submit()} disabled={disabled || pending || !(mode === "quick" ? body.trim() : richBody.trim())}>
          <Send className="mr-1.5 h-3.5 w-3.5" />{pending ? "Saving…" : submitLabel}
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
