import type { ReactNode } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  meta?: ReactNode;
  completed?: number;
  total?: number;
  className?: string;
  errorCount?: number;
  status?: "neutral" | "progress" | "complete" | "error";
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  compact?: boolean;
  mode?: "compact" | "standard" | "expanded";
  responsive?: "auto" | "fixed";
}

export function FormSectionHeader({
  title,
  description,
  eyebrow,
  icon,
  meta,
  completed,
  total,
  className,
  errorCount = 0,
  status = "neutral",
  collapsible = false,
  collapsed = false,
  onToggle,
  compact = false,
  mode,
  responsive = "auto",
}: FormSectionHeaderProps) {
  const hasProgress = typeof completed === "number" && typeof total === "number" && total > 0;
  const progressComplete = hasProgress && completed >= total;

  const resolvedStatus = errorCount > 0 ? "error" : progressComplete ? "complete" : status;
  const resolvedMode = compact ? "compact" : mode ?? "standard";
  const isCompactMobile = responsive === "auto" && resolvedMode !== "compact";

  return (
    <header className={cn("border-b border-border/80", resolvedMode === "compact" ? "pb-3" : "pb-4", className)}>
      <div className={cn("flex items-start justify-between", isCompactMobile ? "gap-2 sm:gap-4" : "gap-4")}>
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary-soft text-primary">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80">{eyebrow}</p>}
            <h3 className={cn("mt-0.5 font-display font-semibold tracking-tight text-foreground", resolvedMode === "compact" ? "text-sm" : "text-base")}>{title}</h3>
            {description && <p className={cn("mt-1 max-w-prose leading-relaxed text-muted-foreground", resolvedMode === "compact" ? "text-xs" : "text-sm", isCompactMobile && "line-clamp-2")}>{description}</p>}
          </div>
        </div>
        <div className={cn("flex shrink-0 items-center text-xs text-muted-foreground", isCompactMobile ? "gap-1 sm:gap-2" : "gap-2")}>
          {resolvedStatus === "error" && <span className="inline-flex items-center gap-1 rounded-full border border-destructive/25 bg-destructive-soft px-2 py-1 font-medium text-destructive"><CircleAlert className="h-3.5 w-3.5" />{errorCount} {errorCount === 1 ? "error" : "errors"}</span>}
          {resolvedStatus === "progress" && <span className="rounded-full border border-primary/20 bg-primary-soft px-2 py-1 font-medium text-primary">In progress</span>}
          {resolvedStatus === "complete" && <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success-soft px-2 py-1 font-medium text-success"><CheckCircle2 className="h-3.5 w-3.5" />Complete</span>}
          {hasProgress && (
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-medium", progressComplete ? "border-success/25 bg-success-soft text-success" : "border-border bg-background")}>
              {progressComplete && <CheckCircle2 className="h-3.5 w-3.5" />}
              {completed} / {total}
            </span>
          )}
          <span className={cn(isCompactMobile && "hidden sm:inline")}>{meta}</span>
          {collapsible && (
            <button type="button" onClick={onToggle} className="rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}>
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
