import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";

interface DataCardProps {
  title?: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Removes inner padding, useful for tables. */
  flush?: boolean;
  /** Renders without header divider. */
  borderless?: boolean;
  /** Show shimmer placeholder instead of children. */
  loading?: boolean;
  /** Render an empty state inside the body when no children data exists. */
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;
  /** Approximate body height (px) for skeleton placeholder. Defaults to 180. */
  loadingHeight?: number;
}

export function DataCard({
  title,
  description,
  eyebrow,
  action,
  footer,
  children,
  className,
  bodyClassName,
  flush = false,
  borderless = false,
  loading = false,
  empty = false,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyIcon,
  emptyAction,
  loadingHeight = 180,
}: DataCardProps) {
  const hasHeader = title || description || eyebrow || action;
  return (
    <section className={cn("flex flex-col surface-card", className)}>
      {hasHeader && (
        <header
          className={cn(
            "flex flex-wrap items-start justify-between gap-3 px-5 py-4",
            !borderless && "border-b border-border",
          )}
        >
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
            )}
            {title && (
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn("flex-1", !flush && "p-5", bodyClassName)}>
        {loading ? (
          <div role="status" aria-live="polite" className="space-y-3">
            <Skeleton className="h-3 w-1/3" />
            <div className="skeleton-shimmer w-full rounded-xl" style={{ height: loadingHeight }} />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <span className="sr-only">Loading…</span>
          </div>
        ) : empty ? (
          <EmptyState
            variant="plain"
            size="sm"
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        ) : (
          children
        )}
      </div>
      {footer && (
        <footer className="flex items-center justify-between border-t border-border bg-card-muted px-5 py-3 text-xs text-muted-foreground">
          {footer}
        </footer>
      )}
    </section>
  );
}
