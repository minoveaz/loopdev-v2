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
} from "../types";

export const localCountries: Country[] = [
  { code: "CO", label: "Colombia", scope: "global", isActive: true, sortOrder: 20, phoneCode: "+57", defaultCurrencyCode: "COP", defaultLanguageCode: "es", defaultTimezone: "America/Bogota" },
  { code: "ES", label: "Spain", scope: "global", isActive: true, sortOrder: 10, phoneCode: "+34", defaultCurrencyCode: "EUR", defaultLanguageCode: "es", defaultTimezone: "Europe/Madrid" },
  { code: "US", label: "United States", scope: "global", isActive: true, sortOrder: 30, phoneCode: "+1", defaultCurrencyCode: "USD", defaultLanguageCode: "en", defaultTimezone: "America/New_York" },
];

export const localSubdivisions: Subdivision[] = [
  { code: "CO-DC", label: "Bogota D.C.", scope: "global", isActive: true, sortOrder: 10, countryCode: "CO", type: "region" },
  { code: "CO-ANT", label: "Antioquia", scope: "global", isActive: true, sortOrder: 20, countryCode: "CO", type: "department" },
  { code: "ES-M", label: "Madrid", scope: "global", isActive: true, sortOrder: 10, countryCode: "ES", type: "community" },
  { code: "ES-CT", label: "Catalonia", scope: "global", isActive: true, sortOrder: 20, countryCode: "ES", type: "community" },
  { code: "US-NY", label: "New York", scope: "global", isActive: true, sortOrder: 10, countryCode: "US", type: "state" },
  { code: "US-CA", label: "California", scope: "global", isActive: true, sortOrder: 20, countryCode: "US", type: "state" },
];

export const localCities: City[] = [
  { code: "CO-BOG", label: "Bogota", scope: "global", isActive: true, sortOrder: 10, countryCode: "CO", subdivisionCode: "CO-DC" },
  { code: "CO-MDE", label: "Medellin", scope: "global", isActive: true, sortOrder: 20, countryCode: "CO", subdivisionCode: "CO-ANT" },
  { code: "ES-MAD", label: "Madrid", scope: "global", isActive: true, sortOrder: 10, countryCode: "ES", subdivisionCode: "ES-M" },
  { code: "ES-BCN", label: "Barcelona", scope: "global", isActive: true, sortOrder: 20, countryCode: "ES", subdivisionCode: "ES-CT" },
  { code: "US-NYC", label: "New York", scope: "global", isActive: true, sortOrder: 10, countryCode: "US", subdivisionCode: "US-NY" },
  { code: "US-LAX", label: "Los Angeles", scope: "global", isActive: true, sortOrder: 20, countryCode: "US", subdivisionCode: "US-CA" },
];

export const localDocumentTypes: DocumentType[] = [
  { code: "dni", label: "DNI", scope: "global", isActive: true, sortOrder: 10, countryCode: "ES", documentCategory: "national-id" },
  { code: "nie", label: "NIE", scope: "global", isActive: true, sortOrder: 20, countryCode: "ES", documentCategory: "residence" },
  { code: "passport", label: "Passport", scope: "global", isActive: true, sortOrder: 30, countryCode: "ES", documentCategory: "travel" },
  { code: "cedula", label: "Cedula de ciudadania", scope: "global", isActive: true, sortOrder: 10, countryCode: "CO", documentCategory: "national-id" },
  { code: "passport", label: "Passport", scope: "global", isActive: true, sortOrder: 20, countryCode: "CO", documentCategory: "travel" },
  { code: "drivers-license", label: "Driver's license", scope: "global", isActive: true, sortOrder: 10, countryCode: "US", documentCategory: "national-id" },
  { code: "ssn", label: "Social Security Number", scope: "global", isActive: true, sortOrder: 20, countryCode: "US", documentCategory: "tax" },
  { code: "passport", label: "Passport", scope: "global", isActive: true, sortOrder: 30, countryCode: "US", documentCategory: "travel" },
];

export const localGenderOptions: GenderOption[] = [
  { code: "female", label: "Female", scope: "global", isActive: true, sortOrder: 10 },
  { code: "male", label: "Male", scope: "global", isActive: true, sortOrder: 20 },
  { code: "non_binary", label: "Non-binary", scope: "global", isActive: true, sortOrder: 30 },
  { code: "unspecified", label: "Unspecified", scope: "global", isActive: true, sortOrder: 40 },
  { code: "prefer_not_to_say", label: "Prefer not to say", scope: "global", isActive: true, sortOrder: 50 },
];

export const localLanguages: Language[] = [
  { code: "en", label: "English", nativeLabel: "English", scope: "global", isActive: true, sortOrder: 10 },
  { code: "es", label: "Spanish", nativeLabel: "Espanol", scope: "global", isActive: true, sortOrder: 20 },
];

export const localCurrencies: Currency[] = [
  { code: "COP", label: "Colombian peso", symbol: "$", minorUnit: 2, scope: "global", isActive: true, sortOrder: 10 },
  { code: "EUR", label: "Euro", symbol: "EUR", minorUnit: 2, scope: "global", isActive: true, sortOrder: 20 },
  { code: "USD", label: "US dollar", symbol: "$", minorUnit: 2, scope: "global", isActive: true, sortOrder: 30 },
];

export const localTimezones: Timezone[] = [
  { code: "America/Bogota", label: "Bogota", offset: "UTC-05:00", scope: "global", isActive: true, sortOrder: 10 },
  { code: "America/New_York", label: "Eastern Time", offset: "UTC-05:00", scope: "global", isActive: true, sortOrder: 20 },
  { code: "Europe/Madrid", label: "Madrid", offset: "UTC+01:00", scope: "global", isActive: true, sortOrder: 30 },
];

export const localOrganizationReferenceDataConfig: OrganizationReferenceDataConfig = {
  organizationId: "local-development-organization",
  allowedCountryCodes: ["ES", "US", "CO"],
  enabledCatalogs: ["countries", "subdivisions", "cities", "document-types", "genders", "languages", "currencies", "timezones"],
  locale: "en-US",
  currencyCode: "EUR",
  timezone: "Europe/Madrid",
  customItems: {
    genders: [
      {
        code: "self_described",
        label: "Self-described",
        scope: "organization",
        isActive: true,
        sortOrder: 35,
      },
    ],
  },
  overrides: {
    genders: {
      male: { label: "Man" },
    },
  },
};
