import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface CRMRecordPickerItem {
  type: "contact" | "lead" | "opportunity";
  id: string;
  label: string;
}

export function CRMRecordPicker({
  items,
  value,
  onValueChange,
  placeholder = "Search CRM records...",
  ariaLabel = "Search related CRM record",
}: {
  items: readonly CRMRecordPickerItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => `${item.type}:${item.id}` === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} aria-label={ariaLabel} className="w-full justify-between font-normal">
          <span className={cn(!selected && "text-muted-foreground")}>{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden p-0" align="start" sideOffset={6} collisionPadding={12}>
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList className="h-[min(20rem,calc(100vh-16rem))] min-h-0 max-h-[min(20rem,calc(100vh-16rem))] overflow-y-scroll overscroll-contain scrollbar-thin">
            <CommandEmpty>No CRM records found.</CommandEmpty>
            {items.map((item) => {
              const itemValue = `${item.type}:${item.id}`;
              return (
                <CommandItem key={itemValue} value={`${itemValue} ${item.label}`} onSelect={() => { onValueChange(itemValue); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === itemValue ? "opacity-100" : "opacity-0")} />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandList>
          <div className="border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "contact" : "contacts"} available
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
