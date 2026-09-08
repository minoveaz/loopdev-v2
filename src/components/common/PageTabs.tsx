import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageTab {
  label: string;
  /** Link target. Either pass `to` or use `value` + `onChange`. */
  to?: string;
  value?: string;
  icon?: ReactNode;
  count?: number | string;
  disabled?: boolean;
}

interface PageTabsProps {
  tabs: PageTab[];
  /** Controlled value when not using router links. */
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Underlined tab strip used to switch between sub-views of a module.
 * Supports both router links (`to`) and a controlled `value`/`onChange` pair.
 */
export function PageTabs({ tabs, value, onChange, className, size = "md" }: PageTabsProps) {
  const { pathname } = useLocation();

  return (
    <div
      role="tablist"
      className={cn(
        "flex w-full items-center gap-1 overflow-x-auto border-b border-border",
        className,
      )}
    >
      {tabs.map((t) => {
        const isLink = !!t.to;
        const isActive = isLink
          ? pathname === t.to || pathname.startsWith(t.to + "/")
          : value === t.value;

        const inner = (
          <span className="flex items-center gap-2">
            {t.icon}
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {t.count}
              </span>
            )}
          </span>
        );

        const cls = cn(
          "relative shrink-0 whitespace-nowrap font-medium transition-fast focus-visible:outline-none focus-visible:text-foreground",
          size === "sm" ? "px-3 py-2 text-xs" : "px-3 py-2.5 text-sm",
          isActive
            ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:rounded-full after:bg-primary"
            : "text-muted-foreground hover:text-foreground",
          t.disabled && "pointer-events-none opacity-50",
        );

        if (isLink) {
          return (
            <Link key={t.label} to={t.to!} role="tab" aria-selected={isActive} className={cls}>
              {inner}
            </Link>
          );
        }
        return (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={t.disabled}
            onClick={() => onChange?.(t.value!)}
            className={cls}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}