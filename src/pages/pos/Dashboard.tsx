import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  CreditCard,
  Receipt,
  ScanBarcode,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataCard, EmptyState, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { posStore, productsStore } from "@/data";
import {
  formatCurrency,
  formatNumber,
  formatRelative,
  getStatusVariant,
} from "@/lib/formatters";
import type { PosTransaction, Product } from "@/types";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
  padding: "8px 12px",
  boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)",
};

const palette = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--gold))", "hsl(var(--info))"];

export default function PosDashboard() {
  const { trail } = useBreadcrumbs();
  const transactions = useLocalStore(posStore) as readonly PosTransaction[];
  const products = useLocalStore(productsStore) as readonly Product[];

  const completed = useMemo(
    () => transactions.filter((t) => t.status === "completed"),
    [transactions],
  );

  const stats = useMemo(() => {
    const revenue = completed.reduce((s, t) => s + t.total, 0);
    const items = completed.reduce((s, t) => s + t.items, 0);
    const basket = completed.length ? revenue / completed.length : 0;
    const cash = completed.filter((t) => t.payment === "cash").reduce((s, t) => s + t.total, 0);
    const card = completed.filter((t) => t.payment === "card").reduce((s, t) => s + t.total, 0);
    return { revenue, txns: completed.length, items, basket, cash, card };
  }, [completed]);

  const sevenDay = useMemo(() => {
    const buckets = new Map<string, number>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets.set(key, 0);
    }
    completed.forEach((t) => {
      const d = new Date(t.createdAt);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + t.total);
    });
    return Array.from(buckets, ([label, value]) => ({ label, value }));
  }, [completed]);

  const split = [
    { label: "Cash", value: stats.cash || 1 },
    { label: "Card", value: stats.card || 1 },
  ];

  const topProducts = useMemo(
    () => [...products].sort((a, b) => b.sales - a.sales).slice(0, 5),
    [products],
  );

  const recent = transactions.slice(0, 6);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="POS System"
        title="Point of sale overview"
        description="Today's sales, transactions, and store performance at a glance."
        breadcrumbs={trail.length ? trail : [{ label: "POS System" }, { label: "Dashboard" }]}
        actions={
          <Button asChild className="gap-2">
            <Link to="/pos/checkout">
              <ScanBarcode className="h-4 w-4" /> Open checkout
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Daily Sales" value={formatCurrency(stats.revenue)} delta={9.4} icon={TrendingUp} accent="primary" />
        <StatCard label="Transactions" value={formatNumber(stats.txns)} delta={3.1} icon={Receipt} accent="info" />
        <StatCard label="Avg. Basket" value={formatCurrency(stats.basket)} delta={1.7} icon={ShoppingBag} accent="gold" />
        <StatCard label="Cash / Card" value={`${formatCurrency(stats.cash, "USD", { compact: true })} / ${formatCurrency(stats.card, "USD", { compact: true })}`} icon={Banknote} accent="success" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title="Sales — last 7 days" description="Revenue from completed transactions" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sevenDay} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrency(v, "USD")} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Cash vs Card" description="Payment method split">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Pie data={split} dataKey="value" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={3}>
                  {split.map((_, i) => <Cell key={i} fill={palette[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Cash</span><span className="font-mono">{formatCurrency(stats.cash)}</span></li>
            <li className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> Card</span><span className="font-mono">{formatCurrency(stats.card)}</span></li>
          </ul>
        </DataCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title="Top products" description="Best sellers across the store" className="lg:col-span-2">
          {topProducts.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No products yet" />
          ) : (
            <ul className="space-y-2">
              {topProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card-muted px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category} · {p.sku}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-mono text-muted-foreground">{formatNumber(p.sales)} sold</span>
                    <span className="font-mono font-semibold text-foreground">{formatCurrency(p.price, p.currency)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DataCard>

        <DataCard title="Recent transactions" description="Latest register activity">
          {recent.length === 0 ? (
            <EmptyState icon={CreditCard} title="No transactions yet" />
          ) : (
            <ul className="space-y-2">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card-muted px-3 py-2 text-sm">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{t.reference}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(t.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={getStatusVariant(t.status) === "success" ? "success" : getStatusVariant(t.status) === "danger" ? "destructive" : getStatusVariant(t.status) === "warning" ? "warning" : "neutral"}>{t.status}</StatusBadge>
                    <span className="font-mono text-foreground">{formatCurrency(t.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DataCard>
      </div>
    </PageContainer>
  );
}