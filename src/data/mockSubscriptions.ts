import type { SubscriptionPlan } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const PLANS: Array<Omit<SubscriptionPlan, "id" | "currency" | "createdAt" | "updatedAt">> = [
  {
    name: "Starter",
    description: "Everything to get a small team running.",
    price: 0,
    interval: "monthly",
    features: ["Up to 5 users", "Community support", "1 GB storage"],
    isPopular: false,
    activeSubscribers: 1240,
  },
  {
    name: "Growth",
    description: "For scaling teams that need automation.",
    price: 29,
    interval: "monthly",
    features: ["Up to 25 users", "Email support", "25 GB storage", "Automation"],
    isPopular: true,
    activeSubscribers: 612,
  },
  {
    name: "Business",
    description: "Advanced controls and reporting.",
    price: 79,
    interval: "monthly",
    features: ["Unlimited users", "Priority support", "200 GB storage", "Audit log"],
    isPopular: false,
    activeSubscribers: 184,
  },
  {
    name: "Enterprise",
    description: "Custom contracts, SLAs, and onboarding.",
    price: 249,
    interval: "monthly",
    features: ["SSO/SAML", "Dedicated CSM", "Custom limits", "99.99% SLA"],
    isPopular: false,
    activeSubscribers: 42,
  },
];

export const mockSubscriptionPlans: SubscriptionPlan[] = PLANS.map((p, i) => ({
  id: `plan_${i + 1}`,
  ...p,
  currency: "USD" as const,
  createdAt: ago(365 - i * 30),
  updatedAt: ago(i),
}));

export const subscriptionPlansStore = createLocalStore<SubscriptionPlan>({
  key: "data:plans",
  seed: mockSubscriptionPlans,
  idPrefix: "plan",
});