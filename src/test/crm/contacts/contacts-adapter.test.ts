import { describe, expect, it } from "vitest";
import { localLoopdevAdapter } from "@/loopdev/domains/crm/adapter/local";

describe("Contacts adapter contract", () => {
  it("returns a cursor page with a bounded result set", async () => {
    const page = await localLoopdevAdapter.crm.listContacts({
      organizationId: "local-development-organization",
      limit: 2,
    });

    expect(page.items).toHaveLength(2);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe("2");
  });

  it("filters contacts by the contract query parameter", async () => {
    const page = await localLoopdevAdapter.crm.listContacts({
      organizationId: "local-development-organization",
      query: "aria",
      limit: 10,
    });

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((contact) => `${contact.firstName} ${contact.lastName ?? ""}`.toLowerCase().includes("aria"))).toBe(true);
  });

  it("sorts contacts by updated date in both directions before pagination", async () => {
    const ascending = await localLoopdevAdapter.crm.listContacts({
      organizationId: "local-development-organization",
      limit: 20,
      sortBy: "updated",
      sortDirection: "asc",
    });
    const descending = await localLoopdevAdapter.crm.listContacts({
      organizationId: "local-development-organization",
      limit: 20,
      sortBy: "updated",
      sortDirection: "desc",
    });

    expect(ascending.items.map((contact) => contact.updatedAt)).toEqual(
      [...ascending.items].map((contact) => contact.updatedAt).sort(),
    );
    expect(descending.items.map((contact) => contact.updatedAt)).toEqual(
      [...descending.items].map((contact) => contact.updatedAt).sort().reverse(),
    );
  });

  it("returns typed validation and permission responses", async () => {
    const invalid = await localLoopdevAdapter.crm.createContact({
      organizationId: "local-development-organization",
      firstName: "",
    });
    const forbidden = await localLoopdevAdapter.crm.createContact({
      organizationId: "other-organization",
      firstName: "New",
      email: "new@example.com",
    });

    expect(invalid).toMatchObject({ status: "validation-error" });
    expect(forbidden).toMatchObject({ status: "forbidden" });
  });

  it("creates, updates, and detects stale updates locally", async () => {
    const created = await localLoopdevAdapter.crm.createContact({
      organizationId: "local-development-organization",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
    });
    expect(created.status).toBe("success");
    if (created.status !== "success") return;

    const updated = await localLoopdevAdapter.crm.updateContact(
      created.contact.id,
      { organizationId: "local-development-organization", companyName: "Analytical Engines" },
      created.contact.updatedAt,
    );
    expect(updated).toMatchObject({ status: "success", contact: { companyName: "Analytical Engines" } });

    const conflict = await localLoopdevAdapter.crm.updateContact(
      created.contact.id,
      { organizationId: "local-development-organization", firstName: "Changed" },
      "stale-updated-at",
    );
    expect(conflict).toMatchObject({ status: "conflict", contact: { id: created.contact.id } });
  });

  it("archives a contact and detects stale archive requests", async () => {
    const created = await localLoopdevAdapter.crm.createContact({
      organizationId: "local-development-organization",
      firstName: "Archive",
      email: "archive@example.com",
    });
    expect(created.status).toBe("success");
    if (created.status !== "success") return;

    const archived = await localLoopdevAdapter.crm.archiveContact(created.contact.id, created.contact.updatedAt);
    expect(archived).toMatchObject({ status: "success", contact: { archivedAt: expect.any(String) } });

    const stale = await localLoopdevAdapter.crm.archiveContact(created.contact.id, "stale-updated-at");
    expect(stale).toMatchObject({ status: "conflict", contact: { id: created.contact.id } });
  });

  it("bulk archives multiple contacts successfully", async () => {
    const c1 = await localLoopdevAdapter.crm.createContact({
      organizationId: "local-development-organization",
      firstName: "Bulk1",
      email: "bulk1@example.com",
    });
    const c2 = await localLoopdevAdapter.crm.createContact({
      organizationId: "local-development-organization",
      firstName: "Bulk2",
      email: "bulk2@example.com",
    });
    expect(c1.status).toBe("success");
    expect(c2.status).toBe("success");
    if (c1.status !== "success" || c2.status !== "success") return;

    const result = await localLoopdevAdapter.crm.bulkArchiveContacts([c1.contact.id, c2.contact.id]);
    expect(result).toEqual({ successCount: 2, failureCount: 0 });

    const page = await localLoopdevAdapter.crm.listContacts({
      organizationId: "local-development-organization",
      limit: 50,
    });
    const ids = page.items.map((item) => item.id);
    expect(ids).not.toContain(c1.contact.id);
    expect(ids).not.toContain(c2.contact.id);
  });
});
