import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricTrendProps {
  value: number;
  /** Decimals to show. Default 1. */
  precision?: number;
  /** Append to the formatted value (e.g. "%"). Default "%". */
  suffix?: string;
  /** Inverts color logic — useful for "errors", where down is good. */
  invert?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function MetricTrend({ value, precision = 1, suffix = "%", invert = false, size = "sm", className }: MetricTrendProps) {
  const positive = value > 0;
  const neutral = value === 0;
  const good = invert ? !positive : positive;

  const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight;

  const tone = neutral
    ? "bg-muted text-muted-foreground"
    : good
      ? "bg-success-soft text-success"
      : "bg-destructive-soft text-destructive";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full font-semibold tabular-nums",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        tone,
        className,
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {Math.abs(value).toFixed(precision)}
      {suffix}
    </span>
  );
}
