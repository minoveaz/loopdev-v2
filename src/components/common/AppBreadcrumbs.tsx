import { Fragment } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  /** Hide the leading home icon. */
  hideHome?: boolean;
}

export function AppBreadcrumbs({ items, className, hideHome = false }: AppBreadcrumbsProps) {
  // Collapse consecutive duplicate labels (e.g. "Dashboards / Dashboards / Analytics").
  const cleaned = items.filter((item, i) => {
    if (i === 0) return true;
    return item.label.toLowerCase() !== items[i - 1].label.toLowerCase();
  });
  void hideHome;

  return (
    <nav aria-label="Breadcrumb" className={cn("text-[12px] text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 leading-none">
        {cleaned.map((item, i) => {
          const isLast = i === cleaned.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li className="min-w-0">
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="truncate rounded-sm font-medium text-muted-foreground transition-fast hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate font-medium",
                      isLast ? "text-foreground" : "text-muted-foreground",
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden className="select-none text-muted-foreground/60">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
