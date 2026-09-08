import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface ThemeOptionCardProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4;
}

export function ThemeOptionCard<T extends string>({ options, value, onChange, columns = 3 }: ThemeOptionCardProps<T>) {
  const cols = columns === 2 ? "sm:grid-cols-2" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3";
  return (
    <div className={cn("grid grid-cols-1 gap-3", cols)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "rounded-lg border p-4 text-left transition-fast",
              active
                ? "border-primary/60 bg-primary-soft shadow-soft"
                : "border-border bg-card hover:border-border-strong",
            )}
          >
            <div className="flex items-center gap-3">
              {opt.icon && (
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-card-muted text-foreground">
                  {opt.icon}
                </span>
              )}
              <div className="min-w-0">
                <p className="font-medium text-foreground">{opt.label}</p>
                {opt.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}