import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  size?: "sm" | "md" | "lg";
  /**
   * Visual container style.
   * - "plain": no border, transparent (use inside a card)
   * - "card": bordered surface with subtle shadow (default)
   * - "dashed": dashed border, no shadow (placeholder areas)
   */
  variant?: "plain" | "card" | "dashed";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  variant = "card",
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" ? "gap-2 px-6 py-8" : size === "lg" ? "gap-4 px-8 py-20" : "gap-3 px-6 py-14",
        variant === "card" &&
          "surface-card",
        variant === "dashed" && "rounded-xl border border-dashed border-border/80 bg-card/40 shadow-none",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-xl bg-primary-soft text-primary ring-1 ring-inset ring-primary/10",
            size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : "h-14 w-14",
          )}
        >
          <Icon className={cn(size === "sm" ? "h-5 w-5" : size === "lg" ? "h-7 w-7" : "h-6 w-6")} />
        </div>
      )}
      <h3
        className={cn(
          "font-display font-semibold tracking-tight text-foreground",
          size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl",
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
