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
} from "../../../packages/contracts/src/contact-port";
import { validateContactMutationInput } from "../../../packages/contracts/src/contact-port";
import { createLocalContactAdapter } from "../../../packages/contracts/src/contact-local-adapter";
import { mobileAuthAdapter, mobileTenantContextAdapter } from "./auth";
import { mobileSupabaseClient } from "./supabase";

const SUPABASE_URL = "https://sukjcsylkljiyvfklxvj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845";

function isUUID(str?: string | null): boolean {
  return typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
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
    organizationId: row.organization_id || "80fce911-57c5-4a83-809f-78df6a3736f7",
    firstName: firstName || "Contacto",
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

async function canFetchRemote(): Promise<boolean> {
  const session = await mobileAuthAdapter.getSession();
  return Boolean(session?.accessToken);
}

export function createMobileContactAdapter(): ContactPort {
  const fallbackOrgId = "local-development-organization";
  const localFallback = createLocalContactAdapter({ organizationId: fallbackOrgId });

  return {
    async listContacts(params: ContactListParams): Promise<ContactPage> {
      if (!params.organizationId || !isUUID(params.organizationId)) {
        return localFallback.listContacts(params);
      }

      const activeOrgId = params.organizationId;

      try {
        const { data: rows, error } = await mobileSupabaseClient
          .from("crm_contacts")
          .select("*")
          .eq("organization_id", activeOrgId)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Mobile listContacts error, using local fallback:", error.message);
          return localFallback.listContacts({ ...params, organizationId: fallbackOrgId });
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

        if (params.identityStatus?.length) {
          items = items.filter((c) => params.identityStatus!.includes(c.identityStatus));
        }
        if (params.preferredChannel?.length) {
          items = items.filter((c) => c.preferredChannel && params.preferredChannel!.includes(c.preferredChannel));
        }

        const sortBy = params.sortBy ?? "updated";
        const sortDirection = params.sortDirection ?? "desc";
        items.sort((left, right) => {
          const value = (c: ContactRecord) => {
            switch (sortBy) {
              case "name":
                return `${c.firstName} ${c.lastName ?? ""}`.trim().toLowerCase();
              case "company":
                return `${c.companyName ?? ""} ${c.jobTitle ?? ""}`.trim().toLowerCase();
              case "channel":
                return (c.preferredChannel ?? "").toLowerCase();
              case "identity":
                return (c.identityStatus ?? "").toLowerCase();
              case "location":
                return `${c.city ?? ""} ${c.stateProvince ?? ""} ${c.country ?? ""}`.trim().toLowerCase();
              case "updated":
              default:
                return c.updatedAt || c.createdAt || "";
            }
          };
          const leftVal = value(left);
          const rightVal = value(right);
          const result = leftVal.localeCompare(rightVal, undefined, { numeric: true });
          return sortDirection === "asc" ? result : -result;
        });

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
        console.warn("Mobile listContacts error, using local fallback:", err);
        return localFallback.listContacts({ ...params, organizationId: fallbackOrgId });
      }
    },

    async getCustomer360(contactId: string): Promise<ContactCustomer360View | null> {
      try {
        const { data: rows, error } = await mobileSupabaseClient
          .from("crm_contacts")
          .select("*")
          .eq("id", contactId);

        if (error || !Array.isArray(rows) || rows.length === 0) {
          return localFallback.getCustomer360(contactId);
        }

        const contact = mapRowToContact(rows[0]);

        const { data: leadsRows } = await mobileSupabaseClient
          .from("crm_leads")
          .select("*")
          .eq("contact_id", contactId);

        const { data: oppsRows } = await mobileSupabaseClient
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
        return localFallback.getCustomer360(contactId);
      }
    },

    async createContact(input: CreateContactInput): Promise<ContactMutationResult> {
      const validation = validateContactMutationInput(input);
      if (validation) return validation;

      if (!input.organizationId || !isUUID(input.organizationId)) {
        return localFallback.createContact(input);
      }

      try {
        const fullLastName = [input.lastName?.trim(), input.secondLastName?.trim()]
          .filter(Boolean)
          .join(" ") || null;

        const payload: Record<string, any> = {
          organization_id: input.organizationId,
          first_name: input.firstName.trim(),
          last_name: fullLastName,
          email: input.email?.trim() || null,
          phone: input.phone?.trim() || null,
          company_name: input.companyName?.trim() || null,
        };

        const { data, error } = await mobileSupabaseClient
          .from("crm_contacts")
          .insert(payload)
          .select();

        if (error || !Array.isArray(data) || data.length === 0) {
          console.warn("Mobile createContact error, using local fallback:", error?.message);
          return localFallback.createContact(input);
        }

        return { status: "success", contact: mapRowToContact(data[0] || payload) };
      } catch (err) {
        return localFallback.createContact(input);
      }
    },

    async updateContact(contactId: string, patch: UpdateContactPatch, expectedUpdatedAt: string): Promise<ContactMutationResult> {
      if (!patch.organizationId || !isUUID(patch.organizationId) || contactId.startsWith("c") || contactId.startsWith("local_")) {
        return localFallback.updateContact(contactId, patch, expectedUpdatedAt);
      }

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

        const { data, error } = await mobileSupabaseClient
          .from("crm_contacts")
          .update(payload)
          .eq("id", contactId)
          .select();

        if (error || !Array.isArray(data) || data.length === 0) {
          return localFallback.updateContact(contactId, patch, expectedUpdatedAt);
        }

        return { status: "success", contact: mapRowToContact(data[0] || { id: contactId, ...payload }) };
      } catch (err) {
        return localFallback.updateContact(contactId, patch, expectedUpdatedAt);
      }
    },

    async archiveContact(contactId: string, expectedUpdatedAt: string): Promise<ContactMutationResult> {
      if (contactId.startsWith("c") || contactId.startsWith("local_") || !isUUID(contactId)) {
        return localFallback.archiveContact(contactId, expectedUpdatedAt);
      }

      try {
        const { error } = await mobileSupabaseClient
          .from("crm_contacts")
          .delete()
          .eq("id", contactId);

        if (error) {
          return localFallback.archiveContact(contactId, expectedUpdatedAt);
        }

        return {
          status: "success",
          contact: {
            id: contactId,
            organizationId: mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId || "",
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
        return localFallback.archiveContact(contactId, expectedUpdatedAt);
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

export const mobileContactAdapter = createMobileContactAdapter();