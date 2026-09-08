import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRangeFilterProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  size?: "sm" | "md";
  className?: string;
  align?: "start" | "center" | "end";
  /** Disable dates after this point (e.g., today). */
  maxDate?: Date;
  /** Disable dates before this point (e.g., earliest data). */
  minDate?: Date;
}

/**
 * Two-month range picker styled to match Rivera's filter controls.
 * Frontend-only — emits a `DateRange` for the caller to apply.
 */
export function DateRangeFilter({
  value,
  onChange,
  placeholder = "Pick a date range",
  size = "sm",
  className,
  align = "end",
  maxDate,
  minDate,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const sizeClasses = size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm";

  const summary = value?.from
    ? value.to
      ? `${format(value.from, "MMM d")} – ${format(value.to, "MMM d, yyyy")}`
      : format(value.from, "MMM d, yyyy")
    : placeholder;

  const hasValue = !!value?.from;

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "justify-start gap-2 font-medium",
              sizeClasses,
              !hasValue && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="truncate">{summary}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={value}
            onSelect={(range) => {
              onChange(range);
              if (range?.from && range.to) setOpen(false);
            }}
            disabled={(date) => {
              if (maxDate && date > maxDate) return true;
              if (minDate && date < minDate) return true;
              return false;
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      {hasValue && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Clear date range"
          onClick={() => onChange(undefined)}
          className={cn(size === "sm" ? "h-8 w-8" : "h-9 w-9")}
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}