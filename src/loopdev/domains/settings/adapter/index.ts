import { localSettingsAdapter } from "./local";
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

export const settingsAdapter: SettingsAdapter = localSettingsAdapter;
export { localSettingsAdapter };
export type {
  InviteSettingsUserInput,
  OrganizationSettings,
  SettingsSnapshot,
  SettingsUser,
  UpdateOrganizationSettingsInput,
} from "../types";
