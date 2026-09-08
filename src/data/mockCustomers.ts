import type { Customer } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const NAMES = [
  "Aria Blackwood", "Theo Marquez", "Indira Vasquez", "Kenji Watanabe", "Salma El-Amin",
  "Joaquin Reyes", "Margot Lefevre", "Soren Hayes", "Lila Okonkwo", "Felix Brennan",
  "Niamh O'Connor", "Hiroto Tanaka", "Beatriz Santos", "Ezra Klein", "Yuki Sato",
  "Camille Dubois", "Mateo Rivas", "Ananya Iyer", "Oliver Pierce", "Zara Holloway",
];
const COUNTRIES = ["USA", "UK", "Spain", "Japan", "France", "Brazil", "Germany", "India"];
const TIERS: Customer["tier"][] = ["lead", "standard", "vip", "wholesale"];

export const mockCustomers: Customer[] = NAMES.map((name, i) => {
  const tier = TIERS[i % TIERS.length];
  const orders = 1 + ((i * 5) % 24);
  return {
    id: `cust_${i + 1}`,
    name,
    email: name.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com",
    phone: `+1 555 0${100 + i}`,
    country: COUNTRIES[i % COUNTRIES.length],
    city: ["NYC", "London", "Madrid", "Tokyo", "Paris", "São Paulo", "Berlin", "Mumbai"][i % 8],
    totalSpent: 120 + i * 187,
    currency: "USD",
    ordersCount: orders,
    tier,
    lastOrderAt: ago(2 + (i % 30)),
    createdAt: ago(200 - i * 4),
    updatedAt: ago(i),
  };
});

export const customersStore = createLocalStore<Customer>({
  key: "data:customers",
  seed: mockCustomers,
  idPrefix: "cust",
});