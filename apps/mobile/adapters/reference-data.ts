type ReferenceOption = { code: string; label: string };

const countries: ReferenceOption[] = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "ES", label: "Spain" },
  { code: "JP", label: "Japan" },
  { code: "FR", label: "France" },
  { code: "BR", label: "Brazil" },
  { code: "DE", label: "Germany" },
  { code: "IN", label: "India" },
];
const subdivisions: Record<string, ReferenceOption[]> = {
  US: [{ code: "US-NY", label: "New York" }, { code: "US-CA", label: "California" }],
  GB: [{ code: "GB-ENG", label: "England" }],
  ES: [{ code: "ES-M", label: "Madrid" }, { code: "ES-CT", label: "Catalonia" }],
  JP: [{ code: "JP-13", label: "Tokyo" }],
};
const cities: Record<string, ReferenceOption[]> = {
  US: [{ code: "NYC", label: "New York" }, { code: "SFO", label: "San Francisco" }],
  GB: [{ code: "LON", label: "London" }],
  ES: [{ code: "MAD", label: "Madrid" }, { code: "BCN", label: "Barcelona" }],
  JP: [{ code: "TYO", label: "Tokyo" }],
  FR: [{ code: "PAR", label: "Paris" }],
  BR: [{ code: "SAO", label: "Sao Paulo" }],
  DE: [{ code: "BER", label: "Berlin" }],
  IN: [{ code: "BOM", label: "Mumbai" }],
};

export const mobileReferenceDataAdapter = {
  async listCountries(): Promise<ReferenceOption[]> {
    return countries;
  },
  async listSubdivisions(countryCode: string): Promise<ReferenceOption[]> {
    return subdivisions[countryCode] ?? [];
  },
  async searchCities({ countryCode, query, limit = 20 }: { countryCode: string; subdivisionCode?: string | null; query: string; limit?: number }): Promise<ReferenceOption[]> {
    const normalized = query.trim().toLocaleLowerCase();
    return (cities[countryCode] ?? []).filter((city) => !normalized || city.label.toLocaleLowerCase().includes(normalized)).slice(0, limit);
  },
  async listDocumentTypes(countryCode: string): Promise<ReferenceOption[]> {
    return countryCode === "US"
      ? [{ code: "PASSPORT", label: "Passport" }, { code: "SSN", label: "Social Security Number" }]
      : [{ code: "PASSPORT", label: "Passport" }, { code: "NATIONAL_ID", label: "National ID" }];
  },
  async listGenderOptions(): Promise<ReferenceOption[]> {
    return [{ code: "female", label: "Female" }, { code: "male", label: "Male" }, { code: "non_binary", label: "Non-binary" }, { code: "not_specified", label: "Prefer not to say" }];
  },
  async listLanguages(): Promise<ReferenceOption[]> {
    return [{ code: "en", label: "English" }, { code: "es", label: "Spanish" }, { code: "fr", label: "French" }, { code: "pt", label: "Portuguese" }, { code: "ja", label: "Japanese" }];
  },
};