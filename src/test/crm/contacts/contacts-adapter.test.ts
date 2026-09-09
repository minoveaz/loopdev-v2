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
});
