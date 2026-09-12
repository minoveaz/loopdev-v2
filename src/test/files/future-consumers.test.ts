import { describe, expect, it } from "vitest";
import {
  createFutureConsumerRelation,
  fileDefaultsForFutureConsumer,
} from "@/loopdev/domains/files";

describe("future Files Platform consumers", () => {
  it("creates provider-neutral relations", () => {
    const scope = { organizationId: "org-1", workspaceId: "workspace-1" };
    expect(createFutureConsumerRelation("content-studio", "piece-1", scope)).toMatchObject({
      entityType: "content-studio",
      entityId: "piece-1",
      scope,
    });
  });

  it("defaults Document Intelligence files to temporary retention", () => {
    expect(fileDefaultsForFutureConsumer({
      consumer: "document-intelligence",
      purpose: "intelligence-input",
    })).toEqual({
      category: "other",
      source: "temporary",
      temporary: true,
      retentionDays: 7,
    });
  });

  it("keeps creative suites durable by default", () => {
    expect(fileDefaultsForFutureConsumer({
      consumer: "marketing-studio",
      purpose: "creative-asset",
    })).toMatchObject({ source: "generated", temporary: false });
  });
});
