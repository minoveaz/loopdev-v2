import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppBreadcrumbs, type BreadcrumbItem } from "./AppBreadcrumbs";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  size?: "md" | "lg";
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  breadcrumbs,
  className,
  size = "md",
}: PageHeaderProps) {
  // Avoid noisy duplication when the eyebrow already appears in the breadcrumb trail.
  const showEyebrow =
    !!eyebrow &&
    !(breadcrumbs ?? []).some(
      (b) => b.label.toLowerCase() === eyebrow.toLowerCase(),
    );
  return (
    <header className={cn("mb-6 md:mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <AppBreadcrumbs items={breadcrumbs} className="mb-2" />
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {showEyebrow && (
            <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">{eyebrow}</p>
          )}
          <h1
            className={cn(
              "font-display font-semibold tracking-tight text-foreground text-balance",
              size === "lg" ? "text-[28px] md:text-[34px] lg:text-[40px] leading-[1.1]" : "text-[22px] md:text-[26px] lg:text-[30px] leading-[1.15]",
            )}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-[13.5px] text-muted-foreground md:text-[14.5px]">{description}</p>
          )}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
