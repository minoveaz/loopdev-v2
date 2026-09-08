import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricTrend } from "./MetricTrend";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: string;
  /** Percent change vs. previous period. */
  delta?: number;
  /** Inverts trend coloring (e.g. for error counts). */
  invertTrend?: boolean;
  hint?: string;
  icon?: LucideIcon;
  accent?: "primary" | "accent" | "gold" | "success" | "info";
  /** Compact version for dense dashboards. */
  compact?: boolean;
  /** Show skeleton placeholders instead of content. */
  loading?: boolean;
  className?: string;
}

const accentMap = {
  primary: "bg-primary-soft text-primary ring-primary/15",
  accent: "bg-accent-soft text-accent ring-accent/15",
  gold: "bg-gold-soft text-gold ring-gold/20",
  success: "bg-success-soft text-success ring-success/15",
  info: "bg-info-soft text-info ring-info/15",
};

const stripeMap = {
  primary: "from-primary/40 via-primary/10",
  accent: "from-accent/40 via-accent/10",
  gold: "from-gold/40 via-gold/10",
  success: "from-success/40 via-success/10",
  info: "from-info/40 via-info/10",
};

export function StatCard({
  label,
  value,
  delta,
  invertTrend,
  hint,
  icon: Icon,
  accent = "primary",
  compact = false,
  loading = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "surface-card surface-card-hover group relative overflow-hidden hover:-translate-y-0.5",
        compact ? "p-4" : "p-5",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent opacity-80",
          stripeMap[accent],
        )}
      />
      {loading ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className={cn("rounded-xl", compact ? "h-9 w-9" : "h-10 w-10")} />
          </div>
          <Skeleton className={cn(compact ? "h-7 w-28" : "h-9 w-32")} />
          <Skeleton className="h-3 w-20" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <p
                className={cn(
                  "mt-2 font-display font-semibold tracking-tight text-foreground tabular-nums",
                  compact ? "text-2xl" : "text-3xl",
                )}
              >
                {value}
              </p>
            </div>
            {Icon && (
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                  accentMap[accent],
                  compact ? "h-9 w-9" : "h-11 w-11",
                )}
              >
                <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
              </div>
            )}
          </div>
          {(delta !== undefined || hint) && (
            <div className="mt-4 flex items-center gap-2 text-xs">
              {delta !== undefined && <MetricTrend value={delta} invert={invertTrend} />}
              {hint && <span className="truncate text-muted-foreground">{hint}</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
