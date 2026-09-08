import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Optional aside (e.g. helper card) shown to the right on lg+. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Two-column form section: title/description on the left, fields on the right.
 * Stacks on small screens. Use multiple inside a settings or "Create" page.
 */
export function FormSection({
  title,
  description,
  icon,
  aside,
  children,
  className,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "grid gap-6 surface-card p-5 md:p-6 lg:grid-cols-[260px_1fr]",
        className,
      )}
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              {icon}
            </span>
          )}
          <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
            {title}
          </h3>
        </div>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {aside && <div className="mt-2">{aside}</div>}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}