import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  /** "spinner" centers a small spinner+label. "skeleton" renders shimmer rows. "inline" is small inline spinner. */
  variant?: "spinner" | "skeleton" | "inline";
  rows?: number;
  className?: string;
}

export function LoadingState({ label = "Loading…", variant = "spinner", rows = 4, className }: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3", className)} role="status" aria-live="polite">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-xl bg-gradient-to-r from-muted via-card-muted to-muted bg-[length:200%_100%]"
            style={{ animation: "shimmer 1.6s linear infinite" }}
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {label}
      </span>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground", className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
