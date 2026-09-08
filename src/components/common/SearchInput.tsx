import { forwardRef, useEffect, useState, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "size"> {
  value?: string;
  onValueChange?: (value: string) => void;
  /** Debounce in ms. Default 0 (no debounce). */
  debounce?: number;
  size?: "sm" | "md";
  shortcut?: string;
  clearable?: boolean;
  containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    value: controlled,
    onValueChange,
    debounce = 0,
    size = "md",
    shortcut,
    clearable = true,
    placeholder = "Search…",
    containerClassName,
    className,
    ...rest
  },
  ref,
) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState(controlled ?? "");
  const value = isControlled ? controlled! : internal;

  useEffect(() => {
    if (!onValueChange || debounce === 0) return;
    const id = setTimeout(() => onValueChange(value), debounce);
    return () => clearTimeout(id);
  }, [value, debounce, onValueChange]);

  const handleChange = (next: string) => {
    if (!isControlled) setInternal(next);
    if (debounce === 0) onValueChange?.(next);
    else if (isControlled) onValueChange?.(next);
  };

  return (
    <div className={cn("relative w-full", containerClassName)}>
      <Search
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
        )}
      />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-border bg-card pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-fast",
          "hover:border-border-strong focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
          size === "sm" ? "h-8 text-[13px]" : "h-9",
          className,
        )}
        {...rest}
      />
      {clearable && value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => handleChange("")}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-fast hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {shortcut && !value && (
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">
          {shortcut}
        </kbd>
      )}
    </div>
  );
});
