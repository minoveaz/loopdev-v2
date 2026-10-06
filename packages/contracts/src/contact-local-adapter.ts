import { contactListFixtures } from "./contact-fixtures";
import {
  validateContactMutationInput,
  type ContactCustomer360View,
  type ContactListParams,
  type ContactMutationResult,
  type ContactPort,
  type ContactRecord,
  type CreateContactInput,
  type DuplicateReviewResult,
  type PotentialContactDuplicate,
  type UpdateContactPatch,
} from "./contact-port";

export interface LocalContactAdapterOptions {
  organizationId?: string;
  now?: () => Date;
}

function seedContacts(organizationId: string): ContactRecord[] {
  return contactListFixtures.map((fixture, index) => {
    const [firstName, ...lastName] = fixture.name.split(" ");
    const timestamp = new Date(`${fixture.updatedAt}T12:00:00.000Z`).toISOString();
    return {
      id: fixture.id,
      organizationId,
      firstName,
      lastName: lastName.join(" ") || null,
      secondLastName: null,
      preferredName: null,
      email: fixture.email,
      secondaryEmail: null,
      phone: fixture.phone,
      secondaryPhone: null,
      preferredChannel: fixture.preferredChannel,
      preferredLanguage: null,
      documentType: null,
      documentNumber: null,
      birthDate: null,
      gender: null,
      addressLine1: null,
      addressLine2: null,
      city: fixture.city,
      stateProvince: null,
      postalCode: null,
      country: fixture.country,
      companyName: fixture.companyName,
      jobTitle: fixture.jobTitle,
      department: null,
      attributes: {},
      identityStatus: fixture.identityStatus,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
    };
  });
}

export function createLocalContactAdapter({
  organizationId = "local-development-organization",
  now = () => new Date(),
}: LocalContactAdapterOptions = {}): ContactPort {
  const contacts = new Map(seedContacts(organizationId).map((contact) => [contact.id, contact]));
  const dismissedReviews = new Set<string>();
  let idCounter = contacts.size;
  let lastTimestamp = 0;
  const timestamp = () => {
    const current = Math.max(now().getTime(), lastTimestamp + 1);
    lastTimestamp = current;
    return new Date(current).toISOString();
  };
  const forbidden = (action: string): Extract<ContactMutationResult, { status: "forbidden" }> => ({
    status: "forbidden",
    message: `You do not have permission to ${action} contacts in this organization.`,
  });

  return {
    async listContacts(params: ContactListParams) {
      const query = params.query?.trim().toLocaleLowerCase() ?? "";
      const filtered = [...contacts.values()]
        .filter((contact) => contact.organizationId === params.organizationId && !contact.archivedAt)
        .filter((contact) => !query || [contact.firstName, contact.lastName, contact.email, contact.phone, contact.companyName]
          .filter(Boolean).some((value) => String(value).toLocaleLowerCase().includes(query)))
        .filter((contact) => !params.identityStatus?.length || params.identityStatus.includes(contact.identityStatus))
        .filter((contact) => !params.preferredChannel?.length || (contact.preferredChannel && params.preferredChannel.includes(contact.preferredChannel)))
        .sort((left, right) => {
          const sortBy = params.sortBy ?? "updated";
          const value = (contact: ContactRecord) => ({
            name: `${contact.firstName} ${contact.lastName ?? ""}`.trim(),
            company: `${contact.companyName ?? ""} ${contact.jobTitle ?? ""}`.trim(),
            channel: contact.preferredChannel ?? "",
            identity: contact.identityStatus,
            location: `${contact.city ?? ""} ${contact.stateProvince ?? ""} ${contact.country ?? ""}`.trim(),
            updated: contact.updatedAt,
          })[sortBy];
          const result = value(left).localeCompare(value(right), undefined, { numeric: true });
          return (params.sortDirection ?? "desc") === "asc" ? result : -result;
        });
      const requestedOffset = params.cursor ? Number.parseInt(params.cursor, 10) : 0;
      const offset = Number.isFinite(requestedOffset) && requestedOffset >= 0 ? requestedOffset : 0;
      const items = filtered.slice(offset, offset + params.limit);
      const nextOffset = offset + items.length;
      return { items, nextCursor: nextOffset < filtered.length ? String(nextOffset) : null, hasMore: nextOffset < filtered.length };
    },

    async createContact(input: CreateContactInput): Promise<ContactMutationResult> {
      if (input.organizationId !== organizationId) return forbidden("create");
      const validation = validateContactMutationInput(input);
      if (validation) return validation;
      const createdAt = timestamp();
      const contact: ContactRecord = {
        id: `crm_cust_local_${++idCounter}`,
        organizationId,
        firstName: input.firstName.trim(),
        lastName: input.lastName?.trim() || null,
        secondLastName: input.secondLastName?.trim() || null,
        preferredName: input.preferredName?.trim() || null,
        email: input.email?.trim() || null,
        secondaryEmail: input.secondaryEmail?.trim() || null,
        phone: input.phone?.trim() || null,
        secondaryPhone: input.secondaryPhone?.trim() || null,
        preferredChannel: input.preferredChannel ?? "email",
        preferredLanguage: input.preferredLanguage?.trim() || null,
        documentType: input.documentType?.trim() || null,
        documentNumber: input.documentNumber?.trim() || null,
        birthDate: input.birthDate?.trim() || null,
        gender: input.gender?.trim() || null,
        addressLine1: input.addressLine1?.trim() || null,
        addressLine2: input.addressLine2?.trim() || null,
        city: input.city?.trim() || null,
        stateProvince: input.stateProvince?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        country: input.country?.trim() || null,
        companyName: input.companyName?.trim() || null,
        jobTitle: input.jobTitle?.trim() || null,
        department: input.department?.trim() || null,
        attributes: {},
        identityStatus: "verified",
        createdAt,
        updatedAt: createdAt,
        archivedAt: null,
      };
      contacts.set(contact.id, contact);
      return { status: "success", contact };
    },

    async updateContact(contactId: string, patch: UpdateContactPatch, expectedUpdatedAt: string): Promise<ContactMutationResult> {
      if (patch.organizationId !== organizationId) return forbidden("update");
      const current = contacts.get(contactId);
      if (!current || current.organizationId !== organizationId) return { status: "server-error", message: "The contact could not be found." };
      if (current.updatedAt !== expectedUpdatedAt) return { status: "conflict", message: "The contact changed before it could be updated.", contact: current };
      const validation = validateContactMutationInput({ ...current, ...patch });
      if (validation) return validation;
      const updated: ContactRecord = { ...current, ...patch, id: current.id, organizationId, updatedAt: timestamp() };
      contacts.set(contactId, updated);
      return { status: "success", contact: updated };
    },

    async archiveContact(contactId: string, expectedUpdatedAt: string): Promise<ContactMutationResult> {
      const current = contacts.get(contactId);
      if (!current) return { status: "server-error", message: "The contact could not be found." };
      if (current.updatedAt !== expectedUpdatedAt) return { status: "conflict", message: "The contact changed before it could be archived.", contact: current };
      const updatedAt = timestamp();
      const archived = { ...current, archivedAt: updatedAt, updatedAt };
      contacts.set(contactId, archived);
      return { status: "success", contact: archived };
    },

    async getCustomer360(contactId: string): Promise<ContactCustomer360View | null> {
      const contact = contacts.get(contactId);
      if (!contact || contact.archivedAt) return null;
      const sections = ["profile", "leads", "opportunities", "tasks", "notes", "timeline"] as const;
      return {
        contact,
        leads: [], opportunities: [], tasks: [], notes: [], timeline: [],
        cursors: Object.fromEntries(sections.map((section) => [section, null])) as ContactCustomer360View["cursors"],
        sectionState: Object.fromEntries(sections.map((section) => [section, "fresh"])) as ContactCustomer360View["sectionState"],
        sectionPermissions: Object.fromEntries(sections.map((section) => [section, true])) as ContactCustomer360View["sectionPermissions"],
      };
    },

    async findPotentialDuplicates(contactId: string): Promise<PotentialContactDuplicate[]> {
      const source = contacts.get(contactId);
      if (!source) return [];
      return [...contacts.values()].filter((candidate) => candidate.id !== contactId && !candidate.archivedAt).map((candidate) => {
        const reasons: string[] = [];
        if (source.email && candidate.email && source.email.toLocaleLowerCase() === candidate.email.toLocaleLowerCase()) reasons.push("Same email address");
        if (source.phone && candidate.phone && source.phone === candidate.phone) reasons.push("Same phone number");
        const sourceName = `${source.firstName} ${source.lastName ?? ""}`.trim().toLocaleLowerCase();
        const candidateName = `${candidate.firstName} ${candidate.lastName ?? ""}`.trim().toLocaleLowerCase();
        if (sourceName === candidateName) reasons.push("Same name");
        return { contact: candidate, score: Math.min(99, reasons.length * 35 + (reasons.length ? 10 : 0)), reasons };
      }).filter((candidate) => candidate.reasons.length > 0 && !dismissedReviews.has(`${contactId}:${candidate.contact.id}`));
    },

    async dismissDuplicateReview(contactId: string, candidateId: string, confirmation: string): Promise<DuplicateReviewResult> {
      if (confirmation !== "DISMISS_DUPLICATE_REVIEW") return { status: "server-error", message: "Audit confirmation is required." };
      if (!contacts.has(contactId) || !contacts.has(candidateId)) return { status: "not-found", message: "The duplicate review contact could not be found." };
      dismissedReviews.add(`${contactId}:${candidateId}`);
      return { status: "success", reviewId: `${contactId}:${candidateId}`, dismissedAt: timestamp() };
    },
  };
}