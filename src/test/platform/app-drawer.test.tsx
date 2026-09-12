import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it } from "vitest";
import { AppDrawer } from "@/components/platform";

function TestDrawer({ dirty = false }: { dirty?: boolean }) {
  const [open, setOpen] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={triggerRef}>Open drawer</button>
      <AppDrawer
        open={open}
        onOpenChange={setOpen}
        title="Details"
        description="Drawer description"
        restoreFocusRef={triggerRef}
        dirty={dirty}
        confirmOnClose
      >
        <p>Drawer body</p>
      </AppDrawer>
    </>
  );
}

describe("AppDrawer", () => {
  it("starts closed when controlled and restores focus after closing", async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={triggerRef} onClick={() => setOpen(true)}>Open</button>
          <AppDrawer open={open} onOpenChange={setOpen} title="Details" restoreFocusRef={triggerRef}>
            <p>Body</p>
          </AppDrawer>
        </>
      );
    }

    render(<Controlled />);
    expect(screen.queryByRole("heading", { name: "Details" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("heading", { name: "Details" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open" })));
  });

  it("confirms a dirty close request", () => {
    render(<TestDrawer dirty />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByRole("heading", { name: "Discard changes?" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Drawer body")).toBeInTheDocument();
  });
});
