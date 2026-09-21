import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_TASK_TEMPLATES,
  INITIAL_MOBILE_TASKS,
  localMobileTasksAdapter,
} from "../../../apps/mobile/adapters/tasks";
import { mobileFilesAdapter } from "../../../apps/mobile/adapters/files";
import { mobileCatalogAdapter } from "../../../apps/mobile/adapters/catalog";
import { mobileActivityTimelineAdapter } from "../../../apps/mobile/adapters/activity-timeline";

const organizationId = "org-test";

describe("mobile foundation parity", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("does not expose demo tasks or templates as production fallback data", async () => {
    expect(INITIAL_MOBILE_TASKS).toHaveLength(0);
    expect(DEFAULT_TASK_TEMPLATES).toHaveLength(0);
    const page = await localMobileTasksAdapter.listTasks({ organizationId });
    expect(page.items).toHaveLength(0);
  });

  it("keeps local files tenant-scoped and rejects unsupported uploads", async () => {
    await expect(mobileFilesAdapter.createFile({
      organizationId,
      name: "secret.exe",
      category: "other",
      source: "upload",
      relation: { entityType: "contact", entityId: "contact-1" },
      mediaType: "application/x-msdownload",
      size: 10,
    })).rejects.toThrow("not supported");

    await mobileFilesAdapter.createFile({
      organizationId,
      name: "identity.pdf",
      category: "identity",
      source: "upload",
      relation: { entityType: "contact", entityId: "contact-1" },
      mediaType: "application/pdf",
      size: 10,
    });
    expect((await mobileFilesAdapter.listFiles({ organizationId })).items).toHaveLength(1);
    expect((await mobileFilesAdapter.listFiles({ organizationId: "other-org" })).items).toHaveLength(0);
  });

  it("does not return catalog fixtures without a real organization", async () => {
    expect(await mobileCatalogAdapter.listCatalogs({ organizationId: "local-development-organization" })).toHaveLength(0);
    expect(await mobileCatalogAdapter.listCatalogItems({ organizationId: "local-development-organization" })).toHaveLength(0);
  });

  it("does not query or synthesize timeline events without tenant scope", async () => {
    await expect(mobileActivityTimelineAdapter.list({ scope: { organizationId: "" } })).resolves.toEqual([]);
  });
});
