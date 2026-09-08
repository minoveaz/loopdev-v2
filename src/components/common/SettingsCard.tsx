import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Compact settings/preferences row card. Use stacked vertically inside
 * Account / Module Settings pages.
 */
export function SettingsCard({
  title,
  description,
  icon: Icon,
  action,
  footer,
  children,
  className,
}: SettingsCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 surface-card surface-card-hover p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary ring-1 ring-inset ring-primary/15">
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
          <div className="min-w-0">
            <h4 className="font-display text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h4>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      {children && <div className="text-sm">{children}</div>}
      {footer && (
        <div className="-mx-5 -mb-5 mt-1 rounded-b-2xl border-t border-border bg-card-muted px-5 py-3 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </article>
  );
}