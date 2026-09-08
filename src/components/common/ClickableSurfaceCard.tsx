import {
  forwardRef,
  useId,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SURFACE_CARD_VARIANTS } from "./SurfaceCard";

/**
 * `ClickableSurfaceCard` renders an interactive `surface-card-*` shell with
 * consistent hover lift, focus ring, and click affordance. It picks the right
 * underlying element automatically:
 *
 * - `to` → renders a react-router `<Link>`
 * - `href` → renders an `<a>`
 * - otherwise → renders a `<button type="button">`
 *
 * Always prefer this over hand-rolling `surface-card-interactive` + hover
 * classes so every clickable card gets the same focus ring, motion, and
 * accessibility wiring (`role`, `aria-label`, `aria-describedby`).
 *
 * Pair with `<ClickableSurfaceCardActions>` to mark a region inside the card
 * that contains its own buttons/links — this stops click + keyboard events
 * from bubbling to the outer card and exposes the region as an accessible
 * group to screen readers.
 */

type ClickableVariant = "default" | "muted";

const variantClass: Record<ClickableVariant, string> = {
  default: SURFACE_CARD_VARIANTS["interactive"],
  muted: SURFACE_CARD_VARIANTS["muted-interactive"],
};

const SHARED_CLASSES =
  "group relative flex flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60";

interface CommonProps {
  variant?: ClickableVariant;
  className?: string;
  children?: ReactNode;
  /** Accessible name announced when the card receives focus. */
  "aria-label"?: string;
  /** ID(s) of element(s) that further describe the card. */
  "aria-describedby"?: string;
  /**
   * Optional inline description rendered visually-hidden inside the card.
   * Auto-wires `aria-describedby` so screen readers announce the extra
   * context after the card's accessible name.
   */
  description?: ReactNode;
}

type ButtonOnlyProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | keyof CommonProps> & {
  to?: undefined;
  href?: undefined;
  type?: "button" | "submit" | "reset";
};

type AnchorOnlyProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
  href: string;
  to?: undefined;
};

type LinkOnlyProps = Omit<LinkProps, keyof CommonProps> & {
  to: LinkProps["to"];
  href?: undefined;
};

export type ClickableSurfaceCardProps = CommonProps &
  (ButtonOnlyProps | AnchorOnlyProps | LinkOnlyProps);

function isLink(props: ClickableSurfaceCardProps): props is CommonProps & LinkOnlyProps {
  return (props as LinkOnlyProps).to !== undefined;
}

function isAnchor(props: ClickableSurfaceCardProps): props is CommonProps & AnchorOnlyProps {
  return (props as AnchorOnlyProps).href !== undefined;
}

export const ClickableSurfaceCard = forwardRef<HTMLElement, ClickableSurfaceCardProps>(
  (props, ref) => {
    const {
      variant = "default",
      className,
      children,
      description,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
    } = props;
    const cls = cn(SHARED_CLASSES, variantClass[variant], className);
    const descId = useId();
    const describedBy =
      [description ? descId : null, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

    const hiddenDescription = description ? (
      <span id={descId} className="sr-only">
        {description}
      </span>
    ) : null;

    if (isLink(props)) {
      const {
        variant: _v,
        className: _c,
        children: _ch,
        description: _d,
        "aria-label": _al,
        "aria-describedby": _ad,
        ...rest
      } = props;
      return (
        <Link
          ref={ref as never}
          className={cls}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          {...rest}
        >
          {hiddenDescription}
          {children}
        </Link>
      );
    }

    if (isAnchor(props)) {
      const {
        variant: _v,
        className: _c,
        children: _ch,
        description: _d,
        "aria-label": _al,
        "aria-describedby": _ad,
        ...rest
      } = props;
      return (
        <a
          ref={ref as never}
          className={cls}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          {...rest}
        >
          {hiddenDescription}
          {children}
        </a>
      );
    }

    const {
      variant: _v,
      className: _c,
      children: _ch,
      description: _d,
      "aria-label": _al,
      "aria-describedby": _ad,
      type = "button",
      ...rest
    } = props;
    return (
      <button
        ref={ref as never}
        type={type}
        className={cls}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        {...rest}
      >
        {hiddenDescription}
        {children}
      </button>
    );
  },
);
ClickableSurfaceCard.displayName = "ClickableSurfaceCard";

/**
 * Wrap interactive controls (buttons / links / menus) inside a
 * `ClickableSurfaceCard` so their clicks and key presses don't trigger the
 * outer card. Exposes the region as an accessible toolbar / group.
 */
interface ClickableSurfaceCardActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** ARIA role for the region. Defaults to `"group"`. */
  role?: "group" | "toolbar" | "menu";
  /** Accessible label for the region (e.g. "Card actions"). */
  "aria-label"?: string;
}

export function ClickableSurfaceCardActions({
  role = "group",
  className,
  onClick,
  onKeyDown,
  "aria-label": ariaLabel = "Card actions",
  ...rest
}: ClickableSurfaceCardActionsProps) {
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={cn("flex items-center gap-2", className)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      onKeyDown={(e) => {
        // Prevent Enter/Space inside actions from activating the parent card.
        if (e.key === "Enter" || e.key === " ") e.stopPropagation();
        onKeyDown?.(e);
      }}
      {...rest}
    />
  );
}