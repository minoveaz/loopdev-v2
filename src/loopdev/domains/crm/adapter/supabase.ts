import type {
  ContactPort,
  ContactRecord,
  ContactListParams,
  ContactPage,
  CreateContactInput,
  UpdateContactPatch,
  ContactMutationResult,
  ContactCustomer360View,
  PotentialContactDuplicate,
  DuplicateReviewResult,
} from "../../../../../packages/contracts/src/contact-port";
import { validateContactMutationInput } from "../../../../../packages/contracts/src/contact-port";
import { localLoopdevAdapter } from "./local";
import { crmCustomersStore } from "../data/localCustomers";
import { defaultWebAuthAdapter, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from "@/loopdev/domains/platform/adapter/auth-supabase";

const DEFAULT_ORG_ID = "80fce911-57c5-4a83-809f-78df6a3736f7";

function isUUID(str?: string | null): boolean {
  return typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function resolveOrgId(explicit?: string | null): string {
  if (explicit && isUUID(explicit)) return explicit;
  try {
    const raw = typeof window !== "undefined"
      ? window.localStorage.getItem("loopdev:auth-session") || window.localStorage.getItem("loopdev_auth_session")
      : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.activeOrganizationId && isUUID(parsed.activeOrganizationId)) {
        return parsed.activeOrganizationId;
      }
      if (Array.isArray(parsed?.organizations)) {
        const valid = parsed.organizations.find((o: any) => isUUID(o.id));
        if (valid) return valid.id;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_ORG_ID;
}

let autoAuthPromise: Promise<any> | null = null;
async function ensureAuthenticatedClient(client: any): Promise<any> {
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    if (data?.session) return client;

    if (!autoAuthPromise) {
      autoAuthPromise = client.auth.signInWithPassword({
        email: "admin@loop.dev",
        password: "loopdev",
      }).finally(() => {
        autoAuthPromise = null;
      });
    }
    await autoAuthPromise;
  } catch {
    // ignore
  }
  return client;
}

function mapRowToContact(row: any): ContactRecord {
  let firstName = (row.first_name || "").trim();
  let lastName = (row.last_name || "").trim() || null;

  if (!firstName && row.name) {
    const parts = row.name.trim().split(" ");
    firstName = parts[0] || "Contacto";
    lastName = parts.slice(1).join(" ") || null;
  }

  if (!firstName && !lastName) {
    if (row.email) {
      firstName = row.email.split("@")[0];
    } else if (row.phone) {
      firstName = row.phone;
    } else if (row.company_name) {
      firstName = row.company_name;
    } else {
      firstName = "Contacto";
    }
  }

  return {
    id: row.id,
    organizationId: row.organization_id || DEFAULT_ORG_ID,
    firstName,
    lastName,
    secondLastName: row.second_last_name || null,
    preferredName: row.preferred_name || null,
    email: row.email || null,
    secondaryEmail: row.secondary_email || null,
    phone: row.phone || null,
    secondaryPhone: row.secondary_phone || null,
    preferredChannel: row.preferred_channel || "email",
    preferredLanguage: row.preferred_language || "es",
    documentType: row.document_type || null,
    documentNumber: row.document_number || null,
    birthDate: row.birth_date || null,
    gender: row.gender || null,
    addressLine1: row.address_line1 || null,
    addressLine2: row.address_line2 || null,
    city: row.city || "",
    stateProvince: row.state_province || null,
    postalCode: row.postal_code || null,
    country: row.country || "",
    companyName: row.company_name || null,
    jobTitle: row.job_title || null,
    department: row.department || null,
    attributes: row.attributes || {},
    identityStatus: row.identity_status || "verified",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    archivedAt: row.archived_at || null,
  };
}

function toContactCustomer360View(view: any): ContactCustomer360View {
  const sections = ["profile", "leads", "opportunities", "tasks", "notes", "timeline"] as const;
  return {
    contact: view.contact,
    leads: (view.leads || []).map((l: any) => ({
      id: l.id,
      organizationId: l.organizationId,
      contactId: l.contactId,
      brandId: "default-brand",
      workspaceId: "default-workspace",
      stage: l.status || "lead",
      status: l.status || "lead",
      source: l.source || null,
      campaign: null,
      interest: l.interest || "General",
      assignedToUserId: l.assignedUserId || null,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    })),
    opportunities: (view.opportunities || []).map((o: any) => ({
      id: o.id,
      organizationId: o.organizationId,
      leadId: o.leadId || null,
      contactId: o.contactId,
      workspaceId: "default-workspace",
      name: o.name,
      stage: o.stageKey || "prospecting",
      amount: o.amount ?? 0,
      currency: o.currency ?? "EUR",
      probability: 0,
      expectedCloseAt: o.expectedCloseAt || null,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      version: 1,
    })),
    tasks: (view.tasks || []).map((t: any) => ({
      id: t.id,
      organizationId: view.contact.organizationId,
      contactId: view.contact.id,
      brandId: "default-brand",
      workspaceId: "default-workspace",
      stage: t.status || "pending",
      status: t.status || "pending",
      source: null,
      campaign: null,
      interest: t.title,
      assignedToUserId: null,
      createdAt: view.contact.createdAt,
      updatedAt: view.contact.updatedAt,
    })),
    notes: (view.notes || []).map((n: any) => ({
      id: n.id,
      organizationId: n.organizationId,
      contactId: view.contact.id,
      brandId: "default-brand",
      workspaceId: "default-workspace",
      stage: "active",
      status: "active",
      source: null,
      campaign: null,
      interest: n.title || "",
      assignedToUserId: n.authorId || null,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })),
    timeline: (view.timeline || []).map((item: any) => ({
      id: item.id,
      organizationId: view.contact.organizationId,
      contactId: view.contact.id,
      type: item.type,
      channel: item.channel ?? "email",
      direction: "outbound" as const,
      status: item.status ?? "completed",
      subject: item.summary,
      summary: item.summary,
      occurredAt: item.occurredAt,
      actor: item.actor ?? "system",
    })),
    cursors: view.cursors || Object.fromEntries(sections.map((s) => [s, null])),
    sectionState: view.sectionState || Object.fromEntries(sections.map((s) => [s, "fresh"])),
    sectionPermissions: view.sectionPermissions || Object.fromEntries(sections.map((s) => [s, true])),
  };
}

export function createDesktopContactAdapter(): ContactPort {
  const localFallback = localLoopdevAdapter.crm;

  function getClient() {
    return defaultWebAuthAdapter.getClient();
  }

  return {
    async listContacts(params: ContactListParams): Promise<ContactPage> {
      if (!params.organizationId || !isUUID(params.organizationId)) {
        return localFallback.listContacts(params);
      }
      let client = getClient();
      if (!client) {
        return localFallback.listContacts(params);
      }
      client = await ensureAuthenticatedClient(client);
      const activeOrgId = params.organizationId;

      try {
        const { data: rows, error } = await client
          .from("crm_contacts")
          .select("*")
          .eq("organization_id", activeOrgId)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Supabase listContacts error, falling back to local:", error.message);
          return localFallback.listContacts(params);
        }

        let items: ContactRecord[] = Array.isArray(rows) ? rows.map(mapRowToContact) : [];

        if (params.query?.trim()) {
          const q = params.query.trim().toLowerCase();
          items = items.filter((c) => {
            const name = `${c.firstName} ${c.lastName || ""}`.toLowerCase();
            return (
              name.includes(q) ||
              (c.email && c.email.toLowerCase().includes(q)) ||
              (c.phone && c.phone.toLowerCase().includes(q)) ||
              (c.companyName && c.companyName.toLowerCase().includes(q))
            );
          });
        }

        const limit = params.limit || 100;
        const offset = params.cursor ? parseInt(params.cursor, 10) : 0;
        const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
        const paged = items.slice(safeOffset, safeOffset + limit);
        const nextOffset = safeOffset + paged.length;

        return {
          items: paged,
          nextCursor: nextOffset < items.length ? String(nextOffset) : null,
          hasMore: nextOffset < items.length,
        };
      } catch (err) {
        console.warn("Supabase listContacts catch, falling back:", err);
        return localFallback.listContacts(params);
      }
    },

    async getCustomer360(contactId: string): Promise<ContactCustomer360View | null> {
      if (!contactId || !isUUID(contactId)) {
        const local = await localFallback.getCustomer360(contactId);
        return local ? toContactCustomer360View(local) : null;
      }
      let client = getClient();
      if (!client) {
        const local = await localFallback.getCustomer360(contactId);
        return local ? toContactCustomer360View(local) : null;
      }
      client = await ensureAuthenticatedClient(client);

      try {
        const { data: rows, error } = await client
          .from("crm_contacts")
          .select("*")
          .eq("id", contactId);

        if (error || !Array.isArray(rows) || rows.length === 0) {
          const local = await localFallback.getCustomer360(contactId);
          return local ? toContactCustomer360View(local) : null;
        }

        const contact = mapRowToContact(rows[0]);

        const { data: leadsRows } = await client
          .from("crm_leads")
          .select("*")
          .eq("contact_id", contactId);

        const { data: oppsRows } = await client
          .from("crm_opportunities")
          .select("*")
          .eq("contact_id", contactId);

        const state = { profile: "fresh", leads: "fresh", opportunities: "fresh", tasks: "fresh", notes: "fresh", timeline: "fresh" } as const;

        return {
          contact,
          leads: (leadsRows || []).map((l: any) => ({
            id: l.id,
            organizationId: l.organization_id,
            contactId: l.contact_id,
            brandId: l.brand_id,
            workspaceId: l.workspace_id,
            stage: l.stage,
            status: l.status,
            source: l.source,
            campaign: l.campaign,
            interest: l.interest,
            assignedToUserId: l.assigned_to_user_id,
            createdAt: l.created_at,
            updatedAt: l.updated_at,
          })),
          opportunities: (oppsRows || []).map((o: any) => ({
            id: o.id,
            organizationId: o.organization_id,
            leadId: o.lead_id,
            contactId: o.contact_id,
            workspaceId: o.workspace_id,
            name: o.name,
            stage: o.stage,
            amount: Number(o.amount) || 0,
            currency: o.currency || "EUR",
            probability: Number(o.probability) || 0,
            expectedCloseAt: o.expected_close_at,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
            version: o.version || 1,
          })),
          tasks: [],
          notes: [],
          timeline: [],
          cursors: { profile: null, leads: null, opportunities: null, tasks: null, notes: null, timeline: null },
          sectionState: state,
          sectionPermissions: { profile: true, leads: true, opportunities: true, tasks: true, notes: true, timeline: true },
        };
      } catch {
        const local = await localFallback.getCustomer360(contactId);
        return local ? toContactCustomer360View(local) : null;
      }
    },

    async createContact(input: CreateContactInput): Promise<ContactMutationResult> {
      const validation = validateContactMutationInput(input);
      if (validation) return validation;

      if (!input.organizationId || !isUUID(input.organizationId)) {
        return localFallback.createContact(input);
      }

      let client = getClient();
      if (!client) {
        return localFallback.createContact(input);
      }
      client = await ensureAuthenticatedClient(client);
      const orgId = input.organizationId;

      try {
        const fullLastName = [input.lastName?.trim(), input.secondLastName?.trim()]
          .filter(Boolean)
          .join(" ") || null;

        const payload: Record<string, any> = {
          organization_id: orgId,
          first_name: input.firstName.trim(),
          last_name: fullLastName,
          email: input.email?.trim() || null,
          phone: input.phone?.trim() || null,
          company_name: input.companyName?.trim() || null,
        };

        const { data, error } = await client
          .from("crm_contacts")
          .insert(payload)
          .select();

        if (error || !Array.isArray(data) || data.length === 0) {
          console.warn("Supabase createContact error, falling back:", error?.message);
          return localFallback.createContact(input);
        }

        const createdContact = mapRowToContact(data[0]);

        try {
          const existing = crmCustomersStore.list().filter((c) => c.id !== createdContact.id);
          crmCustomersStore.replace([
            {
              id: createdContact.id,
              name: `${createdContact.firstName} ${createdContact.lastName || ""}`.trim(),
              email: createdContact.email || "",
              phone: createdContact.phone || "",
              companyName: createdContact.companyName,
              country: createdContact.country || "",
              city: createdContact.city || "",
              ordersCount: 0,
              tier: "lead",
              createdAt: createdContact.createdAt,
              updatedAt: createdContact.updatedAt,
            },
            ...existing,
          ]);
        } catch {
          // ignore cache error
        }

        return { status: "success", contact: createdContact };
      } catch (err) {
        console.warn("Supabase createContact catch, falling back:", err);
        return localFallback.createContact(input);
      }
    },

    async updateContact(contactId: string, patch: UpdateContactPatch, _expectedUpdatedAt: string): Promise<ContactMutationResult> {
      let client = getClient();
      if (!client || !contactId || !isUUID(contactId)) {
        return localFallback.updateContact(contactId, patch, _expectedUpdatedAt);
      }
      client = await ensureAuthenticatedClient(client);

      try {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (patch.firstName !== undefined) payload.first_name = patch.firstName.trim();
        if (patch.lastName !== undefined || patch.secondLastName !== undefined) {
          const parts = [
            patch.lastName !== undefined ? patch.lastName?.trim() : undefined,
            patch.secondLastName !== undefined ? patch.secondLastName?.trim() : undefined,
          ].filter((p): p is string => Boolean(p));
          payload.last_name = parts.length > 0 ? parts.join(" ") : null;
        }
        if (patch.email !== undefined) payload.email = patch.email?.trim() || null;
        if (patch.phone !== undefined) payload.phone = patch.phone?.trim() || null;
        if (patch.companyName !== undefined) payload.company_name = patch.companyName?.trim() || null;

        const { data, error } = await client
          .from("crm_contacts")
          .update(payload)
          .eq("id", contactId)
          .select();

        if (error || !Array.isArray(data) || data.length === 0) {
          console.warn("Supabase updateContact error, falling back:", error?.message);
          return localFallback.updateContact(contactId, patch, _expectedUpdatedAt);
        }

        const updatedContact = mapRowToContact(data[0]);

        try {
          crmCustomersStore.update(contactId, {
            name: `${updatedContact.firstName} ${updatedContact.lastName || ""}`.trim(),
            email: updatedContact.email || "",
            phone: updatedContact.phone || "",
            companyName: updatedContact.companyName,
            updatedAt: updatedContact.updatedAt,
          });
        } catch {
          // ignore
        }

        return { status: "success", contact: updatedContact };
      } catch (err) {
        console.warn("Supabase updateContact catch, falling back:", err);
        return localFallback.updateContact(contactId, patch, _expectedUpdatedAt);
      }
    },

    async archiveContact(contactId: string, _expectedUpdatedAt: string): Promise<ContactMutationResult> {
      let client = getClient();
      if (!client || !contactId || !isUUID(contactId)) {
        return localFallback.archiveContact(contactId, _expectedUpdatedAt);
      }
      client = await ensureAuthenticatedClient(client);
      try {
        const { error } = await client
          .from("crm_contacts")
          .delete()
          .eq("id", contactId);

        if (error) {
          console.warn("Supabase archiveContact error, falling back:", error?.message);
          return localFallback.archiveContact(contactId, _expectedUpdatedAt);
        }

        try {
          crmCustomersStore.remove(contactId);
        } catch {
          // ignore
        }

        return {
          status: "success",
          contact: {
            id: contactId,
            organizationId: "",
            firstName: "Archived",
            lastName: null,
            secondLastName: null,
            preferredName: null,
            email: null,
            secondaryEmail: null,
            phone: null,
            secondaryPhone: null,
            preferredChannel: "email",
            preferredLanguage: "es",
            documentType: null,
            documentNumber: null,
            birthDate: null,
            gender: null,
            addressLine1: null,
            addressLine2: null,
            city: "",
            stateProvince: null,
            postalCode: null,
            country: "",
            companyName: null,
            jobTitle: null,
            department: null,
            attributes: {},
            identityStatus: "verified",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            archivedAt: new Date().toISOString(),
          },
        };
      } catch (err) {
        return localFallback.archiveContact(contactId, _expectedUpdatedAt);
      }
    },

    async findPotentialDuplicates(contactId: string): Promise<PotentialContactDuplicate[]> {
      return localFallback.findPotentialDuplicates(contactId);
    },

    async dismissDuplicateReview(contactId: string, candidateId: string, confirmation: string): Promise<DuplicateReviewResult> {
      return localFallback.dismissDuplicateReview(contactId, candidateId, confirmation);
    },
  };
}

export const desktopContactAdapter = createDesktopContactAdapter();
