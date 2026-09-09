import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function DateRangePickerPage() {
  const [range, setRange] = useState<DateRange | undefined>();
  const label = range?.from
    ? range.to ? `${format(range.from, "LLL d")} – ${format(range.to, "LLL d, y")}` : format(range.from, "LLL d, y")
    : "Pick a date range";
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Date Range Picker" description="Two-month range selection." />
      <Showcase title="Pick a range" hint="range">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[320px] justify-start text-left font-normal", !range && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />{label}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </Showcase>
    </PageContainer>
  );
}