import { describe, it, expect } from "vitest";
import {
  splitSurnames,
  buildSurnames,
  formatFieldsForProfile,
  selectFieldsForProfile,
  getExportProfile,
  EXPORT_PROFILES,
} from "@/loopdev/domains/document-intelligence/data/export-profiles";
import type { IdentityDocumentFields } from "@/loopdev/domains/document-intelligence";

describe("Document Intelligence - Export Profiles & Surname Utilities", () => {
  describe("splitSurnames", () => {
    it("returns null values for null, undefined or empty input", () => {
      expect(splitSurnames(null)).toEqual({ firstSurname: null, secondSurname: null });
      expect(splitSurnames("")).toEqual({ firstSurname: null, secondSurname: null });
      expect(splitSurnames("   ")).toEqual({ firstSurname: null, secondSurname: null });
    });

    it("splits standard two single surnames", () => {
      expect(splitSurnames("García López")).toEqual({
        firstSurname: "García",
        secondSurname: "López",
      });
      expect(splitSurnames("Martínez Sanz")).toEqual({
        firstSurname: "Martínez",
        secondSurname: "Sanz",
      });
    });

    it("handles single surname", () => {
      expect(splitSurnames("Smith")).toEqual({
        firstSurname: "Smith",
        secondSurname: null,
      });
    });

    it("handles Spanish compound surname with 'de la'", () => {
      expect(splitSurnames("De la Torre Morales")).toEqual({
        firstSurname: "De la Torre",
        secondSurname: "Morales",
      });
      expect(splitSurnames("de la Rosa Gómez")).toEqual({
        firstSurname: "de la Rosa",
        secondSurname: "Gómez",
      });
    });

    it("handles Spanish compound surname with 'del'", () => {
      expect(splitSurnames("Del Pozo Santos")).toEqual({
        firstSurname: "Del Pozo",
        secondSurname: "Santos",
      });
      expect(splitSurnames("del Olmo Ruiz")).toEqual({
        firstSurname: "del Olmo",
        secondSurname: "Ruiz",
      });
    });

    it("handles compound prefix in the second surname", () => {
      expect(splitSurnames("Fernández de la Vega")).toEqual({
        firstSurname: "Fernández",
        secondSurname: "de la Vega",
      });
      expect(splitSurnames("López del Castillo")).toEqual({
        firstSurname: "López",
        secondSurname: "del Castillo",
      });
    });

    it("handles three or more tokens falling back gracefully", () => {
      expect(splitSurnames("García López Pérez")).toEqual({
        firstSurname: "García",
        secondSurname: "López Pérez",
      });
    });
  });

  describe("buildSurnames", () => {
    it("joins both first and second surname cleanly", () => {
      expect(buildSurnames("García", "López")).toBe("García López");
      expect(buildSurnames("De la Torre", "Morales")).toBe("De la Torre Morales");
    });

    it("returns single surname when only one is provided", () => {
      expect(buildSurnames("García", null)).toBe("García");
      expect(buildSurnames(null, "López")).toBe("López");
      expect(buildSurnames("", "Morales")).toBe("Morales");
      expect(buildSurnames("Smith", "")).toBe("Smith");
    });

    it("returns null when neither is provided", () => {
      expect(buildSurnames("", "")).toBeNull();
      expect(buildSurnames(null, null)).toBeNull();
    });
  });

  describe("formatFieldsForProfile", () => {
    const sampleFields: IdentityDocumentFields = {
      documentType: "spanish-dni",
      documentNumber: "48392019K",
      fullName: "Carmen García López",
      givenNames: "Carmen",
      surnames: "García López",
      firstSurname: "García",
      secondSurname: "López",
      nationality: "ESP",
      sex: "F",
      birthDate: "1992-08-15",
      expiryDate: "2031-10-14",
      issueDate: "2021-10-14",
      issuingCountry: "ESP",
      birthplace: "Madrid",
      address: "Calle Mayor 12, Madrid",
      supportNumber: "B1234567",
      mrz: null,
    };

    it("formats fields as multiline label: value text according to profile", () => {
      const text = formatFieldsForProfile(sampleFields, "aseguradora-1");
      expect(text).toContain("Número de documento: 48392019K");
      expect(text).toContain("Primer apellido: García");
      expect(text).toContain("Segundo apellido: López");
      expect(text).toContain("Nombre(s): Carmen");
      expect(text).toContain("Domicilio: Calle Mayor 12, Madrid");
    });

    it("formats fields for ICAO profile with English labels", () => {
      const text = formatFieldsForProfile(sampleFields, "icao-internacional");
      expect(text).toContain("Document Number: 48392019K");
      expect(text).toContain("Given Names: Carmen");
      expect(text).toContain("Surnames: García López");
      expect(text).toContain("Nationality: ESP");
    });

    it("substitutes dash for undefined fields", () => {
      const partial: IdentityDocumentFields = {
        ...sampleFields,
        documentNumber: null,
      };
      const text = formatFieldsForProfile(partial, "aseguradora-1");
      expect(text).toContain("Número de documento: —");
    });
  });

  describe("selectFieldsForProfile", () => {
    const sampleFields: IdentityDocumentFields = {
      documentType: "spanish-dni",
      issuingCountry: "ESP",
      fullName: "Carmen García López",
      nationality: "ESP",
      sex: "F",
      expiryDate: "2031-10-14",
      issueDate: "2021-10-14",
      birthplace: "Madrid",
      address: null,
      supportNumber: null,
      documentNumber: "48392019K",
      givenNames: "Carmen",
      surnames: "García López",
      firstSurname: "García",
      secondSurname: "López",
      birthDate: "1992-08-15",
      mrz: "IDESP...",
    };

    it("selects only fields relevant to aseguradora-1", () => {
      const subset = selectFieldsForProfile(sampleFields, "aseguradora-1");
      expect(subset).toHaveProperty("documentNumber", "48392019K");
      expect(subset).toHaveProperty("firstSurname", "García");
      expect(subset).toHaveProperty("secondSurname", "López");
      expect(subset).not.toHaveProperty("mrz");
    });

    it("selects only fields relevant to icao-internacional", () => {
      const subset = selectFieldsForProfile(sampleFields, "icao-internacional");
      expect(subset).toHaveProperty("mrz", "IDESP...");
      expect(subset).not.toHaveProperty("firstSurname");
    });
  });

  describe("EXPORT_PROFILES & getExportProfile", () => {
    it("contains exactly the 3 approved organization profiles", () => {
      expect(EXPORT_PROFILES.length).toBe(3);
      const profileIds = EXPORT_PROFILES.map((p) => p.id);
      expect(profileIds).toContain("aseguradora-1");
      expect(profileIds).toContain("aseguradora-2");
      expect(profileIds).toContain("icao-internacional");
    });

    it("retrieves profile by ID and defaults safely", () => {
      const p1 = getExportProfile("aseguradora-1");
      expect(p1.label).toBe("Aseguradora 1");

      const p2 = getExportProfile("aseguradora-2");
      expect(p2.label).toBe("Aseguradora 2");

      const fallback = getExportProfile("non-existent" as any);
      expect(fallback.id).toBe("aseguradora-1");
    });
  });
});
