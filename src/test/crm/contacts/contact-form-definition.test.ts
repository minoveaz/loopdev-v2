import { describe, expect, it } from "vitest";
import { contactFormFields, contactFormSections } from "../../../../packages/contracts/src/contact-form";

describe("contact form definition", () => {
  it("contains the canonical four sections and all 23 fields exactly once", () => {
    expect(contactFormSections.map(({ id }) => id)).toEqual(["identity", "channels", "organization", "address"]);
    expect(contactFormFields).toHaveLength(23);
    expect(new Set(contactFormFields.map(({ id }) => id)).size).toBe(23);
  });

  it("marks the same required fields used by validation", () => {
    expect(contactFormFields.filter(({ required }) => required).map(({ id }) => id)).toEqual(["firstName"]);
    expect(contactFormFields.filter(({ requiredGroup }) => requiredGroup).map(({ id }) => id)).toEqual(["email", "phone"]);
  });
});
