import type { RealEstateListing, RealEstateDeal, DealStage, ListingStatus, PropertyType } from "@/types";
import type { StatusTone } from "@/components/common";

export const listingStatusTone: Record<ListingStatus, StatusTone> = {
  available: "success",
  pending: "warning",
  sold: "info",
  rented: "info",
  off_market: "neutral",
};

export const listingStatusLabel: Record<ListingStatus, string> = {
  available: "Available",
  pending: "Pending",
  sold: "Sold",
  rented: "Rented",
  off_market: "Off market",
};

export const dealStageTone: Record<DealStage, StatusTone> = {
  new: "info",
  viewing: "warning",
  negotiation: "gold",
  closed_won: "success",
  closed_lost: "destructive",
};

export const dealStageLabel: Record<DealStage, string> = {
  new: "New",
  viewing: "Viewing",
  negotiation: "Negotiation",
  closed_won: "Closed won",
  closed_lost: "Closed lost",
};

export const STAGES: DealStage[] = ["new", "viewing", "negotiation", "closed_won", "closed_lost"];
export const PROPERTY_TYPES: PropertyType[] = ["apartment", "house", "villa", "office", "land"];

export function formatPrice(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function summarizeListings(items: readonly RealEstateListing[]) {
  const by = (s: ListingStatus) => items.filter((i) => i.status === s).length;
  const totalValue = items.reduce((s, i) => s + i.price, 0);
  return {
    total: items.length,
    available: by("available"),
    pending: by("pending"),
    sold: by("sold"),
    rented: by("rented"),
    totalValue,
    avgPrice: items.length ? Math.round(totalValue / items.length) : 0,
  };
}

export function summarizeDeals(items: readonly RealEstateDeal[]) {
  const won = items.filter((d) => d.stage === "closed_won");
  const revenue = won.reduce((s, d) => s + d.amount, 0);
  return {
    total: items.length,
    won: won.length,
    pipeline: items.filter((d) => !["closed_won", "closed_lost"].includes(d.stage)).length,
    revenue,
    avgDeal: won.length ? Math.round(revenue / won.length) : 0,
  };
}

export function buildRevenueSeries() {
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    .map((m, i) => ({ month: m, revenue: 320 + ((i * 73) % 280), deals: 4 + (i % 7) }));
}

export function propertyDistribution(items: readonly RealEstateListing[]) {
  return PROPERTY_TYPES.map((t) => ({ name: t, value: items.filter((i) => i.type === t).length }));
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