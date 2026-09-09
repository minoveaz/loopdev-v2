import type { Email } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const seed: Omit<Email, "id" | "createdAt" | "updatedAt">[] = [
  { from: { name: "Atlas Coffee Co.",  email: "ap@atlascoffee.co" },     to: "you@rivera.app", subject: "Re: Atlas Rebrand — milestone 2", preview: "Looks great — a few notes from our marketing lead before sign-off…", body: "Hi team,\n\nLooks great — a few notes from our marketing lead before sign-off:\n\n• Increase the wordmark contrast on the navy background.\n• Tighten the spacing on the secondary lockup.\n\nOtherwise we're aligned. Let's plan a kickoff for the rollout next week.\n\nThanks,\nElena", folder: "inbox", read: false, starred: true,  labels: ["client"] },
  { from: { name: "Harbor Logistics",  email: "ap@harborlogi.com" },     to: "you@rivera.app", subject: "Sprint 14 — feedback",            preview: "The shipment-tracking flow is testing well with our pilot users…", body: "Sprint 14 looks tight. The shipment-tracking flow is testing well with our pilot users. Two points:\n\n1) The empty state copy needs work.\n2) Notifications should be opt-in.\n\nLet's review on Friday.", folder: "inbox", read: false, starred: false, labels: ["client", "product"] },
  { from: { name: "Stripe",            email: "no-reply@stripe.com" },   to: "you@rivera.app", subject: "Your monthly summary",            preview: "Your March payouts have been deposited. Total: $48,210.00.",       body: "Hi there,\n\nYour March payouts have been deposited. Total: $48,210.00 across 14 customers.\n\nView details in your Stripe dashboard.", folder: "inbox", read: true,  starred: false, labels: ["billing"] },
  { from: { name: "Sofia Lin",         email: "sofia@rivera.app" },      to: "you@rivera.app", subject: "Coral catalog — handoff",         preview: "All assets are in the shared drive. Final spec doc attached…",      body: "All assets are in the shared drive. Final spec doc attached. I'll archive the working files at the end of the week.", folder: "inbox", read: true,  starred: true,  labels: ["team"] },
  { from: { name: "GitHub",            email: "noreply@github.com" },    to: "you@rivera.app", subject: "[rivera/web] PR #284 ready",      preview: "linnea opened a pull request: 'Refactor billing cycles' …",         body: "linnea opened a pull request: 'Refactor billing cycles' — 12 files changed, +320 / −180.", folder: "inbox", read: true,  starred: false, labels: ["dev"] },
  { from: { name: "Driftwood Studio",  email: "hi@driftwood.studio" },   to: "you@rivera.app", subject: "Discovery scheduling",            preview: "Could we move our intro call to next Wednesday?",                    body: "Could we move our intro call to next Wednesday morning? Apologies for the late notice.", folder: "inbox", read: false, starred: false, labels: ["client"] },
  { from: { name: "Northwind Supply",  email: "billing@northwind.io" },  to: "you@rivera.app", subject: "Invoice INV-2026-0039 reminder",  preview: "Friendly reminder that this invoice is now 30 days overdue.",        body: "Friendly reminder that this invoice is now 30 days overdue. Please advise on payment timing.", folder: "inbox", read: true,  starred: false, labels: ["billing"] },
  { from: { name: "Marcus Bell",       email: "marcus@rivera.app" },     to: "team@rivera.app", subject: "Q2 OKRs — final draft",          preview: "Final draft attached. Quick read; comments by EOD please.",          body: "Final draft attached. Quick read; comments by EOD please.", folder: "sent",  read: true,  starred: false, labels: ["internal"] },
  { from: { name: "You",               email: "you@rivera.app" },        to: "ap@atlascoffee.co", subject: "Atlas Rebrand — milestone 2", preview: "Sharing milestone 2 deliverables for review.",                       body: "Sharing milestone 2 deliverables for review. Looking forward to your notes.", folder: "sent", read: true, starred: false, labels: ["client"] },
  { from: { name: "You",               email: "you@rivera.app" },        to: "hi@sagemag.uk",   subject: "Re: Editorial templates",       preview: "Drafts attached. Two layout variants — let me know which feels…",   body: "Drafts attached. Two layout variants — let me know which feels closer to the brand.", folder: "drafts", read: false, starred: false, labels: [] },
];

const now = new Date().toISOString();
export const mockEmails: Email[] = seed.map((e, i) => ({
  ...e,
  id: `em_${String(i + 1).padStart(2, "0")}`,
  createdAt: ago(i),
  updatedAt: ago(i),
}));

export const emailsStore = createLocalStore<Email>({
  key: "data:emails",
  seed: mockEmails,
  idPrefix: "em",
});