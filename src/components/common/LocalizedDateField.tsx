import { format } from "date-fns";
import { enGB, es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getFormatterLocale } from "@/lib/formatters";

type LocalizedDateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label"?: string;
};

export function LocalizedDateField({ value, onChange, placeholder, "aria-label": ariaLabel }: LocalizedDateFieldProps) {
  const locale = getFormatterLocale().startsWith("es") ? es : enGB;
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" aria-label={ariaLabel} className={cn("h-10 w-full justify-start text-left font-normal", !selected && "text-muted-foreground")}>
          <CalendarIcon className="me-2 h-4 w-4" />
          {selected ? format(selected, "PPP", { locale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={locale}
          selected={selected}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
