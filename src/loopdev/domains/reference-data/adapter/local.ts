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
import type { ReferenceDataAdapter } from "./index";

export const localReferenceDataAdapter: ReferenceDataAdapter = {
  async listCountries() {
    return localCountries.filter((item) => item.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async listSubdivisions(countryCode) {
    return localSubdivisions
      .filter((item) => item.isActive && item.countryCode === countryCode)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async searchCities({ countryCode, subdivisionCode, query, limit = 20 }) {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return localCities
      .filter((item) => item.isActive && item.countryCode === countryCode)
      .filter((item) => !subdivisionCode || item.subdivisionCode === subdivisionCode)
      .filter((item) => !normalizedQuery || item.label.toLocaleLowerCase().includes(normalizedQuery))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, limit);
  },
  async listDocumentTypes(countryCode) {
    return localDocumentTypes
      .filter((item) => item.isActive && item.countryCode === countryCode)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async listGenderOptions() {
    return localGenderOptions.filter((item) => item.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async listLanguages() {
    return localLanguages.filter((item) => item.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async listCurrencies() {
    return localCurrencies.filter((item) => item.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async listTimezones() {
    return localTimezones.filter((item) => item.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async getOrganizationConfig(organizationId) {
    if (organizationId !== localOrganizationReferenceDataConfig.organizationId) {
      return { ...localOrganizationReferenceDataConfig, organizationId };
    }
    return localOrganizationReferenceDataConfig;
  },
};
