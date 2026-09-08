import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Optional banner content (e.g. avatar + name) shown under the title. */
  hero?: ReactNode;
  /** Sticky footer actions area. */
  footer?: ReactNode;
  children: ReactNode;
  side?: "right" | "left";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const widthMap = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md md:max-w-lg",
  lg: "sm:max-w-lg md:max-w-2xl",
};

/**
 * Standard detail panel for "View {entity}" actions across the app
 * (orders, customers, tickets, leads, etc.). Mobile-friendly, scrollable body,
 * optional sticky footer for primary actions.
 */
export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  hero,
  footer,
  children,
  side = "right",
  size = "md",
  className,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "flex w-full flex-col gap-0 p-0",
          widthMap[size],
          className,
        )}
      >
        <SheetHeader className="space-y-1 border-b border-border px-5 py-4 text-left sm:text-left">
          <SheetTitle className="font-display text-lg font-semibold tracking-tight">
            {title}
          </SheetTitle>
          {description && (
            <SheetDescription className="text-sm text-muted-foreground">
              {description}
            </SheetDescription>
          )}
          {hero && <div className="pt-3">{hero}</div>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card-muted px-5 py-3">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}