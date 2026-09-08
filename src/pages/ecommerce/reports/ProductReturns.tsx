import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocalStore } from "@/lib/localStore";
import { productsStore } from "@/data";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { ReportLayout } from "./ReportLayout";
import { palette, tooltipStyle } from "./_helpers";

export default function ProductReturnsReport() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const products = useLocalStore(productsStore);
  const rows = products.map((p, i) => {
    const returns = Math.max(0, Math.round(p.sales * (0.02 + (i % 4) * 0.012)));
    return {
      name: p.name, sku: p.sku, category: p.category,
      returns,
      rate: p.sales ? returns / p.sales : 0,
      refunded: Math.round(p.price * returns),
    };
  }).sort((a, b) => b.returns - a.returns);

  const trend = ["W1","W2","W3","W4","W5","W6","W7","W8"].map((w, i) => ({
    label: w, returns: 14 + i * 3 + (i % 2 ? 4 : -2),
  }));

  return (
    <ReportLayout
      title="Product Returns"
      description="Return volume, return rate, and refunds by product."
      reportLabel="Product Returns"
      filename="product-returns"
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="rt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette[2]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={palette[2]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type={curve} dataKey="returns" stroke={palette[2]} strokeWidth={2.5} fill="url(#rt)" />
          </AreaChart>
        </ResponsiveContainer>
      }
      table={rows}
      columns={[
        { key: "name", header: "Product" },
        { key: "sku", header: "SKU" },
        { key: "category", header: "Category" },
        { key: "returns", header: "Returns", align: "right" },
        { key: "rate", header: "Return rate", align: "right", render: (r) => formatPercent(r.rate as number) },
        { key: "refunded", header: "Refunded", align: "right", render: (r) => formatCurrency(r.refunded as number, "USD") },
      ]}
    />
  );
}
