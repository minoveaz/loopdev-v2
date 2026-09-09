import type { ReactNode, RefObject } from "react";
import { useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type AppDrawerSize = "sm" | "md" | "lg";
export interface AppDrawerRenderControls {
  requestClose: () => void;
}

export interface AppDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode | ((controls: AppDrawerRenderControls) => ReactNode);
  footer?: ReactNode;
  side?: "right" | "left";
  size?: AppDrawerSize;
  className?: string;
  /** Element that should receive focus after the drawer closes. */
  restoreFocusRef?: RefObject<HTMLElement | null>;
  /** Called before the default focus restoration runs. */
  onCloseAutoFocus?: (event: Event) => void;
  /**
   * Whether a close request should be confirmed. A function is useful when
   * dirty state is held in a ref and should not cause a render.
   */
  dirty?: boolean | (() => boolean);
  confirmOnClose?: boolean;
  confirmTitle?: ReactNode;
  confirmDescription?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "default" | "destructive" | "warning";
  onDiscard?: () => void;
}

const widthMap: Record<AppDrawerSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
};

export function AppDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
  size = "md",
  className,
  restoreFocusRef,
  onCloseAutoFocus,
  dirty = false,
  confirmOnClose = false,
  confirmTitle = "Discard changes?",
  confirmDescription = "Your unsaved changes will be lost.",
  confirmLabel = "Discard",
  cancelLabel = "Cancel",
  confirmTone = "warning",
  onDiscard,
}: AppDrawerProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const requestClose = useCallback((nextOpen: boolean) => {
    const isDirty = typeof dirty === "function" ? dirty() : dirty;
    if (!nextOpen && confirmOnClose && isDirty) {
      setConfirmOpen(true);
      return;
    }
    onOpenChange(nextOpen);
  }, [confirmOnClose, dirty, onOpenChange]);

  const handleConfirmDiscard = useCallback(() => {
    setConfirmOpen(false);
    onDiscard?.();
    onOpenChange(false);
  }, [onDiscard, onOpenChange]);

  const handleCloseAutoFocus = useCallback((event: Event) => {
    onCloseAutoFocus?.(event);
    if (event.defaultPrevented) return;
    const target = restoreFocusRef?.current;
    if (!target?.isConnected) return;
    event.preventDefault();
    window.requestAnimationFrame(() => target.focus());
  }, [onCloseAutoFocus, restoreFocusRef]);
  const content = typeof children === "function"
    ? children({ requestClose: () => requestClose(false) })
    : children;

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent
          side={side}
          className={cn(
            "flex h-full w-full max-w-none flex-col gap-0 overflow-hidden p-0",
            widthMap[size],
            className,
          )}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          <SheetHeader className="shrink-0 space-y-1 border-b border-border px-5 py-4 text-left sm:text-left">
            <SheetTitle className="pr-8 font-display text-lg font-semibold tracking-tight">{title}</SheetTitle>
            <SheetDescription className={description ? undefined : "sr-only"}>
              {description ?? "Contextual details"}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{content}</div>
          {footer && (
            <SheetFooter className="shrink-0 border-t border-border bg-card-muted px-5 py-3">
              {footer}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        tone={confirmTone}
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
}

/** Compatibility name for callers that want to emphasize responsive behavior. */
export const ResponsiveDrawer = AppDrawer;
