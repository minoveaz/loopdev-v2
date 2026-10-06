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

function normalizeDateForDatabase(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  if (!normalized) return null;
  const dayMonthYear = normalized.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (dayMonthYear) {
    return `${dayMonthYear[3]}-${dayMonthYear[2].padStart(2, "0")}-${dayMonthYear[1].padStart(2, "0")}`;
  }
  const yearMonthDay = normalized.match(/^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})$/);
  if (yearMonthDay) {
    return `${yearMonthDay[1]}-${yearMonthDay[2].padStart(2, "0")}-${yearMonthDay[3].padStart(2, "0")}`;
  }
  return normalized;
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
      client = (await ensureAuthenticatedClient(client)) as NonNullable<typeof client>;
      const activeOrgId = params.organizationId;

      try {
        const { data: rows, error } = await client
          .from("crm_contacts")
          .select("*")
          .eq("organization_id", activeOrgId)
          .is("archived_at", null)
          .order("created_at", { ascending: false });

        if (error) throw error;

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
        throw err;
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
      client = (await ensureAuthenticatedClient(client)) as NonNullable<typeof client>;

      try {
        const { data: rows, error } = await client
          .from("crm_contacts")
          .select("*")
          .eq("id", contactId);

        if (error || !Array.isArray(rows) || rows.length === 0) return null;

        const contact = mapRowToContact(rows[0]);

        const { data: leadsRows, error: leadsError } = await client
          .from("crm_leads")
          .select("*")
          .eq("contact_id", contactId)
          .eq("organization_id", contact.organizationId)
          .is("archived_at", null);
        if (leadsError) throw leadsError;

        const { data: oppsRows, error: opportunitiesError } = await client
          .from("crm_opportunities")
          .select("*")
          .eq("contact_id", contactId)
          .eq("organization_id", contact.organizationId)
          .is("archived_at", null);
        if (opportunitiesError) throw opportunitiesError;
        const leadIds = (leadsRows || []).map((lead: any) => lead.id);
        const opportunityIds = (oppsRows || []).map((opportunity: any) => opportunity.id);
        const [{ data: tasksRows }, { data: notesRows }, { data: activitiesRows }] = await Promise.all([
          client.from("crm_tasks").select("*").eq("organization_id", contact.organizationId).or(`relation_id.eq.${contactId}${leadIds.length ? `,lead_id.in.(${leadIds.join(",")})` : ""}`),
          client.from("crm_notes").select("*").eq("contact_id", contactId).eq("organization_id", contact.organizationId),
          client.from("platform_timeline_events").select("*").eq("organization_id", contact.organizationId).order("occurred_at", { ascending: false }),
        ]);
        const relatedIds = new Set([contactId, ...leadIds, ...opportunityIds]);
        const relatedActivities = (activitiesRows || []).filter((activity: any) =>
          !activity.relation_id || relatedIds.has(activity.relation_id),
        );

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
          timeline: relatedActivities.map((activity: any) => ({ id: activity.id, sourceType: activity.source_type ?? activity.type, sourceId: activity.source_id ?? activity.id, type: activity.type, summary: activity.summary, occurredAt: activity.occurred_at, actor: activity.actor_id ?? undefined, source: activity.source_type ?? "CRM", channel: activity.metadata?.channel, status: activity.metadata?.status, outcome: activity.metadata?.outcome, details: activity.metadata?.details })),
          cursors: { profile: null, leads: null, opportunities: null, tasks: null, notes: null, timeline: null },
          sectionState: state,
          sectionPermissions: { profile: true, leads: true, opportunities: true, tasks: true, notes: true, timeline: true },
        };
      } catch (error) {
        throw error;
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
        return { status: "server-error", message: "Supabase is not configured." };
      }
      client = (await ensureAuthenticatedClient(client)) as NonNullable<typeof client>;
      const orgId = input.organizationId;

      try {
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
          birth_date: normalizeDateForDatabase(input.birthDate),
          gender: input.gender?.trim() || null,
          attributes: input.attributes || {},
        };

        const { data, error } = await client
          .from("crm_contacts")
          .insert(payload)
          .select();

        if (error || !Array.isArray(data) || data.length === 0) return { status: "server-error", message: error?.message ?? "The contact could not be created." };

        const createdContact = mapRowToContact(data[0]);

        const extractionId = typeof input.attributes?.documentIntelligenceExtractionId === "string"
          ? input.attributes.documentIntelligenceExtractionId
          : null;
        if (extractionId && isUUID(extractionId)) {
          await client.from("platform_timeline_events").upsert({
            organization_id: orgId,
            relation_type: "contact",
            relation_id: createdContact.id,
            type: "contact_created_from_document",
            actor_id: null,
            actor_type: "system",
            origin: "crm",
            source_type: "document_intelligence_extraction",
            source_id: extractionId,
            dedupe_key: `contact-created-from-extraction:${extractionId}:${createdContact.id}`,
            summary: "Contact created from passport extraction",
            metadata: { extractionId, contactId: createdContact.id },
            visibility: "organization",
            occurred_at: new Date().toISOString(),
          }, { onConflict: "organization_id,dedupe_key" });
          await client.from("platform_timeline_events").upsert({
            organization_id: orgId,
            relation_type: "contact",
            relation_id: createdContact.id,
            type: "document_extraction_linked",
            actor_id: null,
            actor_type: "system",
            origin: "document_intelligence",
            source_type: "document_intelligence_extraction",
            source_id: extractionId,
            dedupe_key: `document-extraction-linked:${extractionId}:${createdContact.id}`,
            summary: "Passport extraction completed",
            metadata: { extractionId, contactId: createdContact.id },
            visibility: "organization",
            occurred_at: new Date().toISOString(),
          }, { onConflict: "organization_id,dedupe_key" });
        }

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
        return { status: "server-error", message: err instanceof Error ? err.message : "The contact could not be created." };
      }
    },

    async updateContact(contactId: string, patch: UpdateContactPatch, _expectedUpdatedAt: string): Promise<ContactMutationResult> {
      let client = getClient();
      if (!client || !contactId || !isUUID(contactId)) {
        return localFallback.updateContact(contactId, patch, _expectedUpdatedAt);
      }
      client = (await ensureAuthenticatedClient(client)) as NonNullable<typeof client>;

      try {
        const { data: current, error: readError } = await client.from("crm_contacts").select("*").eq("id", contactId).eq("organization_id", patch.organizationId).single();
        if (readError || !current) return { status: "server-error", message: "The contact could not be found." };
        const currentContact = mapRowToContact(current);
        if (currentContact.updatedAt !== _expectedUpdatedAt) return { status: "conflict", message: "The contact changed before it could be updated.", contact: currentContact };
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
        if (patch.birthDate !== undefined) payload.birth_date = normalizeDateForDatabase(patch.birthDate);
        if (patch.gender !== undefined) payload.gender = patch.gender?.trim() || null;
        if (patch.attributes !== undefined) payload.attributes = patch.attributes;

        const { data, error } = await client
          .from("crm_contacts")
          .update(payload)
          .eq("id", contactId)
          .eq("organization_id", patch.organizationId)
          .eq("updated_at", _expectedUpdatedAt)
          .select();

        if (error || !Array.isArray(data) || data.length === 0) return { status: "server-error", message: error?.message ?? "The contact could not be updated." };

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
        return { status: "server-error", message: err instanceof Error ? err.message : "The contact could not be updated." };
      }
    },

    async archiveContact(contactId: string, _expectedUpdatedAt: string): Promise<ContactMutationResult> {
      let client = getClient();
      if (!client || !contactId || !isUUID(contactId)) {
        return localFallback.archiveContact(contactId, _expectedUpdatedAt);
      }
      client = (await ensureAuthenticatedClient(client)) as NonNullable<typeof client>;
      try {
        const { data, error } = await client.from("crm_contacts").update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", contactId).eq("updated_at", _expectedUpdatedAt).select().single();
        if (error || !data) return { status: "server-error", message: error?.message ?? "The contact could not be archived." };

        try {
          crmCustomersStore.remove(contactId);
        } catch {
          // ignore
        }

        return { status: "success", contact: mapRowToContact(data) };
      } catch (err) {
        return { status: "server-error", message: err instanceof Error ? err.message : "The contact could not be archived." };
      }
    },

    async findPotentialDuplicates(contactId: string): Promise<PotentialContactDuplicate[]> {
      if (!isUUID(contactId)) return localFallback.findPotentialDuplicates(contactId);
      const client = getClient();
      if (!client) throw new Error("Supabase is not configured.");
      const { data: source, error: sourceError } = await client.from("crm_contacts").select("*").eq("id", contactId).single();
      if (sourceError || !source) return [];
      const { data: rows, error } = await client.from("crm_contacts").select("*").eq("organization_id", source.organization_id).is("archived_at", null).neq("id", contactId);
      if (error) throw error;
      const { data: dismissed } = await client.from("crm_contact_duplicate_reviews").select("candidate_id").eq("organization_id", source.organization_id).eq("contact_id", contactId);
      const dismissedIds = new Set((dismissed ?? []).map((item: any) => item.candidate_id));
      const sourceContact = mapRowToContact(source);
      return (rows ?? []).map((row: any): PotentialContactDuplicate | null => {
        if (dismissedIds.has(row.id)) return null;
        const candidate = mapRowToContact(row);
        const reasons: string[] = [];
        if (sourceContact.email && candidate.email && sourceContact.email.toLowerCase() === candidate.email.toLowerCase()) reasons.push("same-email");
        if (sourceContact.phone && candidate.phone && sourceContact.phone === candidate.phone) reasons.push("same-phone");
        if (sourceContact.companyName && candidate.companyName && sourceContact.companyName.toLowerCase() === candidate.companyName.toLowerCase()) reasons.push("same-company");
        if (!reasons.length) return null;
        return { contact: candidate, score: Math.min(1, reasons.length / 3), reasons };
      }).filter((item): item is PotentialContactDuplicate => Boolean(item));
    },

    async dismissDuplicateReview(contactId: string, candidateId: string, confirmation: string): Promise<DuplicateReviewResult> {
      if (!isUUID(contactId) || !isUUID(candidateId)) return localFallback.dismissDuplicateReview(contactId, candidateId, confirmation);
      if (confirmation !== "DISMISS_DUPLICATE_REVIEW") return { status: "server-error", message: "Audit confirmation is required." };
      const client = getClient();
      if (!client) return { status: "server-error", message: "Supabase is not configured." };
      const { data: contact } = await client.from("crm_contacts").select("organization_id").eq("id", contactId).single();
      if (!contact) return { status: "not-found", message: "The contact could not be found." };
      const { data, error } = await client.from("crm_contact_duplicate_reviews").insert({ organization_id: contact.organization_id, contact_id: contactId, candidate_id: candidateId, confirmation }).select().single();
      if (error || !data) return { status: "server-error", message: error?.message ?? "The duplicate review could not be dismissed." };
      return { status: "success", reviewId: data.id, dismissedAt: data.dismissed_at };
    },

    async bulkArchiveContacts(contactIds: string[]): Promise<{ successCount: number; failureCount: number }> {
      let client = getClient();
      if (!client) {
        let success = 0;
        for (const id of contactIds) {
          const res = await localFallback.archiveContact(id, "");
          if (res.status === "success") success++;
        }
        return { successCount: success, failureCount: contactIds.length - success };
      }
      client = (await ensureAuthenticatedClient(client)) as NonNullable<typeof client>;

      const uuidIds = contactIds.filter(isUUID);
      const localIds = contactIds.filter((id) => !isUUID(id));

      let successCount = 0;
      let failureCount = 0;

      if (uuidIds.length > 0) {
        const { error } = await client
          .from("crm_contacts")
          .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .in("id", uuidIds);

        if (error) {
          console.warn("Supabase bulkArchiveContacts error:", error.message);
          failureCount += uuidIds.length;
        } else {
          successCount += uuidIds.length;
          for (const id of uuidIds) {
            try {
              crmCustomersStore.remove(id);
            } catch {
              // ignore
            }
          }
        }
      }

      if (localIds.length > 0) {
        for (const id of localIds) {
          try {
            const res = await localFallback.archiveContact(id, "");
            if (res.status === "success") successCount++;
            else failureCount++;
          } catch {
            failureCount++;
          }
        }
      }

      return { successCount, failureCount };
    },
  };
}

export const desktopContactAdapter = createDesktopContactAdapter();
