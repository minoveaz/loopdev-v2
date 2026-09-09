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
`src/loopdev/domains/reference-data`. It exposes `referenceDataAdapter`,
organization configuration hooks, and reusable `ReferenceSelect` /
`ReferenceCombobox` components for countries, subdivisions, cities, document
types, genders, languages, currencies and timezones. Passing an organization
ID applies its enabled catalogs, allowed countries, custom items and label/
activity overrides. Omitting the ID preserves the global catalog behavior for
existing callers.
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
consume this adapter and persist codes (for example `ES`, `ES-M`, and
`ES-MAD`). Selectors retain unknown values as visibly marked legacy options, so
older labels such as `UK` or `London` are not silently discarded.

## Local-to-Supabase migration

The local adapter is deterministic fixture-backed code and does not require
Docker or a running service. `adapter/supabase.ts` contains only the typed
factory boundary for a future implementation; it intentionally has no client
or network dependency. A future adapter should map the existing methods to
the global and organization tables above, enforce `organization_id` in every
tenant query, and preserve the same stable-code contract. Migration can then
be staged as:

1. Backfill legacy CRM labels into codes where an unambiguous catalog match
   exists.
2. Keep unmatched values in the same fields until an organization resolves
   them; the UI will continue to show them as legacy values.
3. Switch the adapter provider without changing CRM forms or hooks.
