import type { NftAsset } from "@/types";
import type { StatusTone } from "@/components/common";
import { storage } from "@/lib/storage";

export const nftStatusTone: Record<NftAsset["status"], StatusTone> = {
  listed: "info",
  auction: "gold",
  sold: "success",
  draft: "neutral",
};

export const bidStatusTone = {
  active: "info",
  accepted: "success",
  rejected: "destructive",
  expired: "neutral",
} as const satisfies Record<string, StatusTone>;

export const formatCrypto = (v: number, c: NftAsset["currency"]) =>
  `${v.toFixed(2)} ${c}`;

export interface NftSettings {
  marketplaceName: string;
  defaultCurrency: NftAsset["currency"];
  marketplaceFee: number; // %
  royaltyFee: number; // %
  minBidIncrement: number; // %
  autoApproveListings: boolean;
  enableAuctions: boolean;
  enablePublicMint: boolean;
}

export const NFT_SETTINGS_KEY = "nft:settings";
export const DEFAULT_NFT_SETTINGS: NftSettings = {
  marketplaceName: "Rivera Art",
  defaultCurrency: "ETH",
  marketplaceFee: 2.5,
  royaltyFee: 5,
  minBidIncrement: 5,
  autoApproveListings: true,
  enableAuctions: true,
  enablePublicMint: false,
};

export const getNftSettings = (): NftSettings => storage.get(NFT_SETTINGS_KEY, DEFAULT_NFT_SETTINGS);
export const setNftSettings = (s: NftSettings) => storage.set(NFT_SETTINGS_KEY, s);

/** Deterministic 14-day mock volume series. */
export function buildVolumeSeries() {
  return Array.from({ length: 14 }).map((_, i) => ({
    day: `D${i + 1}`,
    volume: +(20 + Math.sin(i / 1.6) * 8 + (i % 3) * 4).toFixed(2),
    sales: 8 + ((i * 7) % 14),
  }));
}