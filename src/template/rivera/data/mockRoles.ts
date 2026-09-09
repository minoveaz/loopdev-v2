import type { Role } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export const mockRoles: Role[] = [
  {
    id: "r_admin",
    name: "Administrator",
    slug: "admin",
    description: "Full access to every workspace, billing and settings.",
    permissions: ["*"],
    memberCount: 2,
    isSystem: true,
    createdAt: ago(240),
    updatedAt: ago(30),
  },
  {
    id: "r_manager",
    name: "Manager",
    slug: "manager",
    description: "Manages projects, customers and reporting.",
    permissions: ["users.read", "projects.read", "projects.write", "reports.read", "billing.read"],
    memberCount: 5,
    isSystem: true,
    createdAt: ago(240),
    updatedAt: ago(45),
  },
  {
    id: "r_member",
    name: "Member",
    slug: "member",
    description: "Standard team member with project access.",
    permissions: ["projects.read", "projects.write", "users.read"],
    memberCount: 12,
    isSystem: true,
    createdAt: ago(240),
    updatedAt: ago(60),
  },
  {
    id: "r_viewer",
    name: "Viewer",
    slug: "viewer",
    description: "Read-only access to dashboards and reports.",
    permissions: ["projects.read", "reports.read"],
    memberCount: 4,
    isSystem: true,
    createdAt: ago(240),
    updatedAt: ago(120),
  },
  {
    id: "r_billing",
    name: "Billing Admin",
    slug: "billing-admin",
    description: "Manages invoices, subscriptions and payment methods.",
    permissions: ["billing.read", "billing.write", "reports.read"],
    memberCount: 1,
    isSystem: false,
    createdAt: ago(150),
    updatedAt: ago(20),
  },
];

export const rolesStore = createLocalStore<Role>({
  key: "data:roles",
  seed: mockRoles,
  idPrefix: "r",
});
