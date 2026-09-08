import { Check, ChevronDown, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterDropdownBaseProps {
  label: string;
  options: FilterOption[];
  className?: string;
  align?: "start" | "end" | "center";
  icon?: "filter" | "none";
  size?: "sm" | "md";
}

interface SingleProps extends FilterDropdownBaseProps {
  multiple?: false;
  value?: string;
  onChange: (value: string) => void;
  showClear?: boolean;
}

interface MultiProps extends FilterDropdownBaseProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
  showClear?: boolean;
}

export type FilterDropdownProps = SingleProps | MultiProps;

export function FilterDropdown(props: FilterDropdownProps) {
  const { label, options, className, align = "start", icon = "filter", size = "md" } = props;

  const selectedCount = props.multiple ? props.value.length : props.value && props.value !== "all" ? 1 : 0;

  const summary = props.multiple
    ? props.value.length === 0
      ? label
      : props.value.length === 1
        ? options.find((o) => o.value === props.value[0])?.label ?? label
        : `${label} · ${props.value.length}`
    : props.value
      ? options.find((o) => o.value === props.value)?.label ?? label
      : label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border bg-card font-medium text-foreground transition-fast",
          "hover:border-border-strong hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
          className,
        )}
      >
        {icon === "filter" && <Filter className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="truncate">{summary}</span>
        {selectedCount > 0 && (
          <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary">
            {selectedCount}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {props.multiple ? (
          <>
            {options.map((opt) => {
              const checked = props.value.includes(opt.value);
              return (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={checked}
                  onCheckedChange={(c) => {
                    const next = c ? [...props.value, opt.value] : props.value.filter((v) => v !== opt.value);
                    props.onChange(next);
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="flex-1">{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className="ml-2 text-xs text-muted-foreground">{opt.count}</span>
                  )}
                </DropdownMenuCheckboxItem>
              );
            })}
            {props.showClear !== false && props.value.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <button
                  className="flex w-full items-center justify-center px-2 py-1.5 text-xs font-medium text-muted-foreground transition-fast hover:text-foreground"
                  onClick={() => props.onChange([])}
                >
                  Clear filter
                </button>
              </>
            )}
          </>
        ) : (
          (() => {
            const single = props as SingleProps;
            return (
              <DropdownMenuRadioGroup value={single.value ?? ""} onValueChange={single.onChange}>
                {options.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    <span className="flex-1">{opt.label}</span>
                    {opt.count !== undefined && (
                      <span className="ml-2 text-xs text-muted-foreground">{opt.count}</span>
                    )}
                    {single.value === opt.value && <Check className="ml-2 h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            );
          })()
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
