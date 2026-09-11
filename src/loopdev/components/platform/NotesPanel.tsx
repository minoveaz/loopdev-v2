import { useState } from "react";
import { LockKeyhole, Pencil, Save, UsersRound } from "lucide-react";
import { ConfirmDialog, DataCard, NoteComposer, useFormLifecycle } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EntityRef, NoteRecord, PlatformVisibility } from "@/loopdev/domains/platform";

export interface PlatformNotesPanelProps {
  notes: NoteRecord[];
  loading?: boolean;
  error?: string | null;
  forbidden?: boolean;
  relation?: EntityRef;
  onCreate?: (body: string, visibility: PlatformVisibility) => Promise<unknown>;
  onUpdate?: (noteId: string, body: string, expectedVersion: number) => Promise<unknown>;
  onAttachmentUpload?: (file: File) => Promise<unknown>;
}

export function PlatformNotesPanel({ notes, loading = false, error, forbidden = false, relation, onCreate, onUpdate, onAttachmentUpload }: PlatformNotesPanelProps) {
  const [visibility, setVisibility] = useState<PlatformVisibility>("team");
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [editPending, setEditPending] = useState(false);
  const [discardEditOpen, setDiscardEditOpen] = useState(false);
  const lifecycle = useFormLifecycle();

  const submit = async (body: string) => {
    if (!onCreate) return;
    setFormError(null);
    try {
      await onCreate(body.trim(), visibility);
      lifecycle.markClean();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Unable to save note.");
    }
  };

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
    <DataCard
      title={`Notes (${notes.length})`}
      description="Contextual notes with explicit visibility"
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
            ) : <p className="whitespace-pre-wrap text-sm">{note.body}</p>}
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              {note.visibility === "private" ? <LockKeyhole className="h-3 w-3" /> : <UsersRound className="h-3 w-3" />}
              {note.visibility} · {new Date(note.updatedAt).toLocaleDateString()}
              {onUpdate && note.permissions.canEdit && editingId !== note.id && <Button type="button" size="sm" variant="ghost" className="ml-auto h-7 px-2" onClick={() => { lifecycle.markClean(); setEditingId(note.id); setEditingBody(note.body); }}><Pencil className="mr-1 h-3 w-3" />Edit</Button>}
            </div>
          </li>
        ))}
      </ul>
      {formError && !onCreate && <p role="alert" className="mt-3 text-sm text-destructive">{formError}</p>}
      {relation && onCreate && (
        <div className="mt-4 border-t border-border pt-4" aria-label="Add note">
        <NoteComposer
          onSubmit={submit}
          compact
          error={formError}
          footerContent={(
            <div className="flex items-center gap-2">
              <Label htmlFor="platform-note-visibility" className="text-xs text-muted-foreground">Visibility</Label>
              <Select value={visibility} onValueChange={(value) => { lifecycle.markDirty(); setVisibility(value as PlatformVisibility); }}>
                <SelectTrigger id="platform-note-visibility" className="h-8 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          onAttachmentUpload={onAttachmentUpload}
        />
        </div>
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
    </DataCard>
  );
}
