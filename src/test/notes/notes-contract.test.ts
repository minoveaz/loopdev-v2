import { describe, expect, it } from "vitest";
import { noteMentions, notePlainText } from "@/loopdev/domains/notes";

describe("global note serialization", () => {
  it("keeps rich JSON while producing a readable preview and unique mentions", () => {
    const content = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Follow up with " }, { type: "mention", attrs: { id: "agent-maya", label: "Maya Chen" } }] },
        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Confirm timeline" }] }] }] },
      ],
    };
    expect(notePlainText(content)).toBe("Follow up with Maya Chen\nConfirm timeline");
    expect(noteMentions(content)).toEqual([{ userId: "agent-maya", displayName: "Maya Chen" }]);
  });
});
