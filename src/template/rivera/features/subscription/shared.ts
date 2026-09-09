import type { SubscriptionPlan } from "@/types";

export function summarizePlans(items: readonly SubscriptionPlan[]) {
  const subs = items.reduce((s, p) => s + p.activeSubscribers, 0);
  const mrr = items.reduce((s, p) => s + p.activeSubscribers * p.price, 0);
  const arr = mrr * 12;
  const arpu = subs ? Math.round(mrr / subs) : 0;
  return { plans: items.length, subs, mrr, arr, arpu };
}

export function buildLifecycleFunnel(items: readonly SubscriptionPlan[]) {
  const subs = items.reduce((s, p) => s + p.activeSubscribers, 0);
  return [
    { stage: "Visitors", value: Math.round(subs * 18) },
    { stage: "Signups", value: Math.round(subs * 4.2) },
    { stage: "Trial", value: Math.round(subs * 1.8) },
    { stage: "Active", value: subs },
    { stage: "Loyal", value: Math.round(subs * 0.62) },
  ];
}

export function buildRevenueSeries() {
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => ({
    month: m,
    mrr: 18000 + ((i * 1450) % 9800),
    new: 220 + ((i * 41) % 180),
    churn: 60 + ((i * 17) % 90),
  }));
}

export function buildChurnSeries() {
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => ({
    month: m,
    churn: +(2.4 + ((i * 0.27) % 2.6)).toFixed(2),
  }));
}

export const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
  padding: "8px 12px",
  boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)",
} as const;