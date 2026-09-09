import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DataCard } from "@/components/common";

interface ShowcaseProps {
  title: string;
  description?: string;
  /** Small label rendered top-right of the card header (e.g. "variant"). */
  hint?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Wrapper that frames a UI Kit example consistently across pages. */
export function Showcase({ title, description, hint, children, className, bodyClassName }: ShowcaseProps) {
  return (
    <DataCard
      title={title}
      description={description}
      action={
        hint ? (
          <span className="rounded-md border border-border bg-card-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {hint}
          </span>
        ) : undefined
      }
      className={className}
      bodyClassName={cn("space-y-4", bodyClassName)}
    >
      {children}
    </DataCard>
  );
}

interface RowProps {
  label?: string;
  children: ReactNode;
  className?: string;
}

/** Horizontal row of examples with an optional left-side label. */
export function ShowcaseRow({ label, children, className }: RowProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      {label && (
        <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** Inline code-like label for tokens. */
export function Token({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-border bg-card-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
      {children}
    </code>
  );
}