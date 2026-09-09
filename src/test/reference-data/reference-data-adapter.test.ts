import { describe, expect, it } from "vitest";
import { referenceDataAdapter } from "@/loopdev/domains/reference-data";

describe("reference data adapter", () => {
  it("lists countries using stable ISO-style codes", async () => {
    const countries = await referenceDataAdapter.listCountries();

    expect(countries.map((country) => country.code)).toEqual(["ES", "CO", "US"]);
  });

  it("filters dependent subdivisions by country", async () => {
    const subdivisions = await referenceDataAdapter.listSubdivisions("ES");

    expect(subdivisions.every((subdivision) => subdivision.countryCode === "ES")).toBe(true);
    expect(subdivisions.map((subdivision) => subdivision.code)).toEqual(["ES-M", "ES-CT"]);
  });

  it("searches cities without loading unrelated countries", async () => {
    const cities = await referenceDataAdapter.searchCities({
      countryCode: "US",
      query: "new",
    });

    expect(cities.map((city) => city.code)).toEqual(["US-NYC"]);
  });

  it("returns document types for the selected country", async () => {
    const documentTypes = await referenceDataAdapter.listDocumentTypes("CO");

    expect(documentTypes.map((document) => document.code)).toEqual(["cedula", "passport"]);
  });

  it("returns the organization configuration separately from global values", async () => {
    const config = await referenceDataAdapter.getOrganizationConfig("local-development-organization");

    expect(config.allowedCountryCodes).toEqual(["ES", "US", "CO"]);
    expect(config.currencyCode).toBe("EUR");
    expect(config.customItems?.genders?.[0].code).toBe("self_described");
    expect(config.overrides?.genders?.male?.label).toBe("Man");
  });

  it("applies organization catalog additions and overrides only when scoped", async () => {
    const globalGenders = await referenceDataAdapter.listGenderOptions();
    const organizationGenders = await referenceDataAdapter.listGenderOptions("local-development-organization");

    expect(globalGenders.some((item) => item.code === "self_described")).toBe(false);
    expect(organizationGenders.some((item) => item.code === "self_described")).toBe(true);
    expect(organizationGenders.find((item) => item.code === "male")?.label).toBe("Man");
  });
});
