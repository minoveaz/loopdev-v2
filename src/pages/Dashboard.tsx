import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Download,
  DollarSign,
  FileText,
  FolderKanban,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge, TableSkeleton, type StatusTone } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import {
  mockActivity,
  mockOrders,
  mockProjects,
  mockUsers,
  salesByCategory,
  salesByMonth,
} from "@/data";
import { formatCurrency, formatNumber, formatRelative, getInitials } from "@/lib/formatters";

const orderStatusTone: Record<string, StatusTone> = {
  paid: "success",
  pending: "warning",
  refunded: "neutral",
  failed: "destructive",
  shipped: "info",
  cancelled: "neutral",
};

const projectStatusTone: Record<string, StatusTone> = {
  in_progress: "info",
  completed: "success",
  on_hold: "warning",
  cancelled: "neutral",
  planned: "neutral",
};

const categoryColors = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--gold))",
  "hsl(var(--info))",
  "hsl(var(--success))",
];

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
  padding: "8px 12px",
  boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)",
};

const todayLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(new Date());

export default function Dashboard() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const loading = useSimulatedLoad(700);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [rangeFilter, setRangeFilter] = useState("ytd");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filteredOrders = useMemo(
    () =>
      mockOrders.filter((o) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          o.reference.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q);
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(o.status);
        return matchesSearch && matchesStatus;
      }),
    [search, statusFilter],
  );

  const topProjects = useMemo(
    () =>
      [...mockProjects]
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 5),
    [],
  );

  const recentActivity = useMemo(() => mockActivity.slice(0, 6), []);
  const userMap = useMemo(() => new Map(mockUsers.map((u) => [u.id, u])), []);
  const totalCategorySales = salesByCategory.reduce((s, c) => s + c.value, 0);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow={todayLabel}
        title="Welcome back, Amelia"
        description="Here's how Rivera is performing across revenue, customers, and active work."
        breadcrumbs={trail.length ? trail : [{ label: "Dashboard" }, { label: "Overview" }]}
        actions={
          <>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-fast hover:border-border-strong hover:bg-muted">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-smooth hover:opacity-95">
              <Plus className="h-3.5 w-3.5" />
              New report
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={loading} label="Total Revenue" value={formatCurrency(78650)} delta={12.4} hint="vs. last month" icon={DollarSign} accent="primary" />
        <StatCard loading={loading} label="Active Users" value={formatNumber(3284)} delta={4.7} hint="this week" icon={Users} accent="info" />
        <StatCard loading={loading} label="New Orders" value={formatNumber(412)} delta={-2.1} hint="vs. last week" icon={ShoppingBag} accent="gold" />
        <StatCard loading={loading} label="Conversion Rate" value="3.84%" delta={0.6} hint="7-day avg" icon={Activity} accent="success" />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard
          title="Revenue overview"
          description="Current vs. previous period"
          className="lg:col-span-2"
          action={
            <FilterDropdown
              label="Range"
              value={rangeFilter}
              onChange={setRangeFilter}
              icon="none"
              size="sm"
              align="end"
              options={[
                { label: "Last 7 days", value: "7d" },
                { label: "Last 30 days", value: "30d" },
                { label: "Last 90 days", value: "90d" },
                { label: "This year", value: "ytd" },
              ]}
            />
          }
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByMonth} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatCurrency(v, "USD", { compact: true })}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}
                />
                <Line
                  type={curve}
                  name="Previous"
                  dataKey="secondary"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type={curve}
                  name="Current"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 2, fill: "hsl(var(--background))" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Sales by category" description="Revenue split this period">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Pie
                  data={salesByCategory}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={2}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {salesByCategory.map((_, i) => (
                    <Cell key={i} fill={categoryColors[i % categoryColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2">
            {salesByCategory.map((c, i) => {
              const pct = ((c.value / totalCategorySales) * 100).toFixed(1);
              return (
                <li key={c.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: categoryColors[i % categoryColors.length] }}
                    />
                    {c.label}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </DataCard>
      </div>

      {/* Recent orders + Quick actions */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard
          title="Recent orders"
          description="Latest activity from your customers"
          className="lg:col-span-2"
          flush
          action={
            <div className="flex items-center gap-2">
              <SearchInput
                value={search}
                onValueChange={setSearch}
                placeholder="Search orders…"
                size="sm"
                containerClassName="w-44"
              />
              <FilterDropdown
                label="Status"
                multiple
                value={statusFilter}
                onChange={setStatusFilter}
                size="sm"
                align="end"
                options={[
                  { label: "Paid", value: "paid" },
                  { label: "Pending", value: "pending" },
                  { label: "Shipped", value: "shipped" },
                  { label: "Refunded", value: "refunded" },
                  { label: "Failed", value: "failed" },
                  { label: "Cancelled", value: "cancelled" },
                ]}
              />
              <button
                onClick={() => setConfirmOpen(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-fast hover:border-destructive/40 hover:bg-destructive-soft hover:text-destructive"
                aria-label="Clear filters"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          }
          footer={
            <>
              <span>
                Showing {filteredOrders.length} of {mockOrders.length} orders
              </span>
              <Link to="/management/orders" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </>
          }
        >
          {loading ? (
            <div className="px-5 py-5">
              <TableSkeleton rows={6} columns={5} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="px-5 py-10">
              <EmptyState
                icon={ShoppingBag}
                title="No orders found"
                description="Try adjusting your search or status filters."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.slice(0, 8).map((o) => (
                    <tr key={o.id} className="transition-fast hover:bg-muted/50">
                      <td className="px-5 py-3 font-mono text-xs text-foreground">{o.reference}</td>
                      <td className="px-5 py-3 font-medium text-foreground">{o.customer}</td>
                      <td className="px-5 py-3 tabular-nums text-foreground">
                        {formatCurrency(o.amount, o.currency)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={orderStatusTone[o.status]} dot>
                          {o.status}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatRelative(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataCard>

        <DataCard
          title="Quick actions"
          description="Common tasks at your fingertips"
        >
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: UserPlus, label: "Invite user", to: "/management/users", accent: "bg-primary-soft text-primary" },
              { icon: FolderKanban, label: "New project", to: "/management/projects", accent: "bg-info-soft text-info" },
              { icon: FileText, label: "Create invoice", to: "/management/invoices", accent: "bg-gold-soft text-gold" },
              { icon: ShoppingBag, label: "Add product", to: "/management/products", accent: "bg-success-soft text-success" },
            ].map(({ icon: Icon, label, to, accent }) => (
              <Link
                key={label}
                to={to}
                className="group flex flex-col items-start gap-2 surface-card-compact p-3 text-left transition-smooth hover:-translate-y-0.5 surface-card-hover"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-border bg-gradient-mesh p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-elegant">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Upgrade to Rivera Pro</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Unlock advanced analytics, custom reports, and priority support.
                </p>
                <button className="mt-3 inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground transition-smooth hover:opacity-95">
                  Learn more
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </DataCard>
      </div>

      {/* Top projects + Activity feed */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard
          title="Top projects"
          description="Tracked by completion"
          className="lg:col-span-2"
          footer={
            <Link to="/management/projects" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              View all projects <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          {topProjects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to see it here." />
          ) : (
            <ul className="space-y-4">
              {topProjects.map((p) => {
                const owner = userMap.get(p.ownerId);
                return (
                  <li key={p.id} className="surface-card-muted-compact p-4 transition-fast hover:border-border-strong">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-foreground">{p.name}</p>
                          <StatusBadge tone={projectStatusTone[p.status]}>{p.status.replace("_", " ")}</StatusBadge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {p.client} · Budget {formatCurrency(p.budget, p.currency, { compact: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {owner && (
                          <Avatar className="h-7 w-7 border border-border">
                            <AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">
                              {getInitials(owner.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="font-mono text-xs tabular-nums text-foreground">{p.progress}%</span>
                      </div>
                    </div>
                    <Progress value={p.progress} className="mt-3 h-1.5" />
                  </li>
                );
              })}
            </ul>
          )}
        </DataCard>

        <DataCard
          title="Activity feed"
          description="Latest events across your workspace"
        >
          {recentActivity.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" description="Actions from your team will appear here." />
          ) : (
            <ol className="relative space-y-5 before:absolute before:left-[15px] before:top-1 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
              {recentActivity.map((a) => {
                const actor = userMap.get(a.actorId);
                return (
                  <li key={a.id} className="relative flex gap-3 pl-0">
                    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-soft">
                      {actor ? (
                        <span className="text-[10px] font-semibold text-foreground">{getInitials(actor.name)}</span>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{actor?.name ?? "Someone"}</span>{" "}
                        <span className="text-muted-foreground">{a.summary.replace(actor?.name ?? "", "").trim() || a.action.replace("_", " ")}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </DataCard>
      </div>

      {/* Visitors-style mini bar (kept for richness) */}
      <div className="mt-6">
        <DataCard title="Orders by month" description="Order volume across the past 7 months">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByMonth} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="refunds" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone="destructive"
        title="Clear all filters?"
        description="This will reset search and status filters. Mock data will not be deleted."
        confirmLabel="Clear filters"
        onConfirm={() => {
          setSearch("");
          setStatusFilter([]);
          setConfirmOpen(false);
        }}
      />
    </PageContainer>
  );
}
