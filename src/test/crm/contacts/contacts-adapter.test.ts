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
});
