import type { ReactNode, RefObject } from "react";
import { useCallback, useEffect, useState } from "react";
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

export type AppDrawerSize = "sm" | "md" | "lg" | "xl" | "2xl";
export interface AppDrawerRenderControls {
  requestClose: () => void;
}

export interface AppDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  mode?: ReactNode;
  headerMeta?: ReactNode;
  headerNav?: ReactNode;
  showDirtyState?: boolean;
  layoutMode?: "compact" | "standard" | "expanded";
  responsive?: "auto" | "fixed";
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
  xl: "sm:max-w-3xl",
  "2xl": "sm:max-w-4xl",
};

export function AppDrawer({
  open,
  onOpenChange,
  title,
  description,
  eyebrow,
  mode,
  headerMeta,
  headerNav,
  showDirtyState = false,
  layoutMode = "standard",
  responsive = "auto",
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
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

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
            "flex h-full !w-full max-w-none flex-col gap-0 !overflow-hidden p-0 md:w-[88%]",
            widthMap[size],
            className,
          )}
          style={{ overflow: "hidden" }}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          <SheetHeader className={cn("shrink-0 border-b border-border bg-card text-left sm:text-left", layoutMode === "compact" ? "space-y-1.5 px-4 py-3 sm:px-5 sm:py-4" : "space-y-2 px-4 py-3.5 sm:px-5 sm:py-4")}>
            <div className={cn("flex items-center justify-between pr-8", responsive === "auto" ? "gap-2 sm:gap-3" : "gap-3")}>
              <div className="flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80">
                {eyebrow ?? "LoopDev"}
                {mode && <span className="rounded-full border border-border bg-muted px-2 py-0.5 tracking-normal text-muted-foreground">{mode}</span>}
              </div>
              {(headerMeta || showDirtyState) && <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">{headerMeta}{showDirtyState && <span className="rounded-full border border-warning/30 bg-warning-soft px-2 py-1 font-medium text-warning">Unsaved changes</span>}</div>}
            </div>
            <SheetTitle className={cn("pr-8 font-display font-semibold tracking-tight", layoutMode === "compact" ? "text-lg" : "text-xl sm:text-2xl")}>{title}</SheetTitle>
            <SheetDescription className={description ? undefined : "sr-only"}>
              {description ?? "Contextual details"}
            </SheetDescription>
            {headerNav}
          </SheetHeader>
          <div data-app-drawer-scroll className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20", layoutMode === "compact" ? "px-4 py-4 sm:px-5 sm:py-5" : "px-4 py-4 sm:px-5 sm:py-5")}>{content}</div>
          {footer && (
            <SheetFooter className="shrink-0 border-t border-border bg-card-muted px-4 py-3 sm:px-5">
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
