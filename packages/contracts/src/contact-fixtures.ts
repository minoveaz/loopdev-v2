export type ContactListFixture = {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  jobTitle: string;
  preferredChannel: "email" | "phone" | "whatsapp";
  identityStatus: "verified" | "pending_identity_review";
  country: string;
  city: string;
  updatedAt: string;
};

const names = [
  "Aria Blackwood", "Theo Marquez", "Indira Vasquez", "Kenji Watanabe",
  "Salma El-Amin", "Joaquin Reyes", "Margot Lefevre", "Soren Hayes",
  "Lila Okonkwo", "Felix Brennan", "Niamh O'Connor", "Hiroto Tanaka",
  "Beatriz Santos", "Ezra Klein", "Yuki Sato", "Camille Dubois",
  "Mateo Rivas", "Ananya Iyer", "Oliver Pierce", "Zara Holloway",
];
const countries = ["USA", "UK", "Spain", "Japan", "France", "Brazil", "Germany", "India"];
const cities = ["NYC", "London", "Madrid", "Tokyo", "Paris", "Sao Paulo", "Berlin", "Mumbai"];

export const contactListFixtures: ContactListFixture[] = names.map((name, index) => ({
  id: `crm_cust_${index + 1}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
  phone: `+1 555 0${100 + index}`,
  companyName: index % 2 === 0 ? "LoopDev workspace" : "Customer network",
  jobTitle: index % 2 === 0 ? "Customer" : "Decision maker",
  preferredChannel: index % 3 === 0 ? "email" : index % 3 === 1 ? "phone" : "whatsapp",
  identityStatus: "verified",
  country: countries[index % countries.length],
  city: cities[index % cities.length],
  updatedAt: `2026-09-${String(Math.max(1, 13 - (index % 12))).padStart(2, "0")}`,
}));
