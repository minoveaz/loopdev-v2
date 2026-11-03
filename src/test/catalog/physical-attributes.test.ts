import { describe, expect, it } from "vitest";
import {
  formatPhysicalAttributes,
  formatPhysicalDimensions,
  formatPhysicalWeight,
  legacyPhysicalAttributes,
  normalizePhysicalAttributes,
  parsePhysicalAttributeDraft,
} from "@/loopdev/domains/catalog/physical-attributes";

describe("product physical attributes", () => {
  it("normalizes legacy supported units to canonical kg and cm", () => {
    expect(legacyPhysicalAttributes({
      weightValue: 450,
      weightUnit: "g",
      dimensionsValue: { length: 180, width: 120, height: 55, unit: "mm" },
    })).toEqual({
      weightKg: 0.45,
      lengthCm: 18,
      widthCm: 12,
      heightCm: 5.5,
    });
  });

  it("reads legacy display strings when structured values are absent", () => {
    expect(legacyPhysicalAttributes({
      weight: "2 lb",
      dimensionsValue: { length: 1, width: 2, height: 3, unit: "in" },
    })).toEqual({
      weightKg: 0.90718474,
      lengthCm: 2.54,
      widthCm: 5.08,
      heightCm: 7.62,
    });
  });

  it("rejects negative, non-finite, and unknown values", () => {
    expect(() => normalizePhysicalAttributes({ weightKg: -1 })).toThrow(/non-negative/);
    expect(() => normalizePhysicalAttributes({ lengthCm: Number.POSITIVE_INFINITY })).toThrow(/non-negative/);
    expect(() => normalizePhysicalAttributes({ widthCm: 10, unit: "in" })).toThrow(/Unsupported physical attribute/);
  });

  it("parses empty drafts as unset and formats metric values", () => {
    expect(parsePhysicalAttributeDraft({ weightKg: "", lengthCm: "", widthCm: "", heightCm: "" })).toBeNull();
    expect(parsePhysicalAttributeDraft({ weightKg: "0", lengthCm: "18", widthCm: "", heightCm: "5.5" })).toEqual({
      weightKg: 0,
      lengthCm: 18,
      heightCm: 5.5,
    });
    expect(formatPhysicalAttributes({ weightKg: 0.45, lengthCm: 18, widthCm: 12, heightCm: 5.5 }, "en")).toBe(
      "0.45 kg · 18 × 12 × 5.5 cm",
    );
    expect(formatPhysicalWeight(0.45, "en")).toBe("0.45 kg");
    expect(formatPhysicalDimensions({ lengthCm: 18, widthCm: 12, heightCm: 5.5 }, "en")).toBe("18 × 12 × 5.5 cm");
  });
});
