import { describe, expect, it } from "vitest";
import { platformAdapter } from "@/loopdev/domains/platform";

describe("Platform record attachment transaction", () => {
  it("creates task metadata and attachments together", async () => {
    const scope = platformAdapter.getScope();
    const relation = { entityType: "contact" as const, entityId: "contact-transaction-test", scope };
    const task = await platformAdapter.work.createTask({
      ...scope,
      title: "Transactional attachment test",
      relation,
      attachments: [new File(["task"], "task.txt", { type: "text/plain" })],
    });

    expect(task.attachments).toHaveLength(1);
    expect(task.attachments?.[0]).toMatchObject({
      fileName: "task.txt",
      relation: { entityType: "task", entityId: task.id },
      attachmentStatus: "ready",
    });
  });
});
