import type { JSONContent } from "@tiptap/core";

export const NOTE_VISIBILITIES = ["private", "team", "organization"] as const;
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number];
export type NoteMode = "quick" | "rich";
export type NoteRelationType = "contact" | "conversation" | "lead" | "opportunity" | "task";

export interface NoteRelationRef {
  type: NoteRelationType;
  id: string;
  label: string;
}

export interface NoteMention {
  userId: string;
  displayName: string;
}

export interface NoteAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  status: "uploading" | "uploaded" | "error";
  error?: string;
}

export interface WorkspaceUser {
  id: string;
  displayName: string;
  email?: string;
  organizationId: string;
}

export interface GlobalNoteRecord {
  id: string;
  organizationId: string;
  authorId: string;
  authorName: string;
  title: string;
  mode: NoteMode;
  visibility: NoteVisibility;
  relations: NoteRelationRef[];
  content: JSONContent;
  plainTextPreview: string;
  mentions: NoteMention[];
  attachments: NoteAttachment[];
  createdAt: string;
  updatedAt: string;
  permissions: { canEdit: boolean; canDelete: boolean };
}

export interface CreateGlobalNoteInput {
  organizationId: string;
  authorId: string;
  authorName: string;
  title?: string;
  mode: NoteMode;
  visibility: NoteVisibility;
  relations: NoteRelationRef[];
  content: JSONContent;
  plainTextPreview: string;
  mentions?: NoteMention[];
  attachments?: NoteAttachment[];
}

export interface GlobalNotesAdapter {
  list(relation?: NoteRelationRef): Promise<GlobalNoteRecord[]>;
  create(input: CreateGlobalNoteInput): Promise<GlobalNoteRecord>;
  update(noteId: string, input: Partial<CreateGlobalNoteInput>): Promise<GlobalNoteRecord>;
  uploadAttachment(file: File): Promise<NoteAttachment>;
  listWorkspaceUsers(organizationId: string): Promise<WorkspaceUser[]>;
}
