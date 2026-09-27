import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultWebAuthAdapter } from "../../platform/adapter/auth-supabase";
import type { OrganizationId } from "../../platform/types";
import { SettingsAdapterError, type SettingsAdapter } from "./index";
import type {
  InviteSettingsUserInput,
  OrganizationSettings,
  SettingsSnapshot,
  SettingsUser,
  UpdateOrganizationSettingsInput,
} from "../types";

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  timezone: string | null;
  locale: "en" | "es" | null;
};

type MemberRow = {
  user_id: string;
  organization_id: string;
  role: SettingsUser["role"];
  status: SettingsUser["status"] | "revoked";
  created_at: string;
  invited_at: string | null;
  last_active_at: string | null;
  full_name: string | null;
  email: string | null;
};

function client(): SupabaseClient {
  const value = defaultWebAuthAdapter.getClient();
  if (!value) throw new SettingsAdapterError("Supabase is not configured.", "invalid");
  return value;
}

function mapError(error: { code?: string; message: string }): SettingsAdapterError {
  if (error.code === "42501" || /permission|policy|forbidden/i.test(error.message)) {
    return new SettingsAdapterError("You do not have permission to manage this organization.", "forbidden");
  }
  if (error.code === "PGRST116") return new SettingsAdapterError("The requested organization or user was not found.", "not-found");
  return new SettingsAdapterError(error.message, "invalid");
}

function mapMember(row: MemberRow): SettingsUser {
  return {
    id: row.user_id,
    organizationId: row.organization_id,
    name: row.full_name || row.email?.split("@")[0] || "User",
    email: row.email || "",
    role: row.role,
    status: row.status === "revoked" ? "suspended" : row.status,
    invitedAt: row.invited_at ?? row.created_at,
    lastActiveAt: row.last_active_at,
  };
}

async function getSnapshot(organizationId: OrganizationId): Promise<SettingsSnapshot> {
  const supabase = client();
  const [{ data: organization, error: organizationError }, { data: members, error: membersError }] = await Promise.all([
    supabase.from("organizations").select("id, name, slug, timezone, locale").eq("id", organizationId).single(),
    supabase.rpc("list_organization_members", { target_organization_id: organizationId }),
  ]);
  if (organizationError) throw mapError(organizationError);
  if (membersError) throw mapError(membersError);
  const row = organization as OrganizationRow;
  return {
    organization: {
      organizationId: row.id,
      name: row.name,
      slug: row.slug,
      timezone: row.timezone || "UTC",
      locale: row.locale || "en",
    },
    users: ((members || []) as MemberRow[]).filter((member) => member.status !== "revoked").map(mapMember),
  };
}

export const supabaseSettingsAdapter: SettingsAdapter = {
  getSnapshot,

  async updateOrganization(organizationId, input: UpdateOrganizationSettingsInput) {
    const { data, error } = await client().rpc("update_organization_settings", {
      target_organization_id: organizationId,
      organization_name: input.name.trim(),
      organization_slug: input.slug.trim().toLowerCase(),
      organization_timezone: input.timezone.trim(),
      organization_locale: input.locale,
    });
    if (error) throw mapError(error);
    return {
      organizationId,
      name: data.name,
      slug: data.slug,
      timezone: data.timezone || "UTC",
      locale: data.locale || "en",
    };
  },

  async inviteUser(organizationId, input: InviteSettingsUserInput) {
    const { data, error } = await client().functions.invoke("invite-organization-member", {
      body: { organizationId, name: input.name.trim(), email: input.email.trim().toLowerCase(), role: input.role },
    });
    if (error) throw mapError(error);
    if (!data?.user) throw new SettingsAdapterError("The invitation response was invalid.", "invalid");
    return mapMember(data.user as MemberRow);
  },

  async updateUserRole(organizationId, userId, role) {
    const { data, error } = await client().rpc("update_organization_member", {
      target_organization_id: organizationId,
      target_user_id: userId,
      next_role: role,
      next_status: null,
    });
    if (error) throw mapError(error);
    return mapMember(data as MemberRow);
  },

  async updateUserStatus(organizationId, userId, status) {
    const { data, error } = await client().rpc("update_organization_member", {
      target_organization_id: organizationId,
      target_user_id: userId,
      next_role: null,
      next_status: status,
    });
    if (error) throw mapError(error);
    return mapMember(data as MemberRow);
  },

  async removeUser(organizationId, userId) {
    const { error } = await client().rpc("remove_organization_member", {
      target_organization_id: organizationId,
      target_user_id: userId,
    });
    if (error) throw mapError(error);
  },
};
