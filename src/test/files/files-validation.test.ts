import { describe, expect, it } from "vitest";
import { validateFile } from "@/loopdev/domains/files";

describe("file validation", () => {
  const file = (type: string, size = 100) => ({ name: "brief.pdf", type, size } as File);

  it("accepts configured MIME wildcards and rejects unsupported types", () => {
    expect(validateFile(file("image/png"), { acceptedTypes: ["image/*"] })).toEqual({ valid: true });
    expect(validateFile(file("application/javascript"), { acceptedTypes: ["image/*"] }).valid).toBe(false);
  });

  it("rejects files over the configured limit", () => {
    expect(validateFile(file("text/plain", 101), { maxSizeBytes: 100 })).toMatchObject({ valid: false });
  });
});
