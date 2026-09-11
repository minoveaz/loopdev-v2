import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdaptiveContextMenu } from "@/components/common";

describe("AdaptiveContextMenu", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens desktop actions from the context menu", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "(max-width: 767px)",
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    } as MediaQueryList);
    const onSelect = vi.fn();

    render(
      <AdaptiveContextMenu
        trigger={<button type="button">Message</button>}
        actions={[{ id: "copy", label: "Copy", onSelect }]}
      />,
    );

    fireEvent.contextMenu(screen.getByRole("button", { name: "Message" }));
    expect(await screen.findByRole("menuitem", { name: "Copy" })).toBeVisible();
    fireEvent.click(screen.getByRole("menuitem", { name: "Copy" }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("opens mobile actions after a long press", async () => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(max-width: 767px)",
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    } as MediaQueryList);
    const onSelect = vi.fn();

    render(
      <AdaptiveContextMenu
        trigger={<button type="button">Message</button>}
        label="Message actions"
        actions={[{ id: "copy", label: "Copy", onSelect }]}
      />,
    );

    fireEvent.touchStart(screen.getByRole("button", { name: "Message" }));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole("heading", { name: "Message actions" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(onSelect).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
