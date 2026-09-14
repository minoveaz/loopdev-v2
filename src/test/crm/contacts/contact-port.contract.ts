import { beforeEach, describe, expect, it } from "vitest";
import type { ContactPort } from "../../../../packages/contracts/src/contact-port";

const organizationId = "local-development-organization";

export function contactPortContract(name: string, createAdapter: () => ContactPort, reset?: () => void) {
  describe(`${name} ContactPort contract`, () => {
    let adapter: ContactPort;

    beforeEach(() => {
      reset?.();
      adapter = createAdapter();
    });

    it("lists, searches, filters, sorts and paginates active contacts", async () => {
      const first = await adapter.listContacts({ organizationId, limit: 3, cursor: null, sortBy: "name", sortDirection: "asc" });
      expect(first.items).toHaveLength(3);
      expect(first.hasMore).toBe(true);
      expect(first.nextCursor).toBe("3");
      const second = await adapter.listContacts({ organizationId, limit: 3, cursor: first.nextCursor, sortBy: "name", sortDirection: "asc" });
      expect(second.items.map((contact) => contact.id)).not.toEqual(first.items.map((contact) => contact.id));
      const search = await adapter.listContacts({ organizationId, query: first.items[0].email ?? "", limit: 20, cursor: null });
      expect(search.items.map((contact) => contact.id)).toContain(first.items[0].id);
      const filtered = await adapter.listContacts({ organizationId, identityStatus: ["verified"], preferredChannel: ["email"], limit: 100, cursor: null });
      expect(filtered.items.every((contact) => contact.identityStatus === "verified" && contact.preferredChannel === "email")).toBe(true);
    });

    it("returns equivalent validation and tenant permission outcomes", async () => {
      await expect(adapter.createContact({ organizationId, firstName: "", email: null, phone: null })).resolves.toMatchObject({
        status: "validation-error",
        fieldErrors: { firstName: expect.any(String), email: expect.any(String), phone: expect.any(String) },
      });
      await expect(adapter.createContact({ organizationId: "other-organization", firstName: "Ada", email: "ada@example.com" })).resolves.toMatchObject({ status: "forbidden" });
    });

    it("creates, updates, reports stale conflicts and archives with stable lifecycle semantics", async () => {
      const created = await adapter.createContact({ organizationId, firstName: "Contract", lastName: "Probe", email: "contract.probe@example.com" });
      expect(created.status).toBe("success");
      if (created.status !== "success") return;
      const updated = await adapter.updateContact(created.contact.id, { organizationId, firstName: "Updated" }, created.contact.updatedAt);
      expect(updated.status).toBe("success");
      const conflict = await adapter.updateContact(created.contact.id, { organizationId, firstName: "Stale" }, created.contact.updatedAt);
      expect(conflict.status).toBe("conflict");
      if (updated.status !== "success") return;
      const archived = await adapter.archiveContact(updated.contact.id, updated.contact.updatedAt);
      expect(archived.status).toBe("success");
      const page = await adapter.listContacts({ organizationId, query: "contract.probe@example.com", limit: 20, cursor: null });
      expect(page.items).toHaveLength(0);
    });

    it("provides the complete Customer 360 section contract", async () => {
      const page = await adapter.listContacts({ organizationId, limit: 1, cursor: null });
      const view = await adapter.getCustomer360(page.items[0].id);
      expect(view?.contact.id).toBe(page.items[0].id);
      expect(Object.keys(view?.sectionState ?? {})).toEqual(["profile", "leads", "opportunities", "tasks", "notes", "timeline"]);
      expect(Object.values(view?.sectionPermissions ?? {}).every(Boolean)).toBe(true);
    });

    it("requires an audited decision before dismissing a duplicate candidate", async () => {
      const page = await adapter.listContacts({ organizationId, limit: 1, cursor: null });
      const source = page.items[0];
      const duplicate = await adapter.createContact({ organizationId, firstName: "Duplicate", email: source.email, phone: null });
      expect(duplicate.status).toBe("success");
      if (duplicate.status !== "success") return;
      const candidates = await adapter.findPotentialDuplicates(source.id);
      expect(candidates.map((candidate) => candidate.contact.id)).toContain(duplicate.contact.id);
      await expect(adapter.dismissDuplicateReview(source.id, duplicate.contact.id, "INVALID")).resolves.toMatchObject({ status: "server-error" });
      await expect(adapter.dismissDuplicateReview(source.id, duplicate.contact.id, "DISMISS_DUPLICATE_REVIEW")).resolves.toMatchObject({ status: "success" });
      expect((await adapter.findPotentialDuplicates(source.id)).map((candidate) => candidate.contact.id)).not.toContain(duplicate.contact.id);
    });
  });
}