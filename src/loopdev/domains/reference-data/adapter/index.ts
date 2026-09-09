import { localReferenceDataAdapter } from "./local";
import type {
  City,
  CitySearchParams,
  Country,
  Currency,
  DocumentType,
  GenderOption,
  Language,
  OrganizationReferenceDataConfig,
  Subdivision,
  Timezone,
  ReferenceDataCatalog,
} from "../types";

export interface ReferenceDataAdapter {
  listCountries(organizationId?: string): Promise<Country[]>;
  listSubdivisions(countryCode: string, organizationId?: string): Promise<Subdivision[]>;
  searchCities(params: CitySearchParams): Promise<City[]>;
  listDocumentTypes(countryCode: string, organizationId?: string): Promise<DocumentType[]>;
  listGenderOptions(organizationId?: string): Promise<GenderOption[]>;
  listLanguages(organizationId?: string): Promise<Language[]>;
  listCurrencies(organizationId?: string): Promise<Currency[]>;
  listTimezones(organizationId?: string): Promise<Timezone[]>;
  getOrganizationConfig(organizationId: string): Promise<OrganizationReferenceDataConfig>;
}

export const referenceDataAdapter: ReferenceDataAdapter = localReferenceDataAdapter;

export * from "../types";
export type { SupabaseReferenceDataAdapterFactory, SupabaseReferenceDataAdapterOptions } from "./supabase";
export type { ReferenceDataCatalog };
