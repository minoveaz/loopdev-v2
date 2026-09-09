import type { Agent, RealEstateDeal, RealEstateListing } from "@/types";
import { ago, inDays } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const PROPERTY_TYPES: RealEstateListing["type"][] = ["apartment", "house", "villa", "office", "land"];
const STATUSES: RealEstateListing["status"][] = ["available", "available", "pending", "sold", "rented", "off_market"];
const CITIES = ["Miami", "Lisbon", "Barcelona", "Dubai", "Austin", "Berlin", "Tokyo", "Vancouver"];

export const mockAgents: Agent[] = [
  "Helena Voss", "Marcus Tate", "Priya Iyer", "Diego Romero", "Yuna Kim", "Owen Hart",
].map((name, i) => ({
  id: `agent_${i + 1}`,
  name,
  email: name.toLowerCase().replace(/\s+/g, ".") + "@rivera.estate",
  phone: `+1 555 02${10 + i}`,
  region: CITIES[i % CITIES.length],
  listingsCount: 4 + i * 3,
  closedDeals: 6 + i * 2,
  rating: +(4 + ((i * 0.13) % 1)).toFixed(1),
  createdAt: ago(500 - i * 40),
  updatedAt: ago(i),
}));

export const agentsStore = createLocalStore<Agent>({
  key: "data:agents",
  seed: mockAgents,
  idPrefix: "agent",
});

export const mockListings: RealEstateListing[] = Array.from({ length: 18 }).map((_, i) => ({
  id: `list_${i + 1}`,
  title: `${["Modern", "Sunlit", "Elegant", "Cozy", "Spacious"][i % 5]} ${PROPERTY_TYPES[i % PROPERTY_TYPES.length]}`,
  address: `${100 + i * 7} ${["Maple", "Cedar", "Birch", "Oak"][i % 4]} St`,
  city: CITIES[i % CITIES.length],
  type: PROPERTY_TYPES[i % PROPERTY_TYPES.length],
  price: 180_000 + i * 47_500,
  currency: "USD",
  bedrooms: 1 + (i % 5),
  bathrooms: 1 + (i % 3),
  areaSqm: 45 + i * 12,
  status: STATUSES[i % STATUSES.length],
  agentId: `agent_${(i % mockAgents.length) + 1}`,
  imageUrl: `https://picsum.photos/seed/listing${i + 1}/640/420`,
  createdAt: ago(90 - i * 4),
  updatedAt: ago(i),
}));

export const listingsStore = createLocalStore<RealEstateListing>({
  key: "data:listings",
  seed: mockListings,
  idPrefix: "list",
});

const STAGES: RealEstateDeal["stage"][] = ["new", "viewing", "negotiation", "closed_won", "closed_lost"];

export const mockDeals: RealEstateDeal[] = Array.from({ length: 14 }).map((_, i) => ({
  id: `deal_${i + 1}`,
  listingId: `list_${(i % mockListings.length) + 1}`,
  client: ["L. Mercer", "T. Bauer", "K. Hassan", "F. Lindgren", "G. Okafor"][i % 5],
  agentId: `agent_${(i % mockAgents.length) + 1}`,
  amount: 200_000 + i * 38_000,
  currency: "USD",
  stage: STAGES[i % STAGES.length],
  expectedCloseDate: inDays(7 + (i % 30)),
  notes: i % 2 === 0 ? "Follow-up scheduled with client." : undefined,
  createdAt: ago(40 - i * 2),
  updatedAt: ago(i),
}));

export const dealsStore = createLocalStore<RealEstateDeal>({
  key: "data:deals",
  seed: mockDeals,
  idPrefix: "deal",
});