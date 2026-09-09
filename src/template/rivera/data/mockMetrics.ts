import type { ChannelShare, MetricPoint, SalesPoint, TrafficPoint } from "@/types";

/* -------- Sales analytics -------- */

export const salesByMonth: SalesPoint[] = [
  { label: "Nov", value: 42100, secondary: 38000, orders: 218, refunds: 9  },
  { label: "Dec", value: 51200, secondary: 44500, orders: 272, refunds: 12 },
  { label: "Jan", value: 47800, secondary: 46200, orders: 248, refunds: 8  },
  { label: "Feb", value: 58400, secondary: 49800, orders: 301, refunds: 11 },
  { label: "Mar", value: 64900, secondary: 53100, orders: 339, refunds: 14 },
  { label: "Apr", value: 71200, secondary: 58400, orders: 376, refunds: 13 },
  { label: "May", value: 78650, secondary: 62300, orders: 412, refunds: 15 },
];

/** Back-compat alias. */
export const revenueSeries: MetricPoint[] = salesByMonth.map(({ label, value, secondary }) => ({ label, value, secondary }));

export const salesByCategory: MetricPoint[] = [
  { label: "Subscription", value: 52400 },
  { label: "Add-on",       value: 14820 },
  { label: "Templates",    value:  7950 },
  { label: "Merch",        value:  2480 },
  { label: "Resources",    value:  1000 },
];

/* -------- Traffic analytics -------- */

export const trafficByDay: TrafficPoint[] = [
  { label: "Mon", value: 1240, visitors: 1240, pageViews: 4180, bounceRate: 38.4 },
  { label: "Tue", value: 1580, visitors: 1580, pageViews: 5320, bounceRate: 36.1 },
  { label: "Wed", value: 1390, visitors: 1390, pageViews: 4750, bounceRate: 39.7 },
  { label: "Thu", value: 1820, visitors: 1820, pageViews: 6210, bounceRate: 34.8 },
  { label: "Fri", value: 2140, visitors: 2140, pageViews: 7050, bounceRate: 33.2 },
  { label: "Sat", value: 1680, visitors: 1680, pageViews: 5260, bounceRate: 41.0 },
  { label: "Sun", value: 1320, visitors: 1320, pageViews: 4080, bounceRate: 42.5 },
];

/** Back-compat alias. */
export const visitorsSeries: MetricPoint[] = trafficByDay.map(({ label, visitors }) => ({ label, value: visitors }));

export const channelBreakdown: ChannelShare[] = [
  { label: "Direct",   value: 38 },
  { label: "Organic",  value: 27 },
  { label: "Referral", value: 18 },
  { label: "Social",   value: 12 },
  { label: "Email",    value:  5 },
];

export const topPages: { path: string; views: number; avgTime: string }[] = [
  { path: "/",                  views: 12480, avgTime: "1m 42s" },
  { path: "/pricing",           views:  8210, avgTime: "2m 18s" },
  { path: "/blog/coastal-ux",   views:  5430, avgTime: "3m 02s" },
  { path: "/changelog",         views:  3120, avgTime: "0m 58s" },
  { path: "/integrations",      views:  2640, avgTime: "1m 24s" },
];
