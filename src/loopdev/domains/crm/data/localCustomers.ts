import { createLocalStore } from "@/lib/localStore";

export interface LocalCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string | null;
  secondLastName?: string | null;
  preferredName?: string | null;
  secondaryEmail?: string | null;
  secondaryPhone?: string | null;
  preferredChannel?: "whatsapp" | "phone" | "email" | null;
  preferredLanguage?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  country: string;
  city: string;
  ordersCount: number;
  tier: "lead" | "standard" | "vip" | "wholesale";
  createdAt: string;
  updatedAt: string;
}

function ago(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

const NAMES = [
  "Aria Blackwood", "Theo Marquez", "Indira Vasquez", "Kenji Watanabe", "Salma El-Amin",
  "Joaquin Reyes", "Margot Lefevre", "Soren Hayes", "Lila Okonkwo", "Felix Brennan",
  "Niamh O'Connor", "Hiroto Tanaka", "Beatriz Santos", "Ezra Klein", "Yuki Sato",
  "Camille Dubois", "Mateo Rivas", "Ananya Iyer", "Oliver Pierce", "Zara Holloway",
];
const COUNTRIES = ["USA", "UK", "Spain", "Japan", "France", "Brazil", "Germany", "India"];
const CITIES = ["NYC", "London", "Madrid", "Tokyo", "Paris", "Sao Paulo", "Berlin", "Mumbai"];
const TIERS: LocalCustomer["tier"][] = ["lead", "standard", "vip", "wholesale"];

const seed: LocalCustomer[] = NAMES.map((name, i) => ({
  id: `crm_cust_${i + 1}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
  phone: `+1 555 0${100 + i}`,
  country: COUNTRIES[i % COUNTRIES.length],
  city: CITIES[i % CITIES.length],
  ordersCount: 1 + ((i * 5) % 24),
  tier: TIERS[i % TIERS.length],
  createdAt: ago(200 - i * 4),
  updatedAt: ago(i),
}));

export const crmCustomersStore = createLocalStore<LocalCustomer>({
  key: "loopdev:crm:customers",
  seed,
  idPrefix: "crm_cust",
});
