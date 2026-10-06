import { storage } from "@/lib/storage";
import { platformAdapter } from "../../platform/adapter";
import type { OrganizationId } from "../../platform/types";
import { SettingsAdapterError, type SettingsAdapter } from "./index";
import type {
  InviteSettingsUserInput,
  OrganizationSettings,
  SettingsSnapshot,
  SettingsUser,
  UpdateOrganizationSettingsInput,
} from "../types";

const STORAGE_KEY = "loopdev:settings";
type SettingsStore = Record<string, SettingsSnapshot>;

function now() {
  return new Date().toISOString();
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function createDefaultSnapshot(organizationId: OrganizationId): SettingsSnapshot {
  const timestamp = now();
  return {
    organization: {
      organizationId,
      name: "LoopDev Organization",
      slug: slugify(organizationId),
      timezone: "UTC",
      locale: "en",
    },
    users: [
      {
        id: `owner:${organizationId}`,
        organizationId,
        name: "Workspace owner",
        email: "owner@example.com",
        role: "owner",
        status: "active",
        invitedAt: null,
        lastActiveAt: timestamp,
      },
    ],
  };
}

function readStore() {
  return storage.get<SettingsStore>(STORAGE_KEY, {});
}

function getSnapshot(organizationId: OrganizationId) {
  const store = readStore();
  const snapshot = store[organizationId] ?? createDefaultSnapshot(organizationId);
  if (!store[organizationId]) storage.set(STORAGE_KEY, { ...store, [organizationId]: snapshot });
  return snapshot;
}

function assertOrganization(organizationId: OrganizationId) {
  if (platformAdapter.getOrganizationContext().organizationId !== organizationId) {
    throw new SettingsAdapterError("The requested organization is not active.", "forbidden");
  }
  platformAdapter.assertPermission("organization.read", { organizationId });
}

function writeSnapshot(snapshot: SettingsSnapshot) {
  const store = readStore();
  storage.set(STORAGE_KEY, { ...store, [snapshot.organization.organizationId]: snapshot });
}

export const localSettingsAdapter: SettingsAdapter = {
  async getSnapshot(organizationId) {
    assertOrganization(organizationId);
    return structuredClone(getSnapshot(organizationId));
  },

  async updateOrganization(organizationId, input: UpdateOrganizationSettingsInput) {
    assertOrganization(organizationId);
    if (!input.name.trim() || !input.slug.trim() || !input.timezone.trim()) {
      throw new SettingsAdapterError("Organization name, slug, and timezone are required.", "invalid");
    }
    const snapshot = getSnapshot(organizationId);
    const organization = { ...snapshot.organization, ...input, name: input.name.trim(), slug: slugify(input.slug) };
    if (!organization.slug) throw new SettingsAdapterError("The organization slug is invalid.", "invalid");
    writeSnapshot({ ...snapshot, organization });
    return structuredClone(organization);
  },

  async inviteUser(organizationId, input: InviteSettingsUserInput) {
    assertOrganization(organizationId);
    if (!input.name.trim() || !input.email.includes("@")) {
      throw new SettingsAdapterError("A name and valid email are required.", "invalid");
    }
    const snapshot = getSnapshot(organizationId);
    if (snapshot.users.some((user) => user.email.toLowerCase() === input.email.trim().toLowerCase())) {
      throw new SettingsAdapterError("A user with this email already exists.", "invalid");
    }
    const user: SettingsUser = {
      id: `user:${organizationId}:${crypto.randomUUID()}`,
      organizationId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      status: "pending",
      invitedAt: now(),
      lastActiveAt: null,
    };
    writeSnapshot({ ...snapshot, users: [...snapshot.users, user] });
    return structuredClone(user);
  },

  async updateUserRole(organizationId, userId, role) {
    assertOrganization(organizationId);
    const snapshot = getSnapshot(organizationId);
    const user = snapshot.users.find((candidate) => candidate.id === userId);
    if (!user) throw new SettingsAdapterError("User not found in the active organization.", "not-found");
    const updated = { ...user, role };
    writeSnapshot({ ...snapshot, users: snapshot.users.map((candidate) => candidate.id === userId ? updated : candidate) });
    return structuredClone(updated);
  },

  async updateUserStatus(organizationId, userId, status) {
    assertOrganization(organizationId);
    const snapshot = getSnapshot(organizationId);
    const user = snapshot.users.find((candidate) => candidate.id === userId);
    if (!user) throw new SettingsAdapterError("User not found in the active organization.", "not-found");
    if (user.role === "owner" && status !== "active") {
      throw new SettingsAdapterError("The organization owner must remain active.", "invalid");
    }
    const updated = { ...user, status };
    writeSnapshot({ ...snapshot, users: snapshot.users.map((candidate) => candidate.id === userId ? updated : candidate) });
    return structuredClone(updated);
  },

  async removeUser(organizationId, userId) {
    assertOrganization(organizationId);
    const snapshot = getSnapshot(organizationId);
    const user = snapshot.users.find((candidate) => candidate.id === userId);
    if (!user) throw new SettingsAdapterError("User not found in the active organization.", "not-found");
    if (user.role === "owner") throw new SettingsAdapterError("The organization owner cannot be removed.", "invalid");
    writeSnapshot({ ...snapshot, users: snapshot.users.filter((candidate) => candidate.id !== userId) });
  },
};
