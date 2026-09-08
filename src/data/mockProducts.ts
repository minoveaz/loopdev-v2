import type { Product } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export const mockProducts: Product[] = [
  { id: "pr_01", sku: "RV-PLN-PRO",   name: "Rivera Pro Plan",        description: "Annual subscription · advanced reporting & SSO.", category: "Subscription", price:  89, currency: "USD", stock: 9999, status: "active",       rating: 4.8, sales: 412, createdAt: ago(180), updatedAt: ago(2)   },
  { id: "pr_02", sku: "RV-PLN-TEAM",  name: "Rivera Team Plan",       description: "Up to 10 seats · standard reporting.",            category: "Subscription", price:  29, currency: "USD", stock: 9999, status: "active",       rating: 4.6, sales: 980, createdAt: ago(180), updatedAt: ago(2)   },
  { id: "pr_03", sku: "RV-TMP-CRM",   name: "CRM Template Pack",      description: "Pre-built dashboard layouts for sales teams.",    category: "Templates",    price:  39, currency: "USD", stock:  120, status: "active",       rating: 4.4, sales: 142, createdAt: ago(140), updatedAt: ago(20)  },
  { id: "pr_04", sku: "RV-TMP-CMS",   name: "Editorial CMS Kit",      description: "Templates for editorial publications.",           category: "Templates",    price:  49, currency: "EUR", stock:   85, status: "active",       rating: 4.5, sales:  88, createdAt: ago(120), updatedAt: ago(8)   },
  { id: "pr_05", sku: "RV-ADD-AI",    name: "AI Insights Add-on",     description: "Forecasts and anomaly detection.",                category: "Add-on",       price:  19, currency: "USD", stock: 9999, status: "active",       rating: 4.7, sales: 305, createdAt: ago(90),  updatedAt: ago(0,4) },
  { id: "pr_06", sku: "RV-ADD-SSO",   name: "SSO Connector",          description: "SAML & OIDC enterprise SSO add-on.",              category: "Add-on",       price:  49, currency: "USD", stock: 9999, status: "active",       rating: 4.3, sales:  62, createdAt: ago(150), updatedAt: ago(15)  },
  { id: "pr_07", sku: "RV-MER-MUG",   name: "Rivera Branded Mug",     description: "Ceramic mug — limited edition.",                  category: "Merch",        price:  16, currency: "USD", stock:    0, status: "out_of_stock", rating: 4.9, sales: 220, createdAt: ago(95),  updatedAt: ago(3)   },
  { id: "pr_08", sku: "RV-MER-TEE",   name: "Rivera T-shirt",         description: "Heavyweight cotton — Coastal capsule.",           category: "Merch",        price:  28, currency: "USD", stock:   38, status: "active",       rating: 4.6, sales: 175, createdAt: ago(75),  updatedAt: ago(1)   },
  { id: "pr_09", sku: "RV-PLN-ENT",   name: "Rivera Enterprise",      description: "Custom contract · dedicated success manager.",     category: "Subscription", price: 499, currency: "USD", stock: 9999, status: "active",       rating: 5.0, sales:  18, createdAt: ago(60),  updatedAt: ago(0,8) },
  { id: "pr_10", sku: "RV-LEG-BOOK",  name: "Workflow Playbook",      description: "PDF guide — 80 pages of admin workflows.",        category: "Resources",    price:  12, currency: "USD", stock: 9999, status: "draft",        rating: 0,   sales:   0, createdAt: ago(8),   updatedAt: ago(8)   },
];

export const productsStore = createLocalStore<Product>({
  key: "data:products",
  seed: mockProducts,
  idPrefix: "pr",
});
