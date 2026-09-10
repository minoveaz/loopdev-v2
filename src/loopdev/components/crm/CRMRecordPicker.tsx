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
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}
