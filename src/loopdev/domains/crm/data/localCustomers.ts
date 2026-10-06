import { createLocalStore } from "@/lib/localStore";
import { contactListFixtures } from "../../../../../packages/contracts/src/contact-fixtures";

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
  documentType?: string | null;
  documentNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  ordersCount: number;
  tier: "lead" | "standard" | "vip" | "wholesale";
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

function ago(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

const TIERS: LocalCustomer["tier"][] = ["lead", "standard", "vip", "wholesale"];

const seed: LocalCustomer[] = contactListFixtures.map((contact, i) => ({
  id: contact.id,
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  companyName: contact.companyName,
  jobTitle: contact.jobTitle,
  preferredChannel: contact.preferredChannel,
  country: contact.country,
  city: contact.city,
  documentType: i % 3 === 0 ? "PASSPORT" : i % 3 === 1 ? "DNI" : null,
  documentNumber: i % 3 === 0 ? `DOC-${1000 + i}` : i % 3 === 1 ? `DNI-${2000 + i}` : null,
  birthDate: i % 2 === 0 ? `198${i % 10}-0${(i % 8) + 1}-15` : null,
  gender: i % 3 === 0 ? "Female" : i % 3 === 1 ? "Male" : null,
  ordersCount: 1 + ((i * 5) % 24),
  tier: TIERS[i % TIERS.length],
  createdAt: ago(200 - i * 4),
  updatedAt: new Date(`${contact.updatedAt}T12:00:00.000Z`).toISOString(),
}));

export const crmCustomersStore = createLocalStore<LocalCustomer>({
  key: "loopdev:crm:customers",
  seed,
  idPrefix: "crm_cust",
});
