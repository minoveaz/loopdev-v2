import { describe, expect, it } from "vitest";
import { processLocalUpload } from "@/loopdev/domains/files";

describe("local upload worker", () => {
  it("reports queued, uploading, processing and ready states", async () => {
    const states: string[] = [];
    await processLocalUpload(new File(["content"], "brief.txt", { type: "text/plain" }), (progress) => states.push(progress.state));
    expect([...new Set(states)]).toEqual(["queued", "uploading", "processing", "ready"]);
  });

  it("supports cancellation through AbortSignal", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(processLocalUpload(new File(["content"], "brief.txt"), undefined, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});
