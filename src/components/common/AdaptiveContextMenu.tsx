import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  onSelect: () => void | Promise<void>;
}

export interface ContextMenuSeparatorAction {
  id: string;
  type: "separator";
}

export type AdaptiveContextMenuAction = ContextMenuAction | ContextMenuSeparatorAction;

interface AdaptiveContextMenuProps {
  trigger: ReactElement;
  actions: AdaptiveContextMenuAction[];
  label?: string;
  description?: string;
  className?: string;
  mobileLongPressMs?: number;
  disabled?: boolean;
}

function isSeparator(action: AdaptiveContextMenuAction): action is ContextMenuSeparatorAction {
  return "type" in action && action.type === "separator";
}

function runAction(action: ContextMenuAction): void {
  void action.onSelect();
}

export function AdaptiveContextMenu({
  trigger,
  actions,
  label = "Actions",
  description = "Choose an action for this item.",
  className,
  mobileLongPressMs = 500,
  disabled = false,
}: AdaptiveContextMenuProps) {
  const [mobile, setMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  if (disabled) return trigger;

  if (!mobile) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{trigger}</ContextMenuTrigger>
        <ContextMenuContent className={className}>
          <ContextMenuLabel>{label}</ContextMenuLabel>
          {actions.map((action) => isSeparator(action) ? (
            <ContextMenuSeparator key={action.id} />
          ) : (
            <ContextMenuItem
              key={action.id}
              disabled={action.disabled}
              className={cn(action.destructive && "text-destructive focus:text-destructive")}
              onSelect={() => runAction(action)}
            >
              {action.icon}
              <span>{action.label}</span>
              {action.shortcut && <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <>
      <div
        className="contents"
        onContextMenu={(event) => event.preventDefault()}
        onTouchStart={() => {
          cancelLongPress();
          longPressTimer.current = setTimeout(() => {
            suppressClick.current = true;
            setDrawerOpen(true);
          }, mobileLongPressMs);
        }}
        onTouchMove={cancelLongPress}
        onTouchEnd={cancelLongPress}
        onTouchCancel={cancelLongPress}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }}
      >
        {trigger}
      </div>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader className="text-start">
            <DrawerTitle>{label}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-1 px-4 pb-5">
            {actions.map((action) => isSeparator(action) ? (
              <div key={action.id} className="my-1 h-px bg-border" />
            ) : (
              <button
                key={action.id}
                type="button"
                disabled={action.disabled}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-start text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
                  action.destructive && "text-destructive",
                )}
                onClick={() => {
                  setDrawerOpen(false);
                  runAction(action);
                }}
              >
                {action.icon}
                <span className="flex-1">{action.label}</span>
                {action.shortcut && <span className="text-xs text-muted-foreground">{action.shortcut}</span>}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
