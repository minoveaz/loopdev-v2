import { useState } from "react";
import { LockKeyhole, Pencil, Save, UsersRound } from "lucide-react";
import { ConfirmDialog, DataCard, NoteEditorDrawer, useFormLifecycle, type NoteEditorValue } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AttachmentRecord, EntityRef, NoteRecord, PlatformVisibility } from "@/loopdev/domains/platform";

export interface PlatformNotesPanelProps {
  notes: NoteRecord[];
  loading?: boolean;
  error?: string | null;
  forbidden?: boolean;
  relation?: EntityRef;
  onCreate?: (body: string, visibility: PlatformVisibility, attachments?: File[]) => Promise<unknown>;
  onUpdate?: (noteId: string, body: string, expectedVersion: number) => Promise<unknown>;
  onDelete?: (noteId: string, expectedVersion: number) => Promise<unknown>;
  onAttachmentUpload?: (file: File) => Promise<unknown>;
  attachments?: AttachmentRecord[];
}

export function PlatformNotesPanel({ notes, loading = false, error, forbidden = false, relation, onCreate, onUpdate, onDelete, onAttachmentUpload, attachments = [] }: PlatformNotesPanelProps) {
  const [visibility, setVisibility] = useState<PlatformVisibility>("team");
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [editPending, setEditPending] = useState(false);
  const [discardEditOpen, setDiscardEditOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteRecord | null>(null);
  const lifecycle = useFormLifecycle();

  const saveEdit = async (note: NoteRecord) => {
    if (!onUpdate || !editingBody.trim()) return;
    setEditPending(true);
    setFormError(null);
    try {
      await onUpdate(note.id, editingBody.trim(), note.version);
      setEditingId(null);
      lifecycle.markClean();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Unable to update note.");
    } finally {
      setEditPending(false);
    }
  };

  return (
    <>
    <DataCard
      title={`Notes (${notes.length})`}
      description="Contextual notes with explicit visibility"
      action={onCreate && relation ? <Button type="button" size="sm" onClick={() => { setSelectedNote(null); setEditorOpen(true); }}>Add note</Button> : undefined}
      loading={loading}
      error={forbidden ? "Notes are not available in this scope." : error}
      empty={!loading && !error && !forbidden && notes.length === 0}
      emptyIcon={LockKeyhole}
      emptyTitle="No notes yet"
      emptyDescription="Notes remain behind the Platform permission boundary."
    >
      <ul className="space-y-2" aria-label="Notes">
        {notes.map((note) => (
          <li key={note.id} className="rounded-lg border border-border bg-card-muted/30 p-3">
            {editingId === note.id ? (
              <div className="space-y-2">
                <Textarea aria-label={`Edit ${note.body.slice(0, 24)}`} value={editingBody} onChange={(event) => { lifecycle.markDirty(); setEditingBody(event.target.value); }} disabled={editPending} />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => void saveEdit(note)} disabled={editPending}><Save className="mr-1.5 h-3.5 w-3.5" />Save</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { if (lifecycle.dirtyRef.current) setDiscardEditOpen(true); else setEditingId(null); }} disabled={editPending}>Cancel</Button>
                </div>
              </div>
            ) : <button type="button" className="w-full text-left" onClick={() => { if (onUpdate && note.permissions.canEdit) { setSelectedNote(note); setEditorOpen(true); } }}><p className="whitespace-pre-wrap text-sm">{note.body}</p></button>}
            {attachments.filter((attachment) => attachment.relation.entityType === "note" && attachment.relation.entityId === note.id).map((attachment) => (
              <p key={attachment.id} className="mt-2 text-xs text-muted-foreground">{attachment.fileName} · {attachment.attachmentStatus}</p>
            ))}
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              {note.visibility === "private" ? <LockKeyhole className="h-3 w-3" /> : <UsersRound className="h-3 w-3" />}
              {note.visibility} · {new Date(note.updatedAt).toLocaleDateString()}
              {onUpdate && note.permissions.canEdit && <Button type="button" size="sm" variant="ghost" className="ml-auto h-7 px-2" onClick={() => { setSelectedNote(note); setEditorOpen(true); }}><Pencil className="mr-1 h-3 w-3" />Edit</Button>}
            </div>
          </li>
        ))}
      </ul>
    </DataCard>
      {formError && <p role="alert" className="mt-3 text-sm text-destructive">{formError}</p>}
      {relation && (onCreate || selectedNote) && (
        <NoteEditorDrawer
          open={editorOpen}
          onOpenChange={(open) => { setEditorOpen(open); if (!open) setSelectedNote(null); }}
          title={selectedNote ? "Edit note" : "New note"}
          relation={{ type: relation.entityType as "contact" | "lead" | "opportunity" | "task", id: relation.entityId, label: relation.entityId }}
          initialValue={selectedNote ? { plainTextPreview: selectedNote.body, visibility: selectedNote.visibility } : undefined}
          onSubmit={async (value: NoteEditorValue) => {
            setFormError(null);
            if (selectedNote && onUpdate) {
              await onUpdate(selectedNote.id, value.plainTextPreview, selectedNote.version);
            } else if (onCreate) {
              const files = value.attachments.filter((attachment) => attachment.file).map((attachment) => attachment.file as File);
              await onCreate(value.plainTextPreview, value.visibility, files);
            }
            setEditorOpen(false);
            setSelectedNote(null);
          }}
          onDelete={selectedNote?.permissions.canDelete && onDelete ? async () => { await onDelete(selectedNote.id, selectedNote.version); } : undefined}
        />
      )}
      <ConfirmDialog
        open={discardEditOpen}
        onOpenChange={setDiscardEditOpen}
        title="Discard note changes?"
        description="Your unsaved note changes will be lost."
        confirmLabel="Discard"
        tone="warning"
        onConfirm={() => {
          setDiscardEditOpen(false);
          setEditingId(null);
          lifecycle.markClean();
        }}
      />
    </>
  );
}
