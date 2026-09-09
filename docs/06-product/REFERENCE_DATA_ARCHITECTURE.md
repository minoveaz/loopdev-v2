# LoopDev Reference Data Architecture

Reference Data is a platform capability shared by CRM, sales, marketing, billing,
support, identity and the future mobile application. Product domains consume its
adapter; they do not own country, document, gender, currency or timezone lists.

## Boundaries

- **Global reference data:** standards such as ISO countries, currencies,
  languages, timezones and administrative geography.
- **Product catalogs:** LoopDev-owned values such as pipeline stages, task
  priorities and communication channels.
- **Organization configuration:** tenant activation, ordering, labels and
  organization-specific additions.

Global and product values are identified by stable codes. Business records store
codes, never translated labels. Labels are resolved by the active locale.

## Frontend contract

The first local implementation is available at
`src/loopdev/domains/reference-data`. It exposes `referenceDataAdapter` and
React hooks for countries, subdivisions, cities, document types and genders.
The local adapter is deliberately small and deterministic; it will be replaced
by a Supabase adapter without changing consuming pages.

Geographic data is dependent:

```text
country -> subdivision -> city
```

Cities use search and a limit instead of loading the complete global city
catalogue into the browser.

## Supabase direction

The future persistence model should separate global rows from tenant rows:

- `reference_catalog_items`
- `reference_catalog_translations`
- `organization_reference_config`
- `organization_reference_items`

RLS must allow every authenticated tenant to read global values, while
organization values are isolated by `organization_id`. A tenant cannot update
global rows.

## Initial codes

Examples:

```ts
countryCode: "ES"
subdivisionCode: "ES-M"
cityCode: "ES-MAD"
genderCode: "female"
currencyCode: "EUR"
languageCode: "es"
timezone: "Europe/Madrid"
```

The current CRM string fields remain compatible during migration. New forms
should consume this adapter and persist codes as their contracts evolve.
