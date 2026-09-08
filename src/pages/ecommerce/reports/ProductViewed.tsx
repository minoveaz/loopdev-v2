import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocalStore } from "@/lib/localStore";
import { productsStore } from "@/data";
import { formatNumber } from "@/lib/formatters";
import { ReportLayout } from "./ReportLayout";
import { palette, tooltipStyle } from "./_helpers";

export default function ProductViewedReport() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const products = useLocalStore(productsStore);
  const trend = ["W1","W2","W3","W4","W5","W6","W7","W8"].map((w, i) => ({
    label: w, views: 1200 + i * 280 + (i % 2 ? 90 : -120),
  }));
  const rows = products.slice().sort((a, b) => b.sales - a.sales).map((p) => ({
    name: p.name, sku: p.sku, category: p.category,
    views: p.sales * 12 + 100,
    addToCart: Math.round(p.sales * 1.4),
  }));

  return (
    <ReportLayout
      title="Product Viewed"
      description="How often each product page was visited."
      reportLabel="Product Viewed"
      filename="product-viewed"
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="vw" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette[0]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={palette[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type={curve} dataKey="views" stroke={palette[0]} strokeWidth={2.5} fill="url(#vw)" />
          </AreaChart>
        </ResponsiveContainer>
      }
      table={rows}
      columns={[
        { key: "name", header: "Product" },
        { key: "sku", header: "SKU" },
        { key: "category", header: "Category" },
        { key: "views", header: "Views", align: "right", render: (r) => formatNumber(r.views as number) },
        { key: "addToCart", header: "Add to cart", align: "right", render: (r) => formatNumber(r.addToCart as number) },
      ]}
    />
  );
}
