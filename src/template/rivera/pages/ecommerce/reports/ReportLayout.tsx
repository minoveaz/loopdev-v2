import { useState } from "react";
import { Download } from "lucide-react";
import { DataCard, FilterDropdown, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useToast } from "@/hooks/use-toast";
import type { ReportColumn, ReportRow } from "./_helpers";

interface Props {
  title: string;
  description: string;
  reportLabel: string;
  chart: React.ReactNode;
  table: ReportRow[];
  columns: ReportColumn[];
  filename: string;
}

const RANGES = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last year", value: "1y" },
];

export function ReportLayout({ title, description, reportLabel, chart, table, columns, filename }: Props) {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const [range, setRange] = useState("30d");

  const handleExport = () => {
    const csv = toCsv(table, columns.map((c) => ({ key: c.key as string, header: c.header })) as { key: keyof ReportRow; header: string }[]);
    downloadCsv(filename, csv);
    toast({ title: "Export ready", description: `${filename}.csv downloaded.` });
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="eCommerce · Reports"
        title={title}
        description={description}
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Reports" }, { label: reportLabel }]}
        actions={
          <div className="flex gap-2">
            <FilterDropdown label="Range" value={range} onChange={setRange} icon="none" size="sm" align="end" options={RANGES} />
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        }
      />

      <DataCard title="Trend" description={`Mock figures for the selected range.`}>
        <div className="h-72 w-full">{chart}</div>
      </DataCard>

      <div className="mt-6">
        <DataCard title="Breakdown" flush>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {columns.map((c) => (
                    <th key={String(c.key)} className={`px-5 py-3 font-medium ${c.align === "right" ? "text-right" : "text-left"}`}>
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {table.map((row, i) => (
                  <tr key={i} className="transition-fast hover:bg-muted/50">
                    {columns.map((c) => (
                      <td key={String(c.key)} className={`px-5 py-3 ${c.align === "right" ? "text-right font-mono tabular-nums" : "text-foreground"}`}>
                        {c.render ? c.render(row) : String(row[c.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataCard>
      </div>
    </PageContainer>
  );
}
