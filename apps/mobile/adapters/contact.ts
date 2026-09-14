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

async function getHeaders(): Promise<HeadersInit> {
  const session = await mobileAuthAdapter.getSession();
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  } else {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  return headers;
}

export function createMobileContactAdapter(): ContactPort {
  const localFallback = createLocalContactAdapter({ organizationId: "local-development-organization" });

  return {
    async listContacts(params: ContactListParams): Promise<ContactPage> {
      const activeOrgId =
        params.organizationId && isUUID(params.organizationId)
          ? params.organizationId
          : mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId || "80fce911-57c5-4a83-809f-78df6a3736f7";

      try {
        const queryParams = new URLSearchParams();
        queryParams.set("organization_id", `eq.${activeOrgId}`);
        queryParams.set("select", "*");

        const headers = await getHeaders();
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/crm_contacts?${queryParams.toString()}`, {
          method: "GET",
          headers,
        });

        if (!resp.ok) {
          return localFallback.listContacts(params);
        }

        const rows = await resp.json();
        let items: ContactRecord[] = Array.isArray(rows) && rows.length > 0 ? rows.map(mapRowToContact) : [];
        if (items.length === 0) {
          return localFallback.listContacts(params);
        }

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
        console.warn("Mobile listContacts error:", err);
        return { items: [], nextCursor: null, hasMore: false };
      }
    },

    async getCustomer360(contactId: string): Promise<ContactCustomer360View | null> {
      try {
        const headers = await getHeaders();
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/crm_contacts?id=eq.${encodeURIComponent(contactId)}&select=*`, {
          method: "GET",
          headers,
        });

        if (!resp.ok) return localFallback.getCustomer360(contactId);
        const rows = await resp.json();
        if (!Array.isArray(rows) || rows.length === 0) return localFallback.getCustomer360(contactId);

        const contact = mapRowToContact(rows[0]);
        const state = { profile: "fresh", leads: "fresh", opportunities: "fresh", tasks: "fresh", notes: "fresh", timeline: "fresh" } as const;

        return {
          contact,
          leads: [],
          opportunities: [],
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

      try {
        const orgId =
          input.organizationId && isUUID(input.organizationId)
            ? input.organizationId
            : mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId || "80fce911-57c5-4a83-809f-78df6a3736f7";

        const payload: Record<string, any> = {
          organization_id: orgId,
          first_name: input.firstName.trim(),
          last_name: input.lastName?.trim() || null,
          second_last_name: input.secondLastName?.trim() || null,
          preferred_name: input.preferredName?.trim() || null,
          email: input.email?.trim() || null,
          secondary_email: input.secondaryEmail?.trim() || null,
          phone: input.phone?.trim() || null,
          secondary_phone: input.secondaryPhone?.trim() || null,
          preferred_channel: input.preferredChannel ?? "email",
          preferred_language: input.preferredLanguage?.trim() || "es",
          company_name: input.companyName?.trim() || null,
          job_title: input.jobTitle?.trim() || null,
          department: input.department?.trim() || null,
          address_line1: input.addressLine1?.trim() || null,
          address_line2: input.addressLine2?.trim() || null,
          city: input.city?.trim() || null,
          state_province: input.stateProvince?.trim() || null,
          postal_code: input.postalCode?.trim() || null,
          country: input.country?.trim() || null,
          document_type: input.documentType?.trim() || null,
          document_number: input.documentNumber?.trim() || null,
          birth_date: input.birthDate?.trim() || null,
          gender: input.gender?.trim() || null,
          identity_status: "verified",
        };

        const headers = await getHeaders();
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/crm_contacts`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          return localFallback.createContact(input);
        }

        const rows = await resp.json();
        return { status: "success", contact: mapRowToContact(rows[0] || payload) };
      } catch (err) {
        return localFallback.createContact(input);
      }
    },

    async updateContact(contactId: string, patch: UpdateContactPatch, _expectedUpdatedAt: string): Promise<ContactMutationResult> {
      try {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (patch.firstName !== undefined) payload.first_name = patch.firstName.trim();
        if (patch.lastName !== undefined) payload.last_name = patch.lastName?.trim() || null;
        if (patch.secondLastName !== undefined) payload.second_last_name = patch.secondLastName?.trim() || null;
        if (patch.preferredName !== undefined) payload.preferred_name = patch.preferredName?.trim() || null;
        if (patch.email !== undefined) payload.email = patch.email?.trim() || null;
        if (patch.secondaryEmail !== undefined) payload.secondary_email = patch.secondaryEmail?.trim() || null;
        if (patch.phone !== undefined) payload.phone = patch.phone?.trim() || null;
        if (patch.secondaryPhone !== undefined) payload.secondary_phone = patch.secondaryPhone?.trim() || null;
        if (patch.preferredChannel !== undefined) payload.preferred_channel = patch.preferredChannel;
        if (patch.preferredLanguage !== undefined) payload.preferred_language = patch.preferredLanguage?.trim() || null;
        if (patch.companyName !== undefined) payload.company_name = patch.companyName?.trim() || null;
        if (patch.jobTitle !== undefined) payload.job_title = patch.jobTitle?.trim() || null;
        if (patch.department !== undefined) payload.department = patch.department?.trim() || null;
        if (patch.addressLine1 !== undefined) payload.address_line1 = patch.addressLine1?.trim() || null;
        if (patch.addressLine2 !== undefined) payload.address_line2 = patch.addressLine2?.trim() || null;
        if (patch.city !== undefined) payload.city = patch.city?.trim() || null;
        if (patch.stateProvince !== undefined) payload.state_province = patch.stateProvince?.trim() || null;
        if (patch.postalCode !== undefined) payload.postal_code = patch.postalCode?.trim() || null;
        if (patch.country !== undefined) payload.country = patch.country?.trim() || null;
        if (patch.documentType !== undefined) payload.document_type = patch.documentType?.trim() || null;
        if (patch.documentNumber !== undefined) payload.document_number = patch.documentNumber?.trim() || null;
        if (patch.birthDate !== undefined) payload.birth_date = patch.birthDate?.trim() || null;
        if (patch.gender !== undefined) payload.gender = patch.gender?.trim() || null;

        const headers = await getHeaders();
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/crm_contacts?id=eq.${encodeURIComponent(contactId)}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          return localFallback.updateContact(contactId, patch, _expectedUpdatedAt);
        }

        const rows = await resp.json();
        return { status: "success", contact: mapRowToContact(rows[0] || { id: contactId, ...payload }) };
      } catch (err) {
        return localFallback.updateContact(contactId, patch, _expectedUpdatedAt);
      }
    },

    async archiveContact(contactId: string, _expectedUpdatedAt: string): Promise<ContactMutationResult> {
      try {
        const headers = await getHeaders();
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/crm_contacts?id=eq.${encodeURIComponent(contactId)}`, {
          method: "DELETE",
          headers,
        });

        if (!resp.ok) {
          return localFallback.archiveContact(contactId, _expectedUpdatedAt);
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

export const mobileContactAdapter = createMobileContactAdapter();