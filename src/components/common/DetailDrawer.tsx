import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppDrawer } from "@/components/platform";

interface DetailDrawerProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
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
  onClose,
  title,
  description,
  subtitle,
  hero,
  footer,
  children,
  side = "right",
  size = "md",
  className,
}: DetailDrawerProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      onClose?.();
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description || subtitle}
      footer={footer}
      side={side}
      size={size}
      layoutMode="expanded"
      responsive="auto"
      className={cn(className, hero && "pb-0")}
    >
      {hero && <div className="mb-5">{hero}</div>}
      {children}
    </AppDrawer>
  );
}