import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Variant = "card" | "list" | "table" | "stats" | "chart" | "form" | "page" | "detail";

interface LoadingSkeletonProps {
  variant?: Variant;
  rows?: number;
  columns?: number;
  count?: number;
  className?: string;
  /** Wrap output in Rivera card surface (border + subtle shadow). */
  surface?: boolean;
  label?: string;
}

const surfaceCls =
  "surface-card p-5";

/**
 * Unified Rivera loading placeholder. Picks a sensible shimmer layout per
 * page section so empty/loading states feel consistent across the app.
 */
export function LoadingSkeleton({
  variant = "card",
  rows = 5,
  columns = 5,
  count = 3,
  className,
  surface = true,
  label = "Loading…",
}: LoadingSkeletonProps) {
  const a11y = { role: "status" as const, "aria-live": "polite" as const };

  if (variant === "stats") {
    return (
      <div {...a11y} className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={surfaceCls}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <Skeleton className="mt-4 h-7 w-24" />
            <Skeleton className="mt-3 h-3 w-28" />
          </div>
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === "chart") {
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      surface ? <div className={cn(surfaceCls, className)}>{children}</div> : <div className={className}>{children}</div>;
    return (
      <Wrapper>
        <div {...a11y}>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="relative mt-6 h-56 w-full overflow-hidden rounded-xl bg-muted/40">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-card-muted to-transparent"
              style={{ animation: "shimmer 1.6s linear infinite", backgroundSize: "200% 100%" }}
            />
          </div>
          <div className="mt-4 flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-16" />
            ))}
          </div>
          <span className="sr-only">{label}</span>
        </div>
      </Wrapper>
    );
  }

  if (variant === "table") {
    return (
      <div {...a11y} className={cn(surface && surfaceCls, "space-y-3", className)}>
        <div
          className="grid gap-3 border-b border-border pb-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid items-center gap-3 py-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn("h-4", c === 0 ? "w-3/4" : c === columns - 1 ? "w-1/2" : "w-2/3")}
              />
            ))}
          </div>
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div {...a11y} className={cn(surface && surfaceCls, "divide-y divide-border", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <Skeleton className="hidden h-3 w-16 sm:block" />
          </div>
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div {...a11y} className={cn(surface && surfaceCls, "space-y-5", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div {...a11y} className={cn(surface && surfaceCls, "space-y-5", className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div {...a11y} className={cn("space-y-6", className)}>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <LoadingSkeleton variant="stats" count={4} />
        <LoadingSkeleton variant="chart" />
        <LoadingSkeleton variant="table" rows={6} columns={5} />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // "card" default
  return (
    <div {...a11y} className={cn(surface && surfaceCls, "space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <span className="sr-only">{label}</span>
    </div>
  );
}