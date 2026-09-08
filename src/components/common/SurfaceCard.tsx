import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared card primitives for the Rivera UI.
 *
 * - `<SurfaceCard>` renders a `.surface-card` shell (transparent border, layered
 *   shadow, dark-mode aware). Pick a variant for muted / strong / compact looks.
 * - `<SurfaceCardHeader>` standardises eyebrow / icon / title / description /
 *   actions alignment across every card-like component.
 * - `<SurfaceCardBody>` and `<SurfaceCardFooter>` provide consistent padding
 *   and dividers.
 *
 * Existing components (Card, ChartCard, DataCard, StatCard, FormSection,
 * SettingsCard, EmptyState, LoadingSkeleton) all share the same `.surface-card`
 * utility; reach for these primitives whenever building a new card-like region.
 */

/**
 * Typed map between `SurfaceCard` variants and the `surface-card-*` CSS
 * utilities defined in `src/index.css`. Update both in lockstep — adding a
 * new utility means adding a new variant key here so consumers get a compile
 * error if they try to pass a stale value.
 */
export const SURFACE_CARD_VARIANTS = {
  default: "surface-card",
  muted: "surface-card-muted",
  strong: "surface-card-strong",
  raised: "surface-card-raised",
  compact: "surface-card-compact",
  "muted-compact": "surface-card-muted-compact",
  interactive: "surface-card-interactive",
  "muted-interactive": "surface-card-muted-interactive",
} as const satisfies Record<string, `surface-card${string}`>;

export type SurfaceCardVariant = keyof typeof SURFACE_CARD_VARIANTS;

/** Variants that already include the hover-lift behaviour. */
const INTERACTIVE_VARIANTS = new Set<SurfaceCardVariant>([
  "interactive",
  "muted-interactive",
]);

interface SurfaceCardProps extends HTMLAttributes<HTMLElement> {
  variant?: SurfaceCardVariant;
  /**
   * Adds the `surface-card-hover` utility on top of the chosen variant.
   * Ignored for variants that already include hover behaviour
   * (`interactive`, `muted-interactive`).
   */
  interactive?: boolean;
  as?: "div" | "section" | "article" | "aside";
  children?: ReactNode;
}

export const SurfaceCard = forwardRef<HTMLElement, SurfaceCardProps>(
  ({ variant = "default", interactive = false, as = "section", className, children, ...rest }, ref) => {
    const Tag = as as "section";
    const addHover = interactive && !INTERACTIVE_VARIANTS.has(variant);
    return (
      <Tag
        ref={ref as never}
        className={cn(
          "flex flex-col",
          SURFACE_CARD_VARIANTS[variant],
          addHover && "surface-card-hover",
          className,
        )}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);
SurfaceCard.displayName = "SurfaceCard";

interface SurfaceCardHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  /** Removes the bottom divider. */
  borderless?: boolean;
  /** Visual emphasis of the title. */
  size?: "sm" | "md" | "lg";
}

const titleSize: Record<NonNullable<SurfaceCardHeaderProps["size"]>, string> = {
  sm: "text-[15px]",
  md: "text-base",
  lg: "text-lg",
};

export function SurfaceCardHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
  borderless = false,
  size = "md",
  className,
  children,
  ...rest
}: SurfaceCardHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 px-5 py-4",
        !borderless && "border-b border-border/70",
        className,
      )}
      {...rest}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              {eyebrow}
            </p>
          )}
          {title && (
            <h3
              className={cn(
                "font-display font-semibold tracking-tight text-foreground",
                titleSize[size],
              )}
            >
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
          )}
          {children}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}

interface SurfaceCardBodyProps extends HTMLAttributes<HTMLDivElement> {
  /** Removes inner padding. */
  flush?: boolean;
}

export function SurfaceCardBody({ flush = false, className, ...rest }: SurfaceCardBodyProps) {
  return <div className={cn("flex-1", !flush && "p-5", className)} {...rest} />;
}

export function SurfaceCardFooter({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border/70 bg-card-muted/60 px-5 py-3 text-xs text-muted-foreground",
        className,
      )}
      {...rest}
    />
  );
}
