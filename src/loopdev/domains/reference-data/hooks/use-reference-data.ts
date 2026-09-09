import { useEffect, useState } from "react";
import { referenceDataAdapter } from "../adapter";
import type {
  City,
  Country,
  Currency,
  DocumentType,
  GenderOption,
  Language,
  OrganizationReferenceDataConfig,
  Subdivision,
  Timezone,
} from "../adapter";

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

export function useOrganizationReferenceDataConfig(organizationId: string | null) {
  const [config, setConfig] = useState<OrganizationReferenceDataConfig | null>(null);
  const [loading, setLoading] = useState(Boolean(organizationId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!organizationId) {
      setConfig(null);
      setLoading(false);
      setError(null);
      return () => { active = false; };
    }
    setLoading(true);
    setError(null);
    void referenceDataAdapter.getOrganizationConfig(organizationId)
      .then((result) => {
        if (active) setConfig(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load organization configuration.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [organizationId]);

  return { config, loading, error };
}

export function useCountries(organizationId?: string) {
  return useAsyncList<Country>(() => referenceDataAdapter.listCountries(organizationId), [organizationId]);
}

export function useSubdivisions(countryCode: string | null, organizationId?: string) {
  return useAsyncList<Subdivision>(
    () => countryCode ? referenceDataAdapter.listSubdivisions(countryCode, organizationId) : Promise.resolve([]),
    [countryCode, organizationId],
  );
}

export function useCities(countryCode: string | null, subdivisionCode: string | null, query: string, organizationId?: string) {
  return useAsyncList<City>(
    () => countryCode
      ? referenceDataAdapter.searchCities({ countryCode, subdivisionCode, query, organizationId })
      : Promise.resolve([]),
    [countryCode, subdivisionCode, query, organizationId],
  );
}

export function useDocumentTypes(countryCode: string | null, organizationId?: string) {
  return useAsyncList<DocumentType>(
    () => countryCode ? referenceDataAdapter.listDocumentTypes(countryCode, organizationId) : Promise.resolve([]),
    [countryCode, organizationId],
  );
}

export function useGenderOptions(organizationId?: string) {
  return useAsyncList<GenderOption>(
    () => referenceDataAdapter.listGenderOptions(organizationId),
    [organizationId],
  );
}

export function useLanguages(organizationId?: string) {
  return useAsyncList<Language>(() => referenceDataAdapter.listLanguages(organizationId), [organizationId]);
}

export function useCurrencies(organizationId?: string) {
  return useAsyncList<Currency>(() => referenceDataAdapter.listCurrencies(organizationId), [organizationId]);
}

export function useTimezones(organizationId?: string) {
  return useAsyncList<Timezone>(() => referenceDataAdapter.listTimezones(organizationId), [organizationId]);
}
