import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ReportLayout } from "./ReportLayout";
import { palette, tooltipStyle } from "./_helpers";

const carriers = [
  { carrier: "UPS",   shipped: 412, delivered: 388, delayed: 14, returned: 6 },
  { carrier: "FedEx", shipped: 318, delivered: 295, delayed: 18, returned: 5 },
  { carrier: "DHL",   shipped: 276, delivered: 261, delayed:  9, returned: 3 },
  { carrier: "USPS",  shipped: 184, delivered: 170, delayed: 11, returned: 2 },
  { carrier: "Local", shipped:  92, delivered:  90, delayed:  1, returned: 1 },
];

export default function ProductShippingReport() {
  return (
    <ReportLayout
      title="Product Shipping"
      description="Carrier performance and shipping outcomes."
      reportLabel="Product Shipping"
      filename="product-shipping"
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={carriers} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="carrier" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="delivered" fill={palette[4]} radius={[6, 6, 0, 0]} />
            <Bar dataKey="delayed" fill={palette[2]} radius={[6, 6, 0, 0]} />
            <Bar dataKey="returned" fill={palette[3]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      }
      table={carriers}
      columns={[
        { key: "carrier", header: "Carrier" },
        { key: "shipped", header: "Shipped", align: "right" },
        { key: "delivered", header: "Delivered", align: "right" },
        { key: "delayed", header: "Delayed", align: "right" },
        { key: "returned", header: "Returned", align: "right" },
      ]}
    />
  );
}
