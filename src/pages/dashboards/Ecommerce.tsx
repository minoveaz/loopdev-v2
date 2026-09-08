import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowUpRight,
  Download,
  DollarSign,
  Package,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Star,
  UserPlus,
  Users,
  Activity as ActivityIcon,
  Pencil,
  Trash2,
  LogIn,
  Upload,
  MessageSquare,
  Send,
  Plus,
} from "lucide-react";
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
import { DataCard, DateRangeFilter, EmptyState, PageContainer, PageHeader, StatCard, StatusBadge, TableSkeleton, type StatusTone } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import { useLocalStore } from "@/lib/localStore";
import {
  activityStore,
  mockOrders,
  mockProducts,
  ordersStore,
  productsStore,
  salesByCategory,
  salesByMonth,
} from "@/data";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelative,
  getInitials,
} from "@/lib/formatters";
import { downloadCsv, toCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import type { ActivityAction, Order, Product } from "@/types";

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
  "hsl(var(--warning))",
];

const orderStatusTone: Record<Order["status"], StatusTone> = {
  paid: "success",
  pending: "warning",
  refunded: "neutral",
  failed: "destructive",
  shipped: "info",
  cancelled: "neutral",
};

const productStatusTone: Record<Product["status"], StatusTone> = {
  active: "success",
  draft: "neutral",
  archived: "neutral",
  out_of_stock: "destructive",
};

const actionIcon: Record<ActivityAction, typeof ActivityIcon> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  logged_in: LogIn,
  logged_out: LogIn,
  invited: Send,
  exported: Download,
  uploaded: Upload,
  commented: MessageSquare,
};

const actionTone: Record<ActivityAction, string> = {
  created: "bg-success-soft text-success",
  updated: "bg-info-soft text-info",
  deleted: "bg-destructive-soft text-destructive",
  logged_in: "bg-muted text-muted-foreground",
  logged_out: "bg-muted text-muted-foreground",
  invited: "bg-primary-soft text-primary",
  exported: "bg-accent-soft text-accent",
  uploaded: "bg-gold-soft text-gold",
  commented: "bg-info-soft text-info",
};

const customerGrowth = [
  { label: "Nov", value: 1240, secondary: 218 },
  { label: "Dec", value: 1410, secondary: 272 },
  { label: "Jan", value: 1538, secondary: 248 },
  { label: "Feb", value: 1702, secondary: 301 },
  { label: "Mar", value: 1894, secondary: 339 },
  { label: "Apr", value: 2098, secondary: 376 },
  { label: "May", value: 2340, secondary: 412 },
];

export default function EcommerceDashboard() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const loading = useSimulatedLoad(700);
  const [range, setRange] = useState<DateRange | undefined>();

  // Subscribe to live stores so changes elsewhere reflect here.
  const orders = useLocalStore(ordersStore) as readonly Order[];
  const products = useLocalStore(productsStore) as readonly Product[];
  const activity = useLocalStore(activityStore);

  const filteredOrders = useMemo(() => {
    if (!range?.from) return orders;
    const from = +range.from;
    const to = range.to ? +range.to : Date.now();
    return orders.filter((o) => {
      const t = +new Date(o.createdAt);
      return t >= from && t <= to;
    });
  }, [orders, range]);

  const totals = useMemo(() => {
    const paid = filteredOrders.filter((o) => o.status === "paid" || o.status === "shipped");
    const revenue = paid.reduce((s, o) => s + o.amount, 0);
    const totalOrders = filteredOrders.length;
    const aov = totalOrders ? revenue / totalOrders : 0;
    // Mock conversion: paid / (orders + a constant funnel volume)
    const visits = Math.max(1, totalOrders * 28);
    const conversion = paid.length / visits;
    return { revenue, totalOrders, aov, conversion };
  }, [filteredOrders]);

  const topProducts = useMemo(
    () => [...products].sort((a, b) => b.sales - a.sales).slice(0, 6),
    [products],
  );

  const lowStock = useMemo(
    () =>
      products
        .filter((p) => p.stock < 100 && p.status !== "archived")
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5),
    [products],
  );

  const recent = useMemo(() => filteredOrders.slice(0, 6), [filteredOrders]);

  const recentActivity = useMemo(() => activity.slice(0, 7), [activity]);

  const exportReport = () => {
    const rows = mockOrders.map((o) => ({
      reference: o.reference,
      customer: o.customer,
      email: o.customerEmail,
      amount: o.amount,
      currency: o.currency,
      status: o.status,
      items: o.items,
      payment: o.paymentMethod,
      createdAt: o.createdAt,
    }));
    const csv = toCsv(rows, [
      { key: "reference", header: "Reference" },
      { key: "customer", header: "Customer" },
      { key: "email", header: "Email" },
      { key: "amount", header: "Amount" },
      { key: "currency", header: "Currency" },
      { key: "status", header: "Status" },
      { key: "items", header: "Items" },
      { key: "payment", header: "Payment" },
      { key: "createdAt", header: "Created" },
    ]);
    downloadCsv(`rivera-ecommerce-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success("Report exported", { description: `${rows.length} rows · CSV ready to download` });
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Dashboards"
        title="Welcome back to your storefront"
        description="Live revenue, orders, customers, and inventory across Rivera."
        breadcrumbs={trail.length ? trail : [{ label: "Dashboards" }, { label: "eCommerce" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter value={range} onChange={setRange} size="md" />
            <Button onClick={exportReport} className="gap-2">
              <Download className="h-4 w-4" />
              Export report
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          loading={loading}
          label="Total Revenue"
          value={formatCurrency(totals.revenue)}
          delta={11.8}
          hint="vs. previous period"
          icon={DollarSign}
          accent="primary"
        />
        <StatCard
          loading={loading}
          label="Total Orders"
          value={formatNumber(totals.totalOrders)}
          delta={4.2}
          hint="this period"
          icon={ShoppingCart}
          accent="info"
        />
        <StatCard
          loading={loading}
          label="Avg. Order Value"
          value={formatCurrency(totals.aov)}
          delta={2.6}
          hint="per order"
          icon={Receipt}
          accent="gold"
        />
        <StatCard
          loading={loading}
          label="Conversion Rate"
          value={formatPercent(totals.conversion, { decimals: 2 })}
          delta={0.4}
          hint="checkout success"
          icon={ShoppingBag}
          accent="success"
        />
      </div>

      {/* Revenue overview + Sales by category */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard
          title="Revenue overview"
          description="Trailing 7 months of net revenue"
          className="lg:col-span-2"
        >
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesByMonth} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, "USD", { compact: true })} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => (n === "Revenue" ? formatCurrency(v) : formatCurrency(v))} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
                  <Area type={curve} name="Revenue" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revArea)" />
                  <Area type={curve} name="Previous" dataKey="secondary" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </DataCard>

        <DataCard title="Sales by category" description="Revenue split by product line">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    <Pie data={salesByCategory} dataKey="value" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="hsl(var(--card))" strokeWidth={2}>
                      {salesByCategory.map((_, i) => (
                        <Cell key={i} fill={palette[i % palette.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-2">
                {salesByCategory.map((c, i) => {
                  const total = salesByCategory.reduce((s, x) => s + x.value, 0);
                  const pct = (c.value / total) * 100;
                  return (
                    <li key={c.label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-foreground">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette[i % palette.length] }} />
                        {c.label}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{formatPercent(pct, { decimals: 1, alreadyPercent: true })}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </DataCard>
      </div>

      {/* Top selling + Customer growth + Inventory alerts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title="Top selling products" description="Best performers by units sold">
          {loading ? (
            <Skeleton className="h-60 w-full" />
          ) : topProducts.length === 0 ? (
            <EmptyState icon={Package} title="No products yet" description="Add a product to see sales here." />
          ) : (
            <>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={120} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="sales" radius={[0, 6, 6, 0]}>
                      {topProducts.map((_, i) => (
                        <Cell key={i} fill={palette[i % palette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-2">
                {topProducts.slice(0, 3).map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card-muted px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.category} · {p.sku}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 text-gold">
                        <Star className="h-3 w-3 fill-current" />
                        {p.rating || "—"}
                      </span>
                      <span className="font-mono tabular-nums text-foreground">{formatNumber(p.sales)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DataCard>

        <DataCard
          title="Customer growth"
          description="New customers and orders per month"
          eyebrow="+19.2%"
        >
          {loading ? (
            <Skeleton className="h-60 w-full" />
          ) : (
            <>
              <div className="flex items-center gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
                    {formatNumber(customerGrowth[customerGrowth.length - 1].value)}
                  </p>
                  <p className="text-xs text-muted-foreground">total active customers</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                  <UserPlus className="h-3.5 w-3.5" />
                  +242
                </span>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={customerGrowth} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="custArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatNumber(v)} />
                    <Area type={curve} dataKey="value" name="Customers" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#custArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </DataCard>

        <DataCard
          title="Inventory alerts"
          description="Products running low or out of stock"
          eyebrow={lowStock.length > 0 ? `${lowStock.length} alerts` : undefined}
        >
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : lowStock.length === 0 ? (
            <EmptyState icon={Package} title="All stocked up" description="No products are running low right now." />
          ) : (
            <ul className="space-y-3">
              {lowStock.map((p) => {
                const isOut = p.stock === 0;
                return (
                  <li key={p.id} className="flex items-start gap-3 rounded-lg border border-border bg-card-muted p-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        isOut ? "bg-destructive-soft text-destructive" : "bg-warning-soft text-warning",
                      )}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                        <StatusBadge tone={productStatusTone[p.status]}>{p.status.replace("_", " ")}</StatusBadge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.sku} · {isOut ? "Out of stock" : `${formatNumber(p.stock)} units left`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DataCard>
      </div>

      {/* Recent orders + Activity timeline */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard
          title="Recent orders"
          description="Latest customer transactions"
          className="lg:col-span-2"
          flush
          footer={
            <Link to="/management/orders" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              View all orders <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={5} columns={6} />
            </div>
          ) : recent.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={ShoppingBag} title="No orders in this range" description="Try widening the date range or clearing the filter." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Items</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((o) => (
                    <tr key={o.id} className="transition-fast hover:bg-muted/50">
                      <td className="px-5 py-3 font-mono text-xs text-foreground">{o.reference}</td>
                      <td className="px-5 py-3 font-medium text-foreground">{o.customer}</td>
                      <td className="px-5 py-3 tabular-nums text-muted-foreground">{o.items}</td>
                      <td className="px-5 py-3 tabular-nums text-foreground">{formatCurrency(o.amount, o.currency)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={orderStatusTone[o.status]} dot>{o.status}</StatusBadge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground" title={formatDateTime(o.createdAt)}>
                        {formatRelative(o.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataCard>

        <DataCard
          title="Recent activity"
          description="Live actions across your team"
          footer={
            <Link to="/reports/activity" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              View full timeline <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <EmptyState icon={ActivityIcon} title="Nothing happening" description="Activity from your team will appear here." />
          ) : (
            <ol className="relative space-y-4 pl-2">
              <span className="absolute left-[18px] top-2 bottom-2 w-px bg-border" aria-hidden />
              {recentActivity.map((a) => {
                const Icon = actionIcon[a.action] ?? ActivityIcon;
                return (
                  <li key={a.id} className="relative flex gap-3">
                    <span
                      className={cn(
                        "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                        actionTone[a.action] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{getInitials(a.actorId)}</span>{" "}
                        <span className="text-muted-foreground">·</span>{" "}
                        {a.summary}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {formatRelative(a.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </DataCard>
      </div>
    </PageContainer>
  );
}