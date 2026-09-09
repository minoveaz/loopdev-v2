import type { Invoice } from "@/types";
import { ago, inDays, dateOnly } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export const mockInvoices: Invoice[] = [
  {
    id: "in_01", number: "INV-2026-0041",
    customer: "Atlas Coffee Co.", customerEmail: "ap@atlascoffee.co",
    issueDate: dateOnly(ago(20)), dueDate: dateOnly(inDays(10)),
    status: "sent", currency: "USD",
    subtotal: 12000, tax: 960, total: 12960,
    lines: [
      { description: "Atlas Rebrand — milestone 2", quantity: 1, unitPrice: 8000 },
      { description: "Photography licensing",        quantity: 1, unitPrice: 4000 },
    ],
    createdAt: ago(20), updatedAt: ago(20),
  },
  {
    id: "in_02", number: "INV-2026-0042",
    customer: "Harbor Logistics", customerEmail: "ap@harborlogi.com",
    issueDate: dateOnly(ago(15)), dueDate: dateOnly(inDays(15)),
    status: "sent", currency: "USD",
    subtotal: 24000, tax: 1920, total: 25920,
    lines: [{ description: "Harbor App v2 — sprint retainer", quantity: 4, unitPrice: 6000 }],
    createdAt: ago(15), updatedAt: ago(15),
  },
  {
    id: "in_03", number: "INV-2026-0040",
    customer: "Coral Boutique", customerEmail: "buy@coral.shop",
    issueDate: dateOnly(ago(45)), dueDate: dateOnly(ago(15)),
    status: "paid", currency: "EUR",
    subtotal: 9500, tax: 1900, total: 11400,
    lines: [{ description: "Coral Catalog — final delivery", quantity: 1, unitPrice: 9500 }],
    createdAt: ago(45), updatedAt: ago(15),
  },
  {
    id: "in_04", number: "INV-2026-0039",
    customer: "Northwind Supply", customerEmail: "billing@northwind.io",
    issueDate: dateOnly(ago(60)), dueDate: dateOnly(ago(30)),
    status: "overdue", currency: "USD",
    subtotal: 18000, tax: 1440, total: 19440,
    lines: [{ description: "Northwind ERP — discovery phase", quantity: 1, unitPrice: 18000 }],
    createdAt: ago(60), updatedAt: ago(20),
  },
  {
    id: "in_05", number: "INV-2026-0043",
    customer: "Sage Magazine", customerEmail: "ops@sagemag.uk",
    issueDate: dateOnly(ago(2)), dueDate: dateOnly(inDays(28)),
    status: "draft", currency: "GBP",
    subtotal: 6800, tax: 1360, total: 8160,
    lines: [
      { description: "Sage Editorial — design",    quantity: 1, unitPrice: 4000 },
      { description: "Sage Editorial — engineering",quantity: 1, unitPrice: 2800 },
    ],
    createdAt: ago(2), updatedAt: ago(2),
  },
  {
    id: "in_06", number: "INV-2026-0038",
    customer: "Driftwood Studio", customerEmail: "hi@driftwood.studio",
    issueDate: dateOnly(ago(75)), dueDate: dateOnly(ago(45)),
    status: "void", currency: "USD",
    subtotal: 1500, tax: 0, total: 1500,
    lines: [{ description: "Discovery workshop — cancelled", quantity: 1, unitPrice: 1500 }],
    createdAt: ago(75), updatedAt: ago(40),
  },
];

export const invoicesStore = createLocalStore<Invoice>({
  key: "data:invoices",
  seed: mockInvoices,
  idPrefix: "in",
});
