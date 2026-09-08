import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth } from "date-fns";
import { Download, DollarSign, ShoppingBag, TrendingUp, Package } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataCard, DateRangeFilter, EmptyState, FilterDropdown, PageContainer, PageHeader, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { mockProducts, salesByCategory, salesByMonth } from "@/data";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { downloadCsv, toCsv } from "@/lib/csv";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
  padding: "8px 12px",
  boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)",
};

const palette = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--gold))",
  "hsl(var(--info))",
  "hsl(var(--success))",
];

const PRESETS = [
  { label: "Last 7 months", value: "7m" },
  { label: "Last 5 months", value: "5m" },
  { label: "Last 3 months", value: "3m" },
  { label: "Year to date", value: "ytd" },
  { label: "Custom range", value: "custom" },
];

/**
 * Anchor each `salesByMonth` row to the first day of an actual month so we
 * can filter the series by a calendar-driven `DateRange`. The latest entry
 * is anchored to the current month-start; older rows step back by one month.
 */
function buildSeriesDates(): Date[] {
  const now = new Date();
  const anchor = new Date(now.getFullYear(), now.getMonth(), 1);
  return salesByMonth.map((_, i) => {
    const offset = salesByMonth.length - 1 - i;
    return new Date(anchor.getFullYear(), anchor.getMonth() - offset, 1);
  });
}

const SERIES_DATES = buildSeriesDates();
const EARLIEST_DATE = SERIES_DATES[0];
const LATEST_DATE = SERIES_DATES[SERIES_DATES.length - 1];

function rangeWindow(preset: string): number {
  switch (preset) {
    case "3m":
      return 3;
    case "5m":
      return 5;
    case "ytd":
      return salesByMonth.length;
    default:
      return 7;
  }
}

export default function SalesReport() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const [preset, setPreset] = useState("7m");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [categories, setCategories] = useState<string[]>([]);

  const categoryOptions = useMemo(
    () => salesByCategory.map((c) => ({ label: c.label, value: c.label })),
    [],
  );

  /** Time-windowed series — driven by either the preset or the custom range. */
  const series = useMemo(() => {
    if (preset === "custom" && customRange?.from) {
      const from = customRange.from;
      const to = customRange.to ?? customRange.from;
      return salesByMonth.filter((_, i) => SERIES_DATES[i] >= startOfMonth(from) && SERIES_DATES[i] <= endOfMonth(to));
    }
    const n = rangeWindow(preset);
    return salesByMonth.slice(-n);
  }, [preset, customRange]);

  /** Categories visible after filtering. */
  const filteredCategories = useMemo(
    () => (categories.length === 0 ? salesByCategory : salesByCategory.filter((c) => categories.includes(c.label))),
    [categories],
  );

  const totals = useMemo(() => {
    /** Apply the category filter as a proportional scale of the time-window
     * totals. With mock data we don't have per-month-per-category breakdowns,
     * so this multiplies revenue by the picked categories' share of the whole. */
    const fullCategoryTotal = salesByCategory.reduce((s, c) => s + c.value, 0) || 1;
    const pickedTotal = filteredCategories.reduce((s, c) => s + c.value, 0);
    const categoryShare = categories.length === 0 ? 1 : pickedTotal / fullCategoryTotal;

    const revenue = series.reduce((s, p) => s + p.value, 0) * categoryShare;
    const previous = series.reduce((s, p) => s + (p.secondary ?? 0), 0) * categoryShare;
    const orders = series.reduce((s, p) => s + p.orders, 0);
    const refunds = series.reduce((s, p) => s + p.refunds, 0);
    const aov = orders ? revenue / orders : 0;
    const delta = previous ? ((revenue - previous) / previous) * 100 : 0;
    return { revenue, orders, refunds, aov, delta };
  }, [series, filteredCategories, categories]);

  const topProducts = useMemo(
    () =>
      [...mockProducts]
        .filter((p) => categories.length === 0 || categories.includes(p.category))
        .sort((a, b) => b.sales * b.price - a.sales * a.price)
        .slice(0, 6),
    [categories],
  );

  function handleExport() {
    const revenueCsv = toCsv(series, [
      { key: "label", header: "Period" },
      { key: "value", header: "Revenue" },
      { key: "secondary", header: "Previous Period" },
      { key: "orders", header: "Orders" },
      { key: "refunds", header: "Refunds" },
    ]);
    const tag = categories.length ? `-${categories.join("_").toLowerCase()}` : "";
    downloadCsv(`rivera-sales-${preset}${tag}`, revenueCsv);
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Reports"
        title="Sales Report"
        description="Revenue performance, category mix, and best-selling products."
        breadcrumbs={trail.length ? trail : [{ label: "Reports" }, { label: "Sales Report" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Categories"
              multiple
              value={categories}
              onChange={setCategories}
              icon="filter"
              size="sm"
              align="end"
              options={categoryOptions}
            />
            <FilterDropdown
              label="Range"
              value={preset}
              onChange={(v) => {
                setPreset(v);
                if (v !== "custom") setCustomRange(undefined);
              }}
              icon="none"
              size="sm"
              align="end"
              options={PRESETS}
            />
            {preset === "custom" && (
              <DateRangeFilter
                value={customRange}
                onChange={setCustomRange}
                size="sm"
                minDate={EARLIEST_DATE}
                maxDate={LATEST_DATE}
                placeholder="Pick months"
              />
            )}
            <Button size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totals.revenue, "USD", { compact: true })}
          delta={totals.delta}
          hint="vs. previous period"
          icon={DollarSign}
          accent="primary"
        />
        <StatCard
          label="Orders"
          value={formatNumber(totals.orders)}
          delta={6.2}
          hint="paid orders"
          icon={ShoppingBag}
          accent="info"
        />
        <StatCard
          label="Avg. Order Value"
          value={formatCurrency(totals.aov, "USD")}
          delta={2.4}
          hint="this period"
          icon={TrendingUp}
          accent="success"
        />
        <StatCard
          label="Refunds"
          value={formatNumber(totals.refunds)}
          delta={-1.6}
          invertTrend
          hint="lower is better"
          icon={Package}
          accent="gold"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard
          title="Revenue overview"
          description="Revenue compared to the previous period"
          className="lg:col-span-2"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrency(v, "USD", { compact: true })} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
                <Area type={curve} name="Previous" dataKey="secondary" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#prev)" />
                <Area type={curve} name="Revenue" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Sales by category" description="Revenue share across product lines">
          {filteredCategories.length === 0 ? (
            <EmptyState icon={Package} title="No sales yet" description="Category breakdown will appear once orders are recorded." />
          ) : (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    <Pie data={filteredCategories} dataKey="value" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="hsl(var(--card))" strokeWidth={2}>
                      {filteredCategories.map((_, i) => (
                        <Cell key={i} fill={palette[i % palette.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-2.5">
                {filteredCategories.map((c, i) => (
                  <li key={c.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette[i % palette.length] }} />
                      {c.label}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{formatCurrency(c.value, "USD", { compact: true })}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DataCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title="Orders vs. refunds" description="Volume per period" className="lg:col-span-1">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
                <Bar dataKey="orders" name="Orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="refunds" name="Refunds" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Top products" description="Best sellers by revenue" className="lg:col-span-2" flush>
          {topProducts.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Package} title="No products yet" description="Top-selling products will appear here." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium text-right">Units</th>
                    <th className="px-5 py-3 font-medium text-right">Price</th>
                    <th className="px-5 py-3 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topProducts.map((p) => (
                    <tr key={p.id} className="transition-fast hover:bg-muted/50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{p.sku}</div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{p.category}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-foreground">{formatNumber(p.sales)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(p.price, p.currency)}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-foreground">{formatCurrency(p.sales * p.price, p.currency, { compact: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataCard>
      </div>
    </PageContainer>
  );
}