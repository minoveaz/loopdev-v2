export type ReferenceDataScope = "global" | "product" | "organization";

export type ReferenceDataCatalog =
  | "countries"
  | "subdivisions"
  | "cities"
  | "document-types"
  | "genders"
  | "languages"
  | "currencies"
  | "timezones";

export interface ReferenceDataItem {
  code: string;
  label: string;
  scope: ReferenceDataScope;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, string>;
}

export interface Country extends ReferenceDataItem {
  code: string;
  phoneCode: string;
  defaultCurrencyCode: string;
  defaultLanguageCode: string;
  defaultTimezone: string;
}

export interface Subdivision extends ReferenceDataItem {
  countryCode: string;
  type: "state" | "province" | "department" | "community" | "region";
}

export interface City extends ReferenceDataItem {
  countryCode: string;
  subdivisionCode: string | null;
}

export interface DocumentType extends ReferenceDataItem {
  countryCode: string;
  documentCategory: "national-id" | "residence" | "travel" | "tax";
}

export type GenderOption = ReferenceDataItem;

export interface Language extends ReferenceDataItem {
  nativeLabel: string;
}

export interface Currency extends ReferenceDataItem {
  symbol: string;
  minorUnit: number;
}

export interface Timezone extends ReferenceDataItem {
  offset: string;
}

export interface CitySearchParams {
  countryCode: string;
  subdivisionCode?: string | null;
  query: string;
  limit?: number;
  organizationId?: string;
}

export interface OrganizationReferenceDataConfig {
  organizationId: string;
  allowedCountryCodes: string[];
  enabledCatalogs: ReferenceDataCatalog[];
  locale: string;
  currencyCode: string;
  timezone: string;
  customItems?: OrganizationReferenceDataCustomItems;
  overrides?: OrganizationReferenceDataOverrides;
}

/**
 * Tenant-owned additions are typed per catalog so consumers can safely use
 * the fields required by the corresponding reference item.
 */
export interface OrganizationReferenceDataCustomItems {
  countries?: Country[];
  subdivisions?: Subdivision[];
  cities?: City[];
  "document-types"?: DocumentType[];
  genders?: GenderOption[];
  languages?: Language[];
  currencies?: Currency[];
  timezones?: Timezone[];
}

export type ReferenceDataItemOverride = Partial<
  Pick<ReferenceDataItem, "label" | "isActive" | "sortOrder" | "metadata">
>;

export type OrganizationReferenceDataOverrides = Partial<{
  [catalog in ReferenceDataCatalog]: Record<string, ReferenceDataItemOverride>;
}>;
