import type { Ticket } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const SUBJECTS = [
  "Cannot export invoice as PDF",
  "Two-factor reset request",
  "Custom domain not verifying",
  "Stripe webhook returning 500",
  "Need help importing customers",
  "Dashboard chart shows wrong totals",
  "Slow load on Orders page",
  "Request: bulk reassign tasks",
  "Email notifications not arriving",
  "Permissions on Reports module",
  "Missing data after migration",
  "API rate limit clarification",
];
const PRIORITIES: Ticket["priority"][] = ["low", "normal", "normal", "high", "urgent"];
const STATUSES: Ticket["status"][] = ["open", "open", "pending", "resolved", "closed"];
const CATEGORIES = ["Billing", "Account", "Bug", "Feature", "How-to"];

export const mockTickets: Ticket[] = SUBJECTS.map((subject, i) => ({
  id: `tkt_${i + 1}`,
  reference: `TKT-${(7100 + i).toString()}`,
  subject,
  description: `${subject}. Steps to reproduce and screenshots attached.`,
  requester: ["Aria B.", "Theo M.", "Indira V.", "Kenji W.", "Salma E."][i % 5],
  requesterEmail: `user${i + 1}@example.com`,
  assigneeId: i % 3 === 0 ? undefined : `u_${(i % 6) + 1}`,
  status: STATUSES[i % STATUSES.length],
  priority: PRIORITIES[i % PRIORITIES.length],
  category: CATEGORIES[i % CATEGORIES.length],
  lastReplyAt: ago(i % 10, 2),
  createdAt: ago(20 - (i % 18)),
  updatedAt: ago(i % 8),
}));

export const ticketsStore = createLocalStore<Ticket>({
  key: "data:tickets",
  seed: mockTickets,
  idPrefix: "tkt",
});