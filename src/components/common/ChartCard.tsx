import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SurfaceCard,
  SurfaceCardBody,
  SurfaceCardFooter,
  SurfaceCardHeader,
} from "./SurfaceCard";

interface ChartCardProps {
  title?: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  footer?: ReactNode;
  /** Fixed chart body height. Defaults to 280px. */
  height?: number | string;
  loading?: boolean;
  empty?: boolean;
  emptyLabel?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * Premium card wrapper for Recharts visualizations.
 * Provides consistent header, padding, height, loading + empty states across the app.
 */
export function ChartCard({
  title,
  description,
  eyebrow,
  icon: Icon,
  action,
  footer,
  height = 280,
  loading = false,
  empty = false,
  emptyLabel = "No data to display",
  children,
  className,
  bodyClassName,
}: ChartCardProps) {
  const hasHeader = title || description || eyebrow || action || Icon;
  return (
    <SurfaceCard interactive className={className}>
      {hasHeader && (
        <SurfaceCardHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          icon={Icon}
          action={action}
        />
      )}
      <SurfaceCardBody flush className={cn("relative px-2 py-4 sm:px-4", bodyClassName)} style={{ height }}>
        {loading ? (
          <div className="flex h-full flex-col gap-3 p-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="flex-1 w-full" />
          </div>
        ) : empty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          children
        )}
      </SurfaceCardBody>
      {footer && <SurfaceCardFooter>{footer}</SurfaceCardFooter>}
    </SurfaceCard>
  );
}