import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocalStore } from "@/lib/localStore";
import { productsStore } from "@/template/rivera/data";
import { formatCurrency } from "@/lib/formatters";
import { ReportLayout } from "./ReportLayout";
import { palette, tooltipStyle } from "./_helpers";

export default function ProductSalesReport() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const products = useLocalStore(productsStore);
  const rows = products.slice().sort((a, b) => b.price * b.sales - a.price * a.sales).map((p) => ({
    name: p.name, sku: p.sku, category: p.category,
    units: p.sales,
    revenue: Math.round(p.price * p.sales),
  }));
  const trend = ["Jan","Feb","Mar","Apr","May","Jun","Jul"].map((m, i) => ({
    label: m, revenue: 18000 + i * 4200 + (i % 2 ? 1500 : -800),
  }));

  return (
    <ReportLayout
      title="Product Sales"
      description="Revenue performance by product."
      reportLabel="Product Sales"
      filename="product-sales"
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="rv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette[4]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={palette[4]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, "USD")} />
            <Area type={curve} dataKey="revenue" stroke={palette[4]} strokeWidth={2.5} fill="url(#rv)" />
          </AreaChart>
        </ResponsiveContainer>
      }
      table={rows}
      columns={[
        { key: "name", header: "Product" },
        { key: "sku", header: "SKU" },
        { key: "category", header: "Category" },
        { key: "units", header: "Units", align: "right" },
        { key: "revenue", header: "Revenue", align: "right", render: (r) => formatCurrency(r.revenue as number, "USD") },
      ]}
    />
  );
}
