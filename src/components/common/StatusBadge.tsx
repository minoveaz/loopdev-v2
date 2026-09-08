import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "accent"
  | "gold";

interface StatusBadgeProps {
  tone?: StatusTone;
  variant?: "soft" | "solid" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const toneSoft: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  destructive: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info",
  accent: "bg-accent-soft text-accent",
  gold: "bg-gold-soft text-gold",
};

const toneSolid: Record<StatusTone, string> = {
  neutral: "bg-foreground text-background",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  info: "bg-info text-info-foreground",
  accent: "bg-accent text-accent-foreground",
  gold: "bg-gold text-gold-foreground",
};

const toneOutline: Record<StatusTone, string> = {
  neutral: "border-border text-foreground",
  primary: "border-primary/40 text-primary",
  success: "border-success/40 text-success",
  warning: "border-warning/40 text-warning",
  destructive: "border-destructive/40 text-destructive",
  info: "border-info/40 text-info",
  accent: "border-accent/40 text-accent",
  gold: "border-gold/40 text-gold",
};

const dotTone: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  accent: "bg-accent",
  gold: "bg-gold",
};

export function StatusBadge({
  tone = "neutral",
  variant = "soft",
  size = "sm",
  dot = false,
  icon,
  children,
  className,
}: StatusBadgeProps) {
  const variantClass =
    variant === "solid" ? toneSolid[tone] : variant === "outline" ? `border ${toneOutline[tone]} bg-transparent` : toneSoft[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold capitalize",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        variantClass,
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotTone[tone])} />}
      {icon}
      {children}
    </span>
  );
}
