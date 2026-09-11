import { beforeEach, describe, expect, it } from "vitest";
import {
  createLocalFilesAdapter,
  FILES_LOCAL_STORAGE_KEY,
  type CreateFileMetadataInput,
} from "@/loopdev/domains/files";

const scope = { organizationId: "local-development-organization", workspaceId: "local-workspace" };
const relation = { entityType: "contact", entityId: "contact-1", scope };
const input: CreateFileMetadataInput = {
  scope,
  relation,
  fileName: "brief.pdf",
  mimeType: "application/pdf",
  byteSize: 120,
  uploadedById: "user-1",
};

beforeEach(() => window.localStorage.removeItem(FILES_LOCAL_STORAGE_KEY));

describe("local files adapter", () => {
  it("creates metadata and lists it by scope and relation without binary persistence", async () => {
    const adapter = createLocalFilesAdapter(window.localStorage);
    const created = await adapter.createMetadata(input);
    expect(created).toMatchObject({ fileName: "brief.pdf", status: "pending", byteSize: 120 });
    expect(created.versions[0].storageKey).toBeNull();
    expect(await createLocalFilesAdapter(window.localStorage).list({ scope, relation })).toHaveLength(1);
    expect(JSON.parse(window.localStorage.getItem(FILES_LOCAL_STORAGE_KEY) ?? "[]")[0].versions[0].storageKey).toBeNull();
  });

  it("rejects a different organization before reading or writing", async () => {
    const adapter = createLocalFilesAdapter(window.localStorage);
    await expect(adapter.list({ scope: { organizationId: "other-org" } })).rejects.toThrow("permission");
    await expect(adapter.createMetadata({ ...input, scope: { organizationId: "other-org" } })).rejects.toThrow("permission");
  });

  it("supports metadata lifecycle, relations, versioning and preview source isolation", async () => {
    const adapter = createLocalFilesAdapter(window.localStorage);
    const created = await adapter.createMetadata(input);
    const edited = await adapter.updateMetadata({ id: created.id, expectedVersion: 1, category: "identity", fileName: "identity.pdf" });
    expect(edited).toMatchObject({ category: "identity", fileName: "identity.pdf", currentVersion: 2 });
    const related = await adapter.relate(created.id, { entityType: "lead", entityId: "lead-1", scope }, 2);
    expect(related.relation.entityType).toBe("lead");
    const replaced = await adapter.replaceVersion({ id: created.id, expectedVersion: 3, fileName: "identity-v2.pdf", byteSize: 240 });
    expect(replaced.versions).toHaveLength(2);
    const archived = await adapter.archive(created.id, 4);
    expect(archived.status).toBe("archived");
    const restored = await adapter.restore(created.id, 5);
    expect(restored.status).toBe("ready");
    expect((await adapter.getPreviewSource(created.id))?.url).toBeNull();
    await expect(adapter.remove(created.id, 6)).resolves.toMatchObject({ status: "deleted" });
    await expect(adapter.remove(created.id, 5)).rejects.toThrow("changed");
  });
});
