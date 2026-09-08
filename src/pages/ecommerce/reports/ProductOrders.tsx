import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocalStore } from "@/lib/localStore";
import { productsStore } from "@/data";
import { formatNumber } from "@/lib/formatters";
import { ReportLayout } from "./ReportLayout";
import { palette, tooltipStyle } from "./_helpers";

export default function ProductOrdersReport() {
  const products = useLocalStore(productsStore);
  const rows = products.slice().sort((a, b) => b.sales - a.sales).map((p) => ({
    name: p.name, sku: p.sku, category: p.category,
    orders: Math.round(p.sales * 0.75),
    units: p.sales,
  }));
  const trend = rows.slice(0, 8).map((r) => ({ label: r.sku, orders: r.orders }));

  return (
    <ReportLayout
      title="Product Orders"
      description="Top products by order count."
      reportLabel="Product Orders"
      filename="product-orders"
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="orders" fill={palette[1]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      }
      table={rows}
      columns={[
        { key: "name", header: "Product" },
        { key: "sku", header: "SKU" },
        { key: "category", header: "Category" },
        { key: "orders", header: "Orders", align: "right", render: (r) => formatNumber(r.orders as number) },
        { key: "units", header: "Units", align: "right", render: (r) => formatNumber(r.units as number) },
      ]}
    />
  );
}
