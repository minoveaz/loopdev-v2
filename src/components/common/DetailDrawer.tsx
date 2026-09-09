import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppDrawer } from "@/components/platform";

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
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      side={side}
      size={size}
      className={cn(className, hero && "pb-0")}
    >
      {hero && <div className="mb-5">{hero}</div>}
      {children}
    </AppDrawer>
  );
}