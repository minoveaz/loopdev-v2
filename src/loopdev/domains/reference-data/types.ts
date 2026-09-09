export type ReferenceDataScope = "global" | "product" | "organization";

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
}

export interface OrganizationReferenceDataConfig {
  organizationId: string;
  allowedCountryCodes: string[];
  enabledCatalogs: string[];
  locale: string;
  currencyCode: string;
  timezone: string;
}
