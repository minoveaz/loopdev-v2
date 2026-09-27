import type { OrganizationId } from "../platform/types";

export type SettingsUserStatus = "active" | "pending" | "suspended";
export type SettingsRole = "owner" | "admin" | "member";
export type SettingsLocale = "en" | "es";

export interface SettingsUser {
  id: string;
  organizationId: OrganizationId;
  name: string;
  email: string;
  role: SettingsRole;
  status: SettingsUserStatus;
  invitedAt: string | null;
  lastActiveAt: string | null;
}

export interface OrganizationSettings {
  organizationId: OrganizationId;
  name: string;
  slug: string;
  timezone: string;
  locale: SettingsLocale;
}

export interface SettingsSnapshot {
  organization: OrganizationSettings;
  users: SettingsUser[];
}

export interface UpdateOrganizationSettingsInput {
  name: string;
  slug: string;
  timezone: string;
  locale: SettingsLocale;
}

export interface InviteSettingsUserInput {
  name: string;
  email: string;
  role: Exclude<SettingsRole, "owner">;
}
