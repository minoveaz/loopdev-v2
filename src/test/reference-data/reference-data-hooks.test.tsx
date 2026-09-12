import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  useCountries,
  useOrganizationReferenceDataConfig,
} from "@/loopdev/domains/reference-data";

describe("reference data hooks", () => {
  it("loads organization configuration and scoped countries", async () => {
    const configResult = renderHook(() => useOrganizationReferenceDataConfig("local-development-organization"));
    const countriesResult = renderHook(() => useCountries("local-development-organization"));

    await waitFor(() => {
      expect(configResult.result.current.loading).toBe(false);
      expect(countriesResult.result.current.loading).toBe(false);
    });

    expect(configResult.result.current.config?.locale).toBe("en-US");
    expect(countriesResult.result.current.items.map((country) => country.code)).toEqual(["ES", "CO", "US"]);
  });
});
