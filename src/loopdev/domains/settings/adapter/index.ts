import { localSettingsAdapter } from "./local";
import { supabaseSettingsAdapter } from "./supabase";
import type {
  InviteSettingsUserInput,
  OrganizationSettings,
  SettingsSnapshot,
  SettingsUser,
  UpdateOrganizationSettingsInput,
} from "../types";
import type { OrganizationId } from "../../platform/types";

export interface SettingsAdapter {
  getSnapshot(organizationId: OrganizationId): Promise<SettingsSnapshot>;
  updateOrganization(
    organizationId: OrganizationId,
    input: UpdateOrganizationSettingsInput,
  ): Promise<OrganizationSettings>;
  inviteUser(organizationId: OrganizationId, input: InviteSettingsUserInput): Promise<SettingsUser>;
  updateUserRole(organizationId: OrganizationId, userId: string, role: SettingsUser["role"]): Promise<SettingsUser>;
  updateUserStatus(
    organizationId: OrganizationId,
    userId: string,
    status: SettingsUser["status"],
  ): Promise<SettingsUser>;
  removeUser(organizationId: OrganizationId, userId: string): Promise<void>;
}

export class SettingsAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: "forbidden" | "invalid" | "not-found",
  ) {
    super(message);
    this.name = "SettingsAdapterError";
  }
}

export const settingsAdapter: SettingsAdapter = supabaseSettingsAdapter;
export { localSettingsAdapter };
export { supabaseSettingsAdapter };
export type {
  InviteSettingsUserInput,
  OrganizationSettings,
  SettingsSnapshot,
  SettingsUser,
  UpdateOrganizationSettingsInput,
} from "../types";
