import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { AlignCenter, AlignLeft, AlignRight, AtSign, Bold, CheckSquare, Highlighter, Italic, Link2, List, ListOrdered, Paperclip, Quote, Redo2, Send, Undo2, Underline as UnderlineIcon, X } from "lucide-react";
import { AppDrawer } from "@/components/platform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { notesAdapter, noteMentions, notePlainText, type CreateGlobalNoteInput, type NoteAttachment, type NoteMention, type NoteMode, type NoteRelationRef, type NoteVisibility, type WorkspaceUser } from "@/loopdev/domains/notes";

function mentionSuggestion(users: WorkspaceUser[]) {
  return {
    items: ({ query }: { query: string }) => users.filter((user) => user.displayName.toLowerCase().includes(query.toLowerCase())).slice(0, 5),
    render: () => {
      let element: HTMLDivElement | null = null;
      let selectedIndex = 0;
      let currentItems: WorkspaceUser[] = [];
      let currentCommand: ((item: { id: string; label: string }) => void) | null = null;
      const remove = () => { element?.remove(); element = null; };
      const renderItems = (props: { items: WorkspaceUser[]; command: (item: { id: string; label: string }) => void }) => {
        currentItems = props.items;
        currentCommand = props.command;
        if (!element) {
          element = document.createElement("div");
          element.className = "fixed z-[100] min-w-48 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg";
          document.body.appendChild(element);
        }
        element.innerHTML = "";
        props.items.forEach((user, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `block w-full rounded-md px-3 py-2 text-left text-sm ${index === selectedIndex ? "bg-muted" : ""}`;
          button.textContent = `${user.displayName}${user.email ? ` · ${user.email}` : ""}`;
          button.onclick = () => props.command({ id: user.id, label: user.displayName });
          element?.appendChild(button);
        });
      };
      return {
        onStart: (props: { items: WorkspaceUser[]; command: (item: { id: string; label: string }) => void; clientRect?: (() => DOMRect | null) | null }) => {
          selectedIndex = 0;
          renderItems(props);
          const rect = props.clientRect?.();
          if (rect && element) { element.style.left = `${rect.left}px`; element.style.top = `${rect.bottom + 4}px`; }
        },
        onUpdate: (props: { items: WorkspaceUser[]; command: (item: { id: string; label: string }) => void; clientRect?: (() => DOMRect | null) | null }) => {
          selectedIndex = 0;
          renderItems(props);
          const rect = props.clientRect?.();
          if (rect && element) { element.style.left = `${rect.left}px`; element.style.top = `${rect.bottom + 4}px`; }
        },
        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (props.event.key === "Escape") { remove(); return true; }
          if (!currentItems.length || !currentCommand) return false;
          if (props.event.key === "ArrowDown") { selectedIndex = (selectedIndex + 1) % currentItems.length; renderItems({ items: currentItems, command: currentCommand }); return true; }
          if (props.event.key === "ArrowUp") { selectedIndex = (selectedIndex + currentItems.length - 1) % currentItems.length; renderItems({ items: currentItems, command: currentCommand }); return true; }
          if (props.event.key === "Enter") { currentCommand({ id: currentItems[selectedIndex].id, label: currentItems[selectedIndex].displayName }); return true; }
          return false;
        },
        onExit: remove,
      };
    },
  };
}

export interface NoteEditorValue {
  title: string;
  mode: NoteMode;
  visibility: NoteVisibility;
  relations: NoteRelationRef[];
  content: CreateGlobalNoteInput["content"];
  plainTextPreview: string;
  mentions: NoteMention[];
  attachments: NoteAttachment[];
}

export interface RichNoteEditorProps {
  initialContent?: CreateGlobalNoteInput["content"];
  users?: WorkspaceUser[];
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: { content: CreateGlobalNoteInput["content"]; plainTextPreview: string; mentions: NoteMention[] }) => void;
}

export function RichNoteEditor({ initialContent, users = [], placeholder = "Write a rich note…", disabled, onChange }: RichNoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      Mention.configure({ HTMLAttributes: { class: "mention rounded bg-primary/10 px-1 text-primary" }, suggestion: mentionSuggestion(users) }),
    ],
    content: initialContent ?? { type: "doc", content: [{ type: "paragraph" }] },
    editable: !disabled,
    onUpdate: ({ editor: instance }) => onChange?.({ content: instance.getJSON(), plainTextPreview: notePlainText(instance.getJSON()), mentions: noteMentions(instance.getJSON()) }),
  }, [users]);

  useEffect(() => { editor?.setEditable(!disabled); }, [disabled, editor]);
  if (!editor) return <div className="min-h-40 animate-pulse rounded-md bg-muted/40" />;
  return <div className={cn("overflow-hidden rounded-lg border border-border bg-background", disabled && "opacity-60")}>
    <NoteToolbar editor={editor} disabled={disabled} />
    <EditorContent editor={editor} className="note-editor-content min-h-40 px-3 py-2 text-sm [&_.ProseMirror]:min-h-32 [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_ul]:ml-5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:ml-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_[data-type=taskList]]:ml-0 [&_.ProseMirror_[data-type=taskList]]:list-none [&_.ProseMirror_[data-type=taskList]_li]:flex [&_.ProseMirror_[data-type=taskList]_li]:items-start [&_.ProseMirror_[data-type=taskList]_li]:gap-2 [&_.ProseMirror_[data-type=taskList]_li>label]:mt-1 [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_mark[data-color]]:rounded [&_.ProseMirror_mark[data-color]]:px-0.5" />
  </div>;
}

function NoteToolbar({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const action = (run: () => void) => { if (!disabled) run(); };
  const blockType = editor.isActive("heading", { level: 1 }) ? "h1" : editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "paragraph";
  return <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-1.5">
    <Select value={blockType} onValueChange={(value) => action(() => { if (value === "paragraph") editor.chain().focus().setParagraph().run(); else editor.chain().focus().toggleHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 }).run(); })}>
      <SelectTrigger className="h-7 w-28 border-0 bg-transparent px-2 text-xs shadow-none" aria-label="Text style"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="paragraph">Paragraph</SelectItem><SelectItem value="h1">Heading 1</SelectItem><SelectItem value="h2">Heading 2</SelectItem><SelectItem value="h3">Heading 3</SelectItem></SelectContent>
    </Select>
    <Button type="button" variant={editor.isActive("bold") ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Bold" disabled={disabled} onClick={() => action(() => editor.chain().focus().toggleBold().run())}><Bold className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant={editor.isActive("italic") ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Italic" disabled={disabled} onClick={() => action(() => editor.chain().focus().toggleItalic().run())}><Italic className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant={editor.isActive("underline") ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Underline" disabled={disabled} onClick={() => action(() => editor.chain().focus().toggleUnderline().run())}><UnderlineIcon className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant={editor.isActive("bulletList") ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Bullet list" disabled={disabled} onClick={() => action(() => editor.chain().focus().toggleBulletList().run())}><List className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant={editor.isActive("orderedList") ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Numbered list" disabled={disabled} onClick={() => action(() => editor.chain().focus().toggleOrderedList().run())}><ListOrdered className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant={editor.isActive("taskList") ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Checklist" disabled={disabled} onClick={() => action(() => editor.chain().focus().toggleTaskList().run())}><CheckSquare className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant={editor.isActive("blockquote") ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Quote" disabled={disabled} onClick={() => action(() => editor.chain().focus().toggleBlockquote().run())}><Quote className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Align left" disabled={disabled} onClick={() => action(() => editor.chain().focus().setTextAlign("left").run())}><AlignLeft className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Align center" disabled={disabled} onClick={() => action(() => editor.chain().focus().setTextAlign("center").run())}><AlignCenter className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Align right" disabled={disabled} onClick={() => action(() => editor.chain().focus().setTextAlign("right").run())}><AlignRight className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant={editor.isActive("highlight") ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Highlight" disabled={disabled} onClick={() => action(() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run())}><Highlighter className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Add link" disabled={disabled} onClick={() => { const url = window.prompt("Link URL"); if (url) editor.chain().focus().setLink({ href: url }).run(); }}><Link2 className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Undo" disabled={disabled || !editor.can().undo()} onClick={() => action(() => editor.chain().focus().undo().run())}><Undo2 className="h-3.5 w-3.5" /></Button>
    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Redo" disabled={disabled || !editor.can().redo()} onClick={() => action(() => editor.chain().focus().redo().run())}><Redo2 className="h-3.5 w-3.5" /></Button>
    <span className="ml-auto flex items-center gap-1 px-1 text-[11px] text-muted-foreground"><AtSign className="h-3 w-3" />Mention teammates</span>
  </div>;
}

export interface NoteEditorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relation?: NoteRelationRef;
  initialValue?: Partial<NoteEditorValue>;
  title?: ReactNode;
  onSubmit: (value: NoteEditorValue) => Promise<void>;
  restoreFocusRef?: React.RefObject<HTMLElement | null>;
}

export function NoteEditorDrawer({ open, onOpenChange, relation, initialValue, title = "New note", onSubmit, restoreFocusRef }: NoteEditorDrawerProps) {
  const [mode, setMode] = useState<NoteMode>(initialValue?.mode ?? "quick");
  const [noteTitle, setNoteTitle] = useState(initialValue?.title ?? "");
  const [visibility, setVisibility] = useState<NoteVisibility>(initialValue?.visibility ?? "team");
  const [quickBody, setQuickBody] = useState(initialValue?.plainTextPreview ?? "");
  const [richValue, setRichValue] = useState({ content: initialValue?.content ?? { type: "doc", content: [{ type: "paragraph" }] }, plainTextPreview: initialValue?.plainTextPreview ?? "", mentions: initialValue?.mentions ?? [] });
  const [attachments, setAttachments] = useState<NoteAttachment[]>(initialValue?.attachments ?? []);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) void notesAdapter.listWorkspaceUsers("local-development-organization").then(setUsers); }, [open]);
  useEffect(() => {
    if (!open) return;
    setMode(initialValue?.mode ?? "quick"); setNoteTitle(initialValue?.title ?? ""); setVisibility(initialValue?.visibility ?? "team");
    setQuickBody(initialValue?.plainTextPreview ?? ""); setRichValue({ content: initialValue?.content ?? { type: "doc", content: [{ type: "paragraph" }] }, plainTextPreview: initialValue?.plainTextPreview ?? "", mentions: initialValue?.mentions ?? [] }); setAttachments(initialValue?.attachments ?? []); dirtyRef.current = false; setError(null);
  }, [open, initialValue]);

  const preview = mode === "quick" ? quickBody.trim() : richValue.plainTextPreview.trim();
  const content = mode === "quick" ? { type: "doc", content: quickBody.trim() ? [{ type: "paragraph", content: [{ type: "text", text: quickBody.trim() }] }] : [{ type: "paragraph" }] } : richValue.content;
  const mentions = mode === "quick" ? [] : richValue.mentions;
  const handleSubmit = async () => {
    if (!preview) { setError("Add some content before saving."); return; }
    setPending(true); setError(null);
    try { await onSubmit({ title: noteTitle.trim(), mode, visibility, relations: relation ? [relation] : [], content, plainTextPreview: preview, mentions, attachments }); dirtyRef.current = false; onOpenChange(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save note."); }
    finally { setPending(false); }
  };
  const upload = async (file: File) => {
    dirtyRef.current = true; setAttachments((current) => [...current, { id: `uploading-${Date.now()}`, name: file.name, mimeType: file.type, size: file.size, url: "", status: "uploading" }]);
    try { const uploaded = await notesAdapter.uploadAttachment(file); setAttachments((current) => current.map((item) => item.name === file.name && item.status === "uploading" ? uploaded : item)); }
    catch (cause) { setAttachments((current) => current.map((item) => item.name === file.name && item.status === "uploading" ? { ...item, status: "error", error: cause instanceof Error ? cause.message : "Upload failed." } : item)); }
  };
  const footer = <div className="flex w-full items-center justify-between gap-3"><p className="truncate text-xs text-muted-foreground">{relation ? `Related to ${relation.label}` : "Global workspace note"}</p><div className="flex gap-2"><Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" loading={pending} disabled={!preview || attachments.some((item) => item.status === "uploading")} onClick={() => void handleSubmit()}><Send className="h-3.5 w-3.5" />Save note</Button></div></div>;
  return <AppDrawer open={open} onOpenChange={onOpenChange} title={title} description="Capture context for your workspace" mode={title === "Edit note" ? "Editing" : "New"} size="md" responsive="auto" restoreFocusRef={restoreFocusRef} dirty={() => dirtyRef.current} confirmOnClose onDiscard={() => { dirtyRef.current = false; }} footer={footer}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5" role="tablist" aria-label="Note format"><button type="button" role="tab" aria-selected={mode === "quick"} className={cn("rounded px-3 py-1.5 text-xs", mode === "quick" && "bg-card font-medium shadow-sm")} onClick={() => { dirtyRef.current = true; setMode("quick"); }}>Quick note</button><button type="button" role="tab" aria-selected={mode === "rich"} className={cn("rounded px-3 py-1.5 text-xs", mode === "rich" && "bg-card font-medium shadow-sm")} onClick={() => { dirtyRef.current = true; setMode("rich"); }}>Rich note</button></div><div className="flex items-center gap-2"><Label htmlFor="note-visibility" className="text-xs text-muted-foreground">Visibility</Label><Select value={visibility} onValueChange={(value) => { dirtyRef.current = true; setVisibility(value as NoteVisibility); }}><SelectTrigger id="note-visibility" className="h-8 w-32"><SelectValue /></SelectTrigger><SelectContent>{(["private", "team", "organization"] as NoteVisibility[]).map((item) => <SelectItem key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</SelectItem>)}</SelectContent></Select></div></div>
      <div><Label htmlFor="note-title">Title <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="note-title" value={noteTitle} onChange={(event) => { dirtyRef.current = true; setNoteTitle(event.target.value); }} placeholder="Give this note a useful title" className="mt-1.5" /></div>
      {relation && <div className="rounded-md border border-border bg-card-muted/40 px-3 py-2 text-xs text-muted-foreground">Related to <span className="font-medium text-foreground">{relation.label}</span></div>}
      {mode === "quick" ? <Textarea value={quickBody} onChange={(event) => { dirtyRef.current = true; setQuickBody(event.target.value); }} placeholder="Write a quick note…" className="min-h-48 resize-y" aria-label="Note content" disabled={pending} /> : <RichNoteEditor initialContent={initialValue?.content} users={users} disabled={pending} onChange={(value) => { dirtyRef.current = true; setRichValue(value); }} />}
      <div className="space-y-2"><input ref={fileInputRef} type="file" className="hidden" multiple onChange={(event) => { const files = event.target.files; if (files) Array.from(files).forEach((file) => void upload(file)); event.currentTarget.value = ""; }} /><Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => fileInputRef.current?.click()}><Paperclip className="h-3.5 w-3.5" />Attach files</Button>{attachments.length > 0 && <ul className="space-y-1.5">{attachments.map((attachment) => <li key={attachment.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs">{attachment.url && attachment.mimeType.startsWith("image/") && <img src={attachment.url} alt="" className="h-8 w-8 rounded object-cover" /> }<span className="min-w-0 flex-1 truncate">{attachment.name}</span><span className={attachment.status === "error" ? "text-destructive" : "text-muted-foreground"}>{attachment.status === "uploading" ? "Uploading…" : attachment.status === "error" ? attachment.error : `${Math.ceil(attachment.size / 1024)} KB`}</span><button type="button" aria-label={`Remove ${attachment.name}`} onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}><X className="h-3.5 w-3.5" /></button></li>)}</ul>}</div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  </AppDrawer>;
}
