/** Simulated permission catalog — visual/mock only, not enforced. */
export type SimPermissionKey =
  | "dashboard.view"
  | "users.manage"
  | "projects.manage"
  | "orders.manage"
  | "reports.view"
  | "settings.manage";

export interface SimPermission {
  key: SimPermissionKey;
  label: string;
  description: string;
  group: "Workspace" | "Management" | "Reports & Settings";
}

export const SIM_PERMISSIONS: SimPermission[] = [
  { key: "dashboard.view", label: "Dashboard view", description: "View dashboards and overview pages.", group: "Workspace" },
  { key: "users.manage", label: "Users manage", description: "Invite, edit, and remove team members.", group: "Management" },
  { key: "projects.manage", label: "Projects manage", description: "Create and update projects and tasks.", group: "Management" },
  { key: "orders.manage", label: "Orders manage", description: "Manage orders, refunds, and fulfilment.", group: "Management" },
  { key: "reports.view", label: "Reports view", description: "Access sales, traffic, and activity reports.", group: "Reports & Settings" },
  { key: "settings.manage", label: "Settings manage", description: "Modify workspace and security settings.", group: "Reports & Settings" },
];

export const ALL_SIM_PERMISSION_KEYS: SimPermissionKey[] = SIM_PERMISSIONS.map((p) => p.key);

/**
 * Map the existing fine-grained Role.permissions list to the simulated catalog
 * for visualisation. "*" grants everything.
 */
export function rolePermsToSim(perms: readonly string[]): SimPermissionKey[] {
  if (perms.includes("*")) return [...ALL_SIM_PERMISSION_KEYS];
  const out = new Set<SimPermissionKey>();
  for (const p of perms) {
    if (p.startsWith("projects")) out.add("projects.manage");
    if (p === "users.read" || p === "users.write") out.add("users.manage");
    if (p === "billing.read" || p === "billing.write") out.add("orders.manage");
    if (p === "reports.read") out.add("reports.view");
    if (p === "settings.write") out.add("settings.manage");
  }
  // Everyone can view dashboards by default in this mock.
  out.add("dashboard.view");
  return [...out];
}

export function simToRolePerms(keys: SimPermissionKey[]): string[] {
  if (keys.length === ALL_SIM_PERMISSION_KEYS.length) return ["*"];
  const out = new Set<string>();
  for (const k of keys) {
    if (k === "users.manage") { out.add("users.read"); out.add("users.write"); }
    if (k === "projects.manage") { out.add("projects.read"); out.add("projects.write"); }
    if (k === "orders.manage") { out.add("billing.read"); out.add("billing.write"); }
    if (k === "reports.view") out.add("reports.read");
    if (k === "settings.manage") out.add("settings.write");
  }
  return [...out];
}
