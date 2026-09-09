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
} from "../types";

export interface ReferenceDataAdapter {
  listCountries(): Promise<Country[]>;
  listSubdivisions(countryCode: string): Promise<Subdivision[]>;
  searchCities(params: CitySearchParams): Promise<City[]>;
  listDocumentTypes(countryCode: string): Promise<DocumentType[]>;
  listGenderOptions(organizationId?: string): Promise<GenderOption[]>;
  listLanguages(): Promise<Language[]>;
  listCurrencies(): Promise<Currency[]>;
  listTimezones(): Promise<Timezone[]>;
  getOrganizationConfig(organizationId: string): Promise<OrganizationReferenceDataConfig>;
}

export const referenceDataAdapter: ReferenceDataAdapter = localReferenceDataAdapter;

export * from "../types";
