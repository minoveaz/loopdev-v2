import { useState, type FormEvent } from "react";
import { LockKeyhole, Pencil, Plus, Save, UsersRound } from "lucide-react";
import { DataCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
}

export function PlatformNotesPanel({ notes, loading = false, error, forbidden = false, relation, onCreate, onUpdate }: PlatformNotesPanelProps) {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<PlatformVisibility>("team");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [editPending, setEditPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!onCreate || !body.trim()) {
      setFormError("Write a note before saving.");
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      await onCreate(body.trim(), visibility);
      setBody("");
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Unable to save note.");
    } finally {
      setPending(false);
    }
  };

  const saveEdit = async (note: NoteRecord) => {
    if (!onUpdate || !editingBody.trim()) return;
    setEditPending(true);
    setFormError(null);
    try {
      await onUpdate(note.id, editingBody.trim(), note.version);
      setEditingId(null);
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
                <Textarea aria-label={`Edit ${note.body.slice(0, 24)}`} value={editingBody} onChange={(event) => setEditingBody(event.target.value)} disabled={editPending} />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => void saveEdit(note)} disabled={editPending}><Save className="mr-1.5 h-3.5 w-3.5" />Save</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={editPending}>Cancel</Button>
                </div>
              </div>
            ) : <p className="whitespace-pre-wrap text-sm">{note.body}</p>}
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              {note.visibility === "private" ? <LockKeyhole className="h-3 w-3" /> : <UsersRound className="h-3 w-3" />}
              {note.visibility} · {new Date(note.updatedAt).toLocaleDateString()}
              {onUpdate && note.permissions.canEdit && editingId !== note.id && <Button type="button" size="sm" variant="ghost" className="ml-auto h-7 px-2" onClick={() => { setEditingId(note.id); setEditingBody(note.body); }}><Pencil className="mr-1 h-3 w-3" />Edit</Button>}
            </div>
          </li>
        ))}
      </ul>
      {formError && !onCreate && <p role="alert" className="mt-3 text-sm text-destructive">{formError}</p>}
      {relation && onCreate && (
        <form onSubmit={submit} className="mt-4 space-y-3 border-t border-border pt-4" aria-label="Add note">
          <Label htmlFor="platform-note-body">Add a note</Label>
          <Textarea id="platform-note-body" value={body} onChange={(event) => setBody(event.target.value)} disabled={pending} />
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="platform-note-visibility" className="text-xs">Visibility</Label>
              <select id="platform-note-visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as PlatformVisibility)} className="h-9 rounded-lg border border-input bg-card px-2 text-sm">
                <option value="private">Private</option>
                <option value="team">Team</option>
                <option value="organization">Organization</option>
              </select>
            </div>
            <Button type="submit" size="sm" disabled={pending}><Plus className="mr-1.5 h-3.5 w-3.5" />{pending ? "Saving…" : "Add note"}</Button>
          </div>
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
        </form>
      )}
    </DataCard>
  );
}
