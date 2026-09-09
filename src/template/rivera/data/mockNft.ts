import type { NftAsset } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const COLLECTIONS = ["Lumen", "Solstice", "Echoform", "Glasswave", "Onyx Drift"];
const CREATORS = ["Aiko.eth", "vox_atelier", "neon_grid", "halcyon", "studio_obsidian"];
const CURRENCIES: NftAsset["currency"][] = ["ETH", "SOL", "USDC"];
const STATUSES: NftAsset["status"][] = ["listed", "auction", "listed", "sold", "draft"];

export const mockNftAssets: NftAsset[] = Array.from({ length: 18 }).map((_, i) => {
  const price = +(0.4 + (i % 8) * 0.35).toFixed(2);
  return {
    id: `nft_${i + 1}`,
    name: `${COLLECTIONS[i % COLLECTIONS.length]} #${(120 + i).toString().padStart(3, "0")}`,
    collection: COLLECTIONS[i % COLLECTIONS.length],
    creator: CREATORS[i % CREATORS.length],
    imageUrl: `https://picsum.photos/seed/nft${i + 1}/400/400`,
    price,
    currency: CURRENCIES[i % CURRENCIES.length],
    highestBid: STATUSES[i % STATUSES.length] === "auction" ? +(price * 0.85).toFixed(2) : undefined,
    status: STATUSES[i % STATUSES.length],
    likes: 12 + ((i * 9) % 480),
    views: 240 + ((i * 53) % 4200),
    createdAt: ago(120 - i * 4),
    updatedAt: ago(i),
  };
});

export const nftStore = createLocalStore<NftAsset>({
  key: "data:nft",
  seed: mockNftAssets,
  idPrefix: "nft",
});

/* ---------------- Bids, Creators, Collections (mock) ---------------- */

export interface NftBid {
  id: string;
  assetId: string;
  assetName: string;
  collection: string;
  bidder: string;
  amount: number;
  currency: NftAsset["currency"];
  status: "active" | "accepted" | "rejected" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface NftCreator {
  id: string;
  handle: string;
  name: string;
  avatarUrl: string;
  verified: boolean;
  followers: number;
  items: number;
  volume: number;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NftCollection {
  id: string;
  name: string;
  creator: string;
  items: number;
  floorPrice: number;
  volume: number;
  owners: number;
  change24h: number;
  coverUrl: string;
  createdAt: string;
  updatedAt: string;
}

const BIDDERS = ["lyra.eth", "mona_x", "kairo.lens", "0xVantage", "neonpunk", "aurelia", "blok.eth", "vex_dao"];

export const mockNftBids: NftBid[] = Array.from({ length: 14 }).map((_, i) => {
  const asset = mockNftAssets[i % mockNftAssets.length];
  const status: NftBid["status"] = (["active", "active", "accepted", "rejected", "expired"] as const)[i % 5];
  return {
    id: `bid_${i + 1}`,
    assetId: asset.id,
    assetName: asset.name,
    collection: asset.collection,
    bidder: BIDDERS[i % BIDDERS.length],
    amount: +(asset.price * (0.7 + (i % 5) * 0.08)).toFixed(2),
    currency: asset.currency,
    status,
    createdAt: ago(20 - i, i),
    updatedAt: ago(i),
  };
});

export const nftBidsStore = createLocalStore<NftBid>({
  key: "data:nft-bids",
  seed: mockNftBids,
  idPrefix: "bid",
});

const CREATOR_NAMES = [
  ["Aiko.eth", "Aiko Tanaka"],
  ["vox_atelier", "Vox Atelier"],
  ["neon_grid", "Neon Grid Studio"],
  ["halcyon", "Halcyon Studio"],
  ["studio_obsidian", "Studio Obsidian"],
  ["lumen_lab", "Lumen Lab"],
  ["echo.form", "Echoform Collective"],
  ["glasswave", "Glasswave"],
];

export const mockNftCreators: NftCreator[] = CREATOR_NAMES.map(([handle, name], i) => ({
  id: `crt_${i + 1}`,
  handle,
  name,
  avatarUrl: `https://i.pravatar.cc/150?img=${20 + i}`,
  verified: i % 3 !== 0,
  followers: 1200 + i * 880,
  items: 6 + (i % 5) * 4,
  volume: +(45 + i * 22.6).toFixed(2),
  joinedAt: ago(420 - i * 28),
  createdAt: ago(420 - i * 28),
  updatedAt: ago(i),
}));

export const nftCreatorsStore = createLocalStore<NftCreator>({
  key: "data:nft-creators",
  seed: mockNftCreators,
  idPrefix: "crt",
});

const COLLECTION_NAMES = ["Lumen", "Solstice", "Echoform", "Glasswave", "Onyx Drift", "Cinder", "Vellum"];

export const mockNftCollections: NftCollection[] = COLLECTION_NAMES.map((name, i) => ({
  id: `col_${i + 1}`,
  name,
  creator: CREATOR_NAMES[i % CREATOR_NAMES.length][0],
  items: 80 + i * 40,
  floorPrice: +(0.4 + i * 0.18).toFixed(2),
  volume: +(120 + i * 64.5).toFixed(2),
  owners: 60 + i * 28,
  change24h: +(((i % 2 === 0 ? 1 : -1) * (2 + i * 1.4)).toFixed(2)),
  coverUrl: `https://picsum.photos/seed/col${i + 1}/600/280`,
  createdAt: ago(300 - i * 20),
  updatedAt: ago(i),
}));

export const nftCollectionsStore = createLocalStore<NftCollection>({
  key: "data:nft-collections",
  seed: mockNftCollections,
  idPrefix: "col",
});