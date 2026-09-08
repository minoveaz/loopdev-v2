import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_PALETTE, type BrandColor } from "@/config/themeConfig";

interface ThemeColorPickerProps {
  value: BrandColor;
  onChange: (v: BrandColor) => void;
}

export function ThemeColorPicker({ value, onChange }: ThemeColorPickerProps) {
  const entries = Object.entries(BRAND_PALETTE) as [BrandColor, (typeof BRAND_PALETTE)[BrandColor]][];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {entries.map(([key, palette]) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-lg border p-3 transition-fast",
              active ? "border-primary/60 bg-primary-soft" : "border-border bg-card hover:border-border-strong",
            )}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-md ring-1 ring-black/5"
              style={{ background: palette.swatch }}
            >
              {active && <Check className="h-4 w-4 text-white" />}
            </span>
            <span className="text-xs font-medium text-foreground">{palette.label}</span>
          </button>
        );
      })}
    </div>
  );
}