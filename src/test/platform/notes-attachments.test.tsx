import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformNotesPanel } from "@/loopdev/components/platform";
import type { EntityRef, NoteRecord } from "@/loopdev/domains/platform";

const scope = { organizationId: "local-development-organization", workspaceId: "local-workspace", brandId: null };
const relation: EntityRef<"contact"> = { entityType: "contact", entityId: "contact-notes-test", scope };
const note: NoteRecord = {
  id: "note-attachments-test",
  scope,
  createdById: "local-development-user",
  updatedById: "local-development-user",
  createdAt: "2026-09-12T08:00:00.000Z",
  updatedAt: "2026-09-12T08:00:00.000Z",
  version: 1,
  visibility: "team",
  permissions: { canRead: true, canEdit: true, canDelete: true, canAssign: false, canModerate: true },
  status: "active",
  relation,
  authorId: "local-development-user",
  body: "Existing note",
};

describe("platform notes attachments", () => {
  it("submits selected attachments with the note instead of uploading separately", async () => {
    const onCreate = vi.fn(() => Promise.resolve());
    const onAttachmentUpload = vi.fn(() => Promise.resolve());
    const file = new File(["attachment"], "context.txt", { type: "text/plain" });

    const { container } = render(
      <PlatformNotesPanel
        notes={[note]}
        relation={relation}
        onCreate={onCreate}
        onAttachmentUpload={onAttachmentUpload}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Add a note" }), { target: { value: "Context with attachment" } });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText("context.txt")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/ready/)).toBeInTheDocument(), { timeout: 3000 });
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Context with attachment", "team", [file]));
    expect(onAttachmentUpload).not.toHaveBeenCalled();
  });
});
