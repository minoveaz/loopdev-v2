import { useEffect, useState } from "react";
import { referenceDataAdapter } from "../adapter";
import type { City, Country, DocumentType, GenderOption, Subdivision } from "../adapter";

function useAsyncList<T>(loader: () => Promise<T[]>, dependencies: unknown[]) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void loader()
      .then((result) => {
        if (active) setItems(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load reference data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  // The callers control the request identity through dependencies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { items, loading, error };
}

export function useCountries() {
  return useAsyncList<Country>(() => referenceDataAdapter.listCountries(), []);
}

export function useSubdivisions(countryCode: string | null) {
  return useAsyncList<Subdivision>(
    () => countryCode ? referenceDataAdapter.listSubdivisions(countryCode) : Promise.resolve([]),
    [countryCode],
  );
}

export function useCities(countryCode: string | null, subdivisionCode: string | null, query: string) {
  return useAsyncList<City>(
    () => countryCode
      ? referenceDataAdapter.searchCities({ countryCode, subdivisionCode, query })
      : Promise.resolve([]),
    [countryCode, subdivisionCode, query],
  );
}

export function useDocumentTypes(countryCode: string | null) {
  return useAsyncList<DocumentType>(
    () => countryCode ? referenceDataAdapter.listDocumentTypes(countryCode) : Promise.resolve([]),
    [countryCode],
  );
}

export function useGenderOptions(organizationId?: string) {
  return useAsyncList<GenderOption>(
    () => referenceDataAdapter.listGenderOptions(organizationId),
    [organizationId],
  );
}
