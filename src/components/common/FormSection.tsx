import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FormSectionHeader } from "./FormSectionHeader";

export interface FormSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Optional aside (e.g. helper card) shown to the right on lg+. */
  aside?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
  eyebrow?: string;
  meta?: ReactNode;
  completed?: number;
  total?: number;
  errorCount?: number;
  status?: "neutral" | "progress" | "complete" | "error";
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  compact?: boolean;
  mode?: "compact" | "standard" | "expanded";
  responsive?: "auto" | "fixed";
  layout?: "two-column" | "stacked";
}

/**
 * Form section supporting stacked (header above fields) and two-column layouts.
 * Defaults to stacked layout for optimal responsiveness and drawer compatibility.
 */
export function FormSection({
  title,
  description,
  icon,
  aside,
  children,
  id,
  className,
  eyebrow,
  meta,
  completed,
  total,
  errorCount,
  status,
  collapsible = false,
  defaultCollapsed = false,
  compact = false,
  mode,
  responsive = "auto",
  layout = "stacked",
}: FormSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <section
      id={id}
      className={cn(
        layout === "two-column"
          ? "grid gap-6 rounded-xl border border-border-strong/70 bg-card-muted/45 p-5 shadow-xs md:p-6 lg:grid-cols-[260px_1fr]"
          : "flex flex-col gap-5 rounded-xl border border-border-strong/70 bg-card/70 p-5 shadow-xs md:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <FormSectionHeader
          title={title}
          description={description}
          eyebrow={eyebrow}
          icon={icon}
          meta={meta}
          completed={completed}
          total={total}
          errorCount={errorCount}
          status={status}
          collapsible={collapsible}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          compact={compact}
          mode={mode}
          responsive={responsive}
        />
        {aside && <div>{aside}</div>}
      </div>
      {!collapsed && (
        <div className={layout === "two-column" ? "min-w-0 space-y-5 rounded-lg border border-border/80 bg-background/70 p-4 md:p-5" : "min-w-0 w-full"}>
          {children}
        </div>
      )}
    </section>
  );
}