import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ReferenceDataItem } from "../types";

export interface ReferenceComboboxProps<T extends Pick<ReferenceDataItem, "code" | "label">> {
  items: readonly T[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  preserveUnknown?: boolean;
  "aria-label"?: string;
  disabled?: boolean;
}

/**
 * Searchable reference picker. The selected value is always the stable code;
 * unknown values remain selectable so legacy records are not hidden.
 */
export function ReferenceCombobox<T extends Pick<ReferenceDataItem, "code" | "label">>({
  items,
  value,
  onValueChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search options...",
  emptyLabel = "Not provided",
  preserveUnknown = true,
  "aria-label": ariaLabel,
  disabled,
}: ReferenceComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const knownItem = items.find((item) => item.code === value);
  const unknownItem = preserveUnknown && value && !knownItem
    ? { code: value, label: `${value} (legacy value)` }
    : null;
  const selectedLabel = knownItem?.label ?? unknownItem?.label ?? placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!knownItem && !unknownItem && "text-muted-foreground")}>{selectedLabel}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandItem
              value="__reference_data_empty__"
              onSelect={() => {
                onValueChange("");
                setOpen(false);
              }}
            >
              <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
              {emptyLabel}
            </CommandItem>
            {unknownItem && (
              <CommandItem
                value={unknownItem.code}
                onSelect={() => {
                  onValueChange(unknownItem.code);
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === unknownItem.code ? "opacity-100" : "opacity-0")} />
                {unknownItem.label}
              </CommandItem>
            )}
            {items.map((item) => (
              <CommandItem
                key={item.code}
                value={`${item.code} ${item.label}`}
                onSelect={() => {
                  onValueChange(item.code);
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === item.code ? "opacity-100" : "opacity-0")} />
                {item.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export type CityComboboxProps = ReferenceComboboxProps<Pick<ReferenceDataItem, "code" | "label">>;

export function CityCombobox(props: CityComboboxProps) {
  return <ReferenceCombobox {...props} searchPlaceholder={props.searchPlaceholder ?? "Search cities..."} />;
}
