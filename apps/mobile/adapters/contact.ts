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
          .is("archived_at", null)
          .order("created_at", { ascending: false });

        if (error) return { items: [], nextCursor: null, hasMore: false };

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
        return { items: [], nextCursor: null, hasMore: false };
      }
    },

    async getCustomer360(contactId: string): Promise<ContactCustomer360View | null> {
      if (!isUUID(contactId)) return localFallback.getCustomer360(contactId);
      try {
        const { data: rows, error } = await mobileSupabaseClient
          .from("crm_contacts")
          .select("*")
          .eq("id", contactId);

        if (error || !Array.isArray(rows) || rows.length === 0) return null;

        const contact = mapRowToContact(rows[0]);

        const { data: leadsRows } = await mobileSupabaseClient
          .from("crm_leads")
          .select("*")
          .eq("contact_id", contactId);

        const { data: oppsRows } = await mobileSupabaseClient
          .from("crm_opportunities")
          .select("*")
          .eq("contact_id", contactId);
        const leadIds = (leadsRows || []).map((lead: any) => lead.id);
        const opportunityIds = (oppsRows || []).map((opportunity: any) => opportunity.id);
        const [{ data: tasksRows }, { data: notesRows }, { data: activitiesRows }] = await Promise.all([
          leadIds.length ? mobileSupabaseClient.from("crm_tasks").select("*").in("lead_id", leadIds) : Promise.resolve({ data: [] }),
          mobileSupabaseClient.from("crm_notes").select("*").eq("contact_id", contactId),
          mobileSupabaseClient.from("crm_activities").select("*").eq("organization_id", contact.organizationId).order("occurred_at", { ascending: false }),
        ]);
        const relatedIds = new Set([contactId, ...leadIds, ...opportunityIds]);
        const relatedActivities = (activitiesRows || []).filter((activity: any) => !activity.source_id || relatedIds.has(activity.source_id) || leadIds.includes(activity.lead_id));

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
          tasks: (tasksRows || []).map((task: any) => ({ id: task.id, name: task.title, summary: task.description || task.title, occurredAt: task.due_at || task.created_at })),
          notes: (notesRows || []).map((note: any) => ({ id: note.id, summary: typeof note.body === "string" ? note.body : "", occurredAt: note.created_at })),
          timeline: relatedActivities.map((activity: any) => ({ id: activity.id, summary: activity.summary, occurredAt: activity.occurred_at })),
          cursors: { profile: null, leads: null, opportunities: null, tasks: null, notes: null, timeline: null },
          sectionState: state,
          sectionPermissions: { profile: true, leads: true, opportunities: true, tasks: true, notes: true, timeline: true },
        };
      } catch {
        return null;
      }
    },

    async createContact(input: CreateContactInput): Promise<ContactMutationResult> {
      const validation = validateContactMutationInput(input);
      if (validation) return validation;

      if (!input.organizationId || !isUUID(input.organizationId)) {
        return localFallback.createContact(input);
      }

      try {
        const payload: Record<string, any> = {
          organization_id: input.organizationId,
          first_name: input.firstName.trim(),
          last_name: input.lastName?.trim() || null,
          second_last_name: input.secondLastName?.trim() || null,
          preferred_name: input.preferredName?.trim() || null,
          email: input.email?.trim() || null,
          secondary_email: input.secondaryEmail?.trim() || null,
          phone: input.phone?.trim() || null,
          secondary_phone: input.secondaryPhone?.trim() || null,
          preferred_channel: input.preferredChannel || null,
          preferred_language: input.preferredLanguage?.trim() || null,
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
          attributes: input.attributes || {},
        };

        const { data, error } = await mobileSupabaseClient
          .from("crm_contacts")
          .insert(payload)
          .select();

        if (error || !Array.isArray(data) || data.length === 0) return { status: "server-error", message: error?.message ?? "The contact could not be created." };

        return { status: "success", contact: mapRowToContact(data[0] || payload) };
      } catch (err) {
        return { status: "server-error", message: err instanceof Error ? err.message : "The contact could not be created." };
      }
    },

    async updateContact(contactId: string, patch: UpdateContactPatch, expectedUpdatedAt: string): Promise<ContactMutationResult> {
      if (!patch.organizationId || !isUUID(patch.organizationId) || contactId.startsWith("c") || contactId.startsWith("local_")) {
        return localFallback.updateContact(contactId, patch, expectedUpdatedAt);
      }

      try {
        const { data: current, error: readError } = await mobileSupabaseClient.from("crm_contacts").select("*").eq("id", contactId).eq("organization_id", patch.organizationId).single();
        if (readError || !current) return { status: "server-error", message: "The contact could not be found." };
        const currentContact = mapRowToContact(current);
        if (currentContact.updatedAt !== expectedUpdatedAt) return { status: "conflict", message: "The contact changed before it could be updated.", contact: currentContact };
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
        if (patch.attributes !== undefined) payload.attributes = patch.attributes;

        const { data, error } = await mobileSupabaseClient
          .from("crm_contacts")
          .update(payload)
          .eq("id", contactId)
          .eq("organization_id", patch.organizationId)
          .eq("updated_at", expectedUpdatedAt)
          .select();

        if (error || !Array.isArray(data) || data.length === 0) return { status: "server-error", message: error?.message ?? "The contact could not be updated." };

        return { status: "success", contact: mapRowToContact(data[0] || { id: contactId, ...payload }) };
      } catch (err) {
        return { status: "server-error", message: err instanceof Error ? err.message : "The contact could not be updated." };
      }
    },

    async archiveContact(contactId: string, expectedUpdatedAt: string): Promise<ContactMutationResult> {
      if (contactId.startsWith("c") || contactId.startsWith("local_") || !isUUID(contactId)) {
        return localFallback.archiveContact(contactId, expectedUpdatedAt);
      }

      try {
        const { data, error } = await mobileSupabaseClient.from("crm_contacts").update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", contactId).eq("updated_at", expectedUpdatedAt).select().single();
        if (error || !data) return { status: "server-error", message: error?.message ?? "The contact could not be archived." };
        return { status: "success", contact: mapRowToContact(data) };
      } catch (err) {
        return { status: "server-error", message: err instanceof Error ? err.message : "The contact could not be archived." };
      }
    },

    async findPotentialDuplicates(contactId: string): Promise<PotentialContactDuplicate[]> {
      if (!isUUID(contactId)) return localFallback.findPotentialDuplicates(contactId);
      const { data: source, error: sourceError } = await mobileSupabaseClient.from("crm_contacts").select("*").eq("id", contactId).single();
      if (sourceError || !source) return [];
      const { data: rows, error } = await mobileSupabaseClient.from("crm_contacts").select("*").eq("organization_id", source.organization_id).is("archived_at", null).neq("id", contactId);
      if (error) throw error;
      const { data: dismissed } = await mobileSupabaseClient.from("crm_contact_duplicate_reviews").select("candidate_id").eq("organization_id", source.organization_id).eq("contact_id", contactId);
      const dismissedIds = new Set((dismissed ?? []).map((item: any) => item.candidate_id));
      const sourceContact = mapRowToContact(source);
      return (rows ?? []).map((row: any): PotentialContactDuplicate | null => {
        if (dismissedIds.has(row.id)) return null;
        const candidate = mapRowToContact(row);
        const reasons: string[] = [];
        if (sourceContact.email && candidate.email && sourceContact.email.toLowerCase() === candidate.email.toLowerCase()) reasons.push("same-email");
        if (sourceContact.phone && candidate.phone && sourceContact.phone === candidate.phone) reasons.push("same-phone");
        if (sourceContact.companyName && candidate.companyName && sourceContact.companyName.toLowerCase() === candidate.companyName.toLowerCase()) reasons.push("same-company");
        return reasons.length ? { contact: candidate, score: Math.min(1, reasons.length / 3), reasons } : null;
      }).filter((item): item is PotentialContactDuplicate => Boolean(item));
    },

    async dismissDuplicateReview(contactId: string, candidateId: string, confirmation: string): Promise<DuplicateReviewResult> {
      if (!isUUID(contactId) || !isUUID(candidateId)) return localFallback.dismissDuplicateReview(contactId, candidateId, confirmation);
      if (confirmation !== "DISMISS_DUPLICATE_REVIEW") return { status: "server-error", message: "Audit confirmation is required." };
      const { data: contact } = await mobileSupabaseClient.from("crm_contacts").select("organization_id").eq("id", contactId).single();
      if (!contact) return { status: "not-found", message: "The contact could not be found." };
      const { data, error } = await mobileSupabaseClient.from("crm_contact_duplicate_reviews").insert({ organization_id: contact.organization_id, contact_id: contactId, candidate_id: candidateId, confirmation }).select().single();
      if (error || !data) return { status: "server-error", message: error?.message ?? "The duplicate review could not be dismissed." };
      return { status: "success", reviewId: data.id, dismissedAt: data.dismissed_at };
    },
  };
}

export const mobileContactAdapter = createMobileContactAdapter();