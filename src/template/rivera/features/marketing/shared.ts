import type { Campaign, CampaignStatus, CampaignChannel } from "@/types";
import type { StatusTone } from "@/components/common";

export const statusTone: Record<CampaignStatus, StatusTone> = {
  draft: "neutral",
  scheduled: "info",
  running: "success",
  paused: "warning",
  completed: "info",
};

export const statusLabel: Record<CampaignStatus, string> = {
  draft: "Draft", scheduled: "Scheduled", running: "Running", paused: "Paused", completed: "Completed",
};

export const CHANNELS: CampaignChannel[] = ["email", "social", "search", "display", "sms"];

export const channelTone: Record<CampaignChannel, StatusTone> = {
  email: "info", social: "primary", search: "accent", display: "gold", sms: "neutral",
};

export function ctr(c: Campaign) { return c.impressions ? +(c.clicks / c.impressions * 100).toFixed(2) : 0; }
export function cvr(c: Campaign) { return c.clicks ? +(c.conversions / c.clicks * 100).toFixed(2) : 0; }
export function roas(c: Campaign) {
  const revenue = c.conversions * 48; // mock $48 avg per conv
  return c.spent ? +(revenue / c.spent).toFixed(2) : 0;
}

export function summarize(items: readonly Campaign[]) {
  const totals = items.reduce(
    (acc, c) => ({
      budget: acc.budget + c.budget,
      spent: acc.spent + c.spent,
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      conversions: acc.conversions + c.conversions,
    }),
    { budget: 0, spent: 0, impressions: 0, clicks: 0, conversions: 0 },
  );
  const ctrPct = totals.impressions ? +(totals.clicks / totals.impressions * 100).toFixed(2) : 0;
  const cvrPct = totals.clicks ? +(totals.conversions / totals.clicks * 100).toFixed(2) : 0;
  const revenue = totals.conversions * 48;
  const roasVal = totals.spent ? +(revenue / totals.spent).toFixed(2) : 0;
  return {
    total: items.length,
    running: items.filter((c) => c.status === "running").length,
    ...totals,
    ctr: ctrPct, cvr: cvrPct, revenue, roas: roasVal,
  };
}

export function buildEmailSeries() {
  return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => ({
    day: d,
    sent: 4200 + ((i * 530) % 1800),
    opens: 1800 + ((i * 240) % 900),
    clicks: 320 + ((i * 70) % 220),
  }));
}

export function buildFunnel(items: readonly Campaign[]) {
  const s = summarize(items);
  return [
    { stage: "Impressions", value: s.impressions },
    { stage: "Clicks", value: s.clicks },
    { stage: "Sessions", value: Math.round(s.clicks * 0.78) },
    { stage: "Leads", value: Math.round(s.clicks * 0.22) },
    { stage: "Conversions", value: s.conversions },
  ];
}

export function channelPerformance(items: readonly Campaign[]) {
  return CHANNELS.map((ch) => {
    const list = items.filter((c) => c.channel === ch);
    const s = summarize(list);
    return { channel: ch, campaigns: list.length, spent: s.spent, conversions: s.conversions, ctr: s.ctr, roas: s.roas };
  });
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