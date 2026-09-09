import {
  localCities,
  localCountries,
  localCurrencies,
  localDocumentTypes,
  localGenderOptions,
  localLanguages,
  localOrganizationReferenceDataConfig,
  localSubdivisions,
  localTimezones,
} from "../data/localReferenceData";
import type {
  OrganizationReferenceDataConfig,
  ReferenceDataAdapter,
  ReferenceDataCatalog,
  ReferenceDataItem,
  Country,
} from "./index";

function configFor(organizationId?: string): OrganizationReferenceDataConfig | undefined {
  return organizationId ? localOrganizationReferenceDataConfig : undefined;
}

function applyOrganizationItems<T extends ReferenceDataItem>(
  items: T[],
  catalog: ReferenceDataCatalog,
  config?: OrganizationReferenceDataConfig,
): T[] {
  if (!config) return items;
  if (!config.enabledCatalogs.includes(catalog)) return [];

  const customItems = (config.customItems?.[catalog] ?? []) as T[];
  const byCode = new Map(items.map((item) => [item.code, item]));
  customItems.forEach((item) => byCode.set(item.code, item));
  const overrides = (config.overrides?.[catalog] ?? {}) as Record<string, Partial<T>>;

  return [...byCode.values()]
    .map((item) => ({ ...item, ...(overrides[item.code] ?? {}) }))
    .filter((item) => item.isActive);
}

function countriesFor(organizationId?: string): Country[] {
  const config = configFor(organizationId);
  return applyOrganizationItems(localCountries, "countries", config)
    .filter((item) => !config || config.allowedCountryCodes.includes(item.code))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export const localReferenceDataAdapter: ReferenceDataAdapter = {
  async listCountries(organizationId) {
    return countriesFor(organizationId);
  },
  async listSubdivisions(countryCode, organizationId) {
    const config = configFor(organizationId);
    return applyOrganizationItems(localSubdivisions, "subdivisions", config)
      .filter((item) => !config || config.allowedCountryCodes.includes(item.countryCode))
      .filter((item) => item.countryCode === countryCode)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async searchCities({ countryCode, subdivisionCode, query, limit = 20, organizationId }) {
    const config = configFor(organizationId);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return applyOrganizationItems(localCities, "cities", config)
      .filter((item) => !config || config.allowedCountryCodes.includes(item.countryCode))
      .filter((item) => item.countryCode === countryCode)
      .filter((item) => !subdivisionCode || item.subdivisionCode === subdivisionCode)
      .filter((item) => !normalizedQuery || item.label.toLocaleLowerCase().includes(normalizedQuery))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, limit);
  },
  async listDocumentTypes(countryCode, organizationId) {
    const config = configFor(organizationId);
    return applyOrganizationItems(localDocumentTypes, "document-types", config)
      .filter((item) => !config || config.allowedCountryCodes.includes(item.countryCode))
      .filter((item) => item.countryCode === countryCode)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async listGenderOptions(organizationId) {
    return applyOrganizationItems(localGenderOptions, "genders", configFor(organizationId))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async listLanguages(organizationId) {
    return applyOrganizationItems(localLanguages, "languages", configFor(organizationId))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async listCurrencies(organizationId) {
    return applyOrganizationItems(localCurrencies, "currencies", configFor(organizationId))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async listTimezones(organizationId) {
    return applyOrganizationItems(localTimezones, "timezones", configFor(organizationId))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async getOrganizationConfig(organizationId) {
    if (organizationId !== localOrganizationReferenceDataConfig.organizationId) {
      return { ...localOrganizationReferenceDataConfig, organizationId };
    }
    return localOrganizationReferenceDataConfig;
  },
};
