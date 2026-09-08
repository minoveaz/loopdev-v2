import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageContainerWidth = "wide" | "default" | "narrow";

const WIDTH_CLASS: Record<PageContainerWidth, string> = {
  /** Dashboards, data tables, and multi-column grids. */
  wide: "max-w-7xl",
  /** Standard content pages. */
  default: "max-w-6xl",
  /** Single-column forms, settings, and focused reading. */
  narrow: "max-w-3xl",
};

interface PageContainerProps {
  width?: PageContainerWidth;
  className?: string;
  children: ReactNode;
}

/**
 * Centralised page wrapper that enforces consistent max-widths and
 * vertical rhythm across the app. Use one of three tiers:
 *  - `wide`    — dashboards & data-heavy pages
 *  - `default` — standard content pages
 *  - `narrow`  — single-column forms & settings
 */
export function PageContainer({
  width = "default",
  className,
  children,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full space-y-6",
        WIDTH_CLASS[width],
        className,
      )}
    >
      {children}
    </div>
  );
}