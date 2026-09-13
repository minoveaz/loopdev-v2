import { describe, expect, it } from "vitest";
import { contactPort } from "@/loopdev/domains/crm/adapter";
import { contactListFixtures } from "../../../../packages/contracts/src/contact-fixtures";

describe("canonical contact port", () => {
  it("serves the same fixture IDs used by the mobile route", async () => {
    const page = await contactPort.listContacts({
      organizationId: "local-development-organization",
      limit: 100,
      cursor: null,
    });
    expect(new Set(page.items.map((contact) => contact.id))).toEqual(new Set(contactListFixtures.map((contact) => contact.id)));
  });

  it("projects the same Customer 360 sections for a shared contact ID", async () => {
    const view = await contactPort.getCustomer360("crm_cust_1");
    expect(view?.contact.id).toBe("crm_cust_1");
    expect(Object.keys(view?.sectionState ?? {})).toEqual([
      "profile", "leads", "opportunities", "tasks", "notes", "timeline",
    ]);
    expect(view?.sectionPermissions).toEqual({
      profile: true, leads: true, opportunities: true, tasks: true, notes: true, timeline: true,
    });
  });

  it("updates through the shared port and reports stale-write conflicts", async () => {
      const page = await contactPort.listContacts({ organizationId: "local-development-organization", limit: 100, cursor: null });
      const contact = page.items[0];
      const updated = await contactPort.updateContact(contact.id, {
        organizationId: contact.organizationId,
        firstName: contact.firstName,
      }, contact.updatedAt);
      expect(updated.status).toBe("success");
      const conflict = await contactPort.updateContact(contact.id, {
        organizationId: contact.organizationId,
        firstName: "Stale write",
      }, contact.updatedAt);
      expect(conflict.status).toBe("conflict");
  });

  it("reviews and audit-dismisses duplicate candidates without merge", async () => {
      const page = await contactPort.listContacts({ organizationId: "local-development-organization", limit: 100, cursor: null });
      const source = page.items[0];
      const created = await contactPort.createContact({
        organizationId: source.organizationId,
        firstName: "Duplicate review candidate",
        lastName: null,
        email: source.email,
        phone: null,
      });
      expect(created.status).toBe("success");
      const candidates = await contactPort.findPotentialDuplicates(source.id);
      expect(candidates.length).toBeGreaterThan(0);
      const result = await contactPort.dismissDuplicateReview(source.id, candidates[0].contact.id, "DISMISS_DUPLICATE_REVIEW");
      expect(result.status).toBe("success");
      expect(await contactPort.findPotentialDuplicates(source.id)).not.toContainEqual(candidates[0]);
  });
});
