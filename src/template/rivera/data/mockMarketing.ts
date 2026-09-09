import type { Campaign } from "@/types";
import { ago, inDays } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const CHANNELS: Campaign["channel"][] = ["email", "social", "search", "display", "sms"];
const STATUSES: Campaign["status"][] = ["draft", "scheduled", "running", "running", "paused", "completed"];

export const mockCampaigns: Campaign[] = Array.from({ length: 16 }).map((_, i) => {
  const budget = 1_000 + i * 850;
  const spent = Math.min(budget, +(budget * (0.2 + (i % 7) * 0.12)).toFixed(0));
  const impressions = 12_000 + i * 4_300;
  const clicks = Math.round(impressions * (0.02 + (i % 5) * 0.005));
  const conversions = Math.round(clicks * (0.04 + (i % 4) * 0.01));
  return {
    id: `cmp_${i + 1}`,
    name: `Q${(i % 4) + 1} ${["Launch", "Awareness", "Retargeting", "Promo"][i % 4]} #${i + 1}`,
    channel: CHANNELS[i % CHANNELS.length],
    status: STATUSES[i % STATUSES.length],
    budget,
    spent,
    currency: "USD",
    impressions,
    clicks,
    conversions,
    startDate: ago(30 - i),
    endDate: inDays(20 + (i % 14)),
    createdAt: ago(60 - i * 2),
    updatedAt: ago(i),
  };
});

export const campaignsStore = createLocalStore<Campaign>({
  key: "data:campaigns",
  seed: mockCampaigns,
  idPrefix: "cmp",
});