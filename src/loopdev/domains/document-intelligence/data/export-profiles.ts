import type { IdentityDocumentFields } from "../adapter/types";

export type ExportProfileId = "aseguradora-1" | "aseguradora-2" | "icao-internacional";
export type ExportProfileField = keyof IdentityDocumentFields;

export type ExportFieldGroup = "identity" | "personal" | "validity" | "address" | "mrz";

export interface ExportProfileFieldDefinition {
  field: ExportProfileField;
  label: string;
  span?: "full";
  group?: ExportFieldGroup;
}

export interface ExportProfile {
  id: ExportProfileId;
  label: string;
  description: string;
  fields: ExportProfileFieldDefinition[];
}

export const DEFAULT_EXPORT_PROFILE_ID: ExportProfileId = "aseguradora-1";

export const EXPORT_FIELD_GROUP_LABELS: Record<ExportFieldGroup, string> = {
  identity: "Identificación del documento",
  personal: "Datos personales y filiación",
  validity: "Fechas y validez",
  address: "Domicilio y localización",
  mrz: "Zona de lectura mecánica (MRZ)",
};

export const EXPORT_PROFILES: ExportProfile[] = [
  {
    id: "aseguradora-1",
    label: "Aseguradora 1",
    description: "Nombre(s), primer apellido y segundo apellido estrictamente separados.",
    fields: [
      { field: "documentNumber", label: "Número de documento", group: "identity" },
      { field: "supportNumber", label: "Número de soporte", group: "identity" },
      { field: "givenNames", label: "Nombre(s)", span: "full", group: "personal" },
      { field: "firstSurname", label: "Primer apellido", group: "personal" },
      { field: "secondSurname", label: "Segundo apellido", group: "personal" },
      { field: "birthDate", label: "Fecha de nacimiento", group: "personal" },
      { field: "sex", label: "Sexo", group: "personal" },
      { field: "nationality", label: "Nacionalidad", group: "personal" },
      { field: "expiryDate", label: "Fecha de caducidad", group: "validity" },
      { field: "address", label: "Domicilio", span: "full", group: "address" },
    ],
  },
  {
    id: "aseguradora-2",
    label: "Aseguradora 2",
    description: "Nombre(s) y apellidos completos agrupados en un solo bloque.",
    fields: [
      { field: "documentNumber", label: "Número de documento", group: "identity" },
      { field: "supportNumber", label: "Número de soporte", group: "identity" },
      { field: "givenNames", label: "Nombre(s)", group: "personal" },
      { field: "surnames", label: "Apellidos", group: "personal" },
      { field: "birthDate", label: "Fecha de nacimiento", group: "personal" },
      { field: "sex", label: "Sexo", group: "personal" },
      { field: "nationality", label: "Nacionalidad", group: "personal" },
      { field: "expiryDate", label: "Fecha de caducidad", group: "validity" },
      { field: "address", label: "Domicilio", span: "full", group: "address" },
    ],
  },
  {
    id: "icao-internacional",
    label: "ICAO / Internacional",
    description: "Formato internacional estándar para pasaportes y viajes con zona MRZ.",
    fields: [
      { field: "documentNumber", label: "Document Number", group: "identity" },
      { field: "issuingCountry", label: "Issuing Country", group: "identity" },
      { field: "givenNames", label: "Given Names", group: "personal" },
      { field: "surnames", label: "Surnames", group: "personal" },
      { field: "nationality", label: "Nationality", group: "personal" },
      { field: "birthDate", label: "Date of Birth", group: "personal" },
      { field: "sex", label: "Sex", group: "personal" },
      { field: "expiryDate", label: "Date of Expiry", group: "validity" },
      { field: "mrz", label: "MRZ (Machine Readable Zone)", span: "full", group: "mrz" },
    ],
  },
];

const profileById = new Map(EXPORT_PROFILES.map((profile) => [profile.id, profile]));

export function getExportProfile(id: ExportProfileId): ExportProfile {
  return profileById.get(id) ?? profileById.get(DEFAULT_EXPORT_PROFILE_ID)!;
}

/**
 * Divide apellidos de forma inteligente contemplando prefijos compuestos españoles
 * como "de la", "del", "de los", "santa", etc.
 */
export function splitSurnames(value: string | null): {
  firstSurname: string | null;
  secondSurname: string | null;
} {
  const clean = value?.trim().replace(/\s+/g, " ");
  if (!clean) return { firstSurname: null, secondSurname: null };

  const parts = clean.split(" ");
  if (parts.length === 1) return { firstSurname: parts[0], secondSurname: null };

  const compoundPrefixes = ["DE LA", "DE LAS", "DE LOS", "SANTA", "SAN", "DEL", "DE"];
  const upper = clean.toUpperCase();
  const prefix = compoundPrefixes.find((candidate) => upper.startsWith(`${candidate} `));

  if (prefix) {
    const rest = clean.slice(prefix.length).trim().split(" ");
    if (rest.length >= 2) {
      return {
        firstSurname: `${clean.slice(0, prefix.length)} ${rest[0]}`,
        secondSurname: rest.slice(1).join(" "),
      };
    }
  }

  return { firstSurname: parts[0], secondSurname: parts.slice(1).join(" ") };
}

/**
 * Concatena primer y segundo apellido preservando coherencia canónica.
 */
export function buildSurnames(
  firstSurname: string | null,
  secondSurname: string | null,
): string | null {
  const value = [firstSurname?.trim(), secondSurname?.trim()].filter(Boolean).join(" ");
  return value || null;
}

/**
 * Formatea los campos según el perfil seleccionado para copiado en texto plano.
 */
export function formatFieldsForProfile(
  fields: IdentityDocumentFields,
  profileId: ExportProfileId,
): string {
  const profile = getExportProfile(profileId);
  return profile.fields
    .map(({ field, label }) => `${label}: ${fields[field] ?? "—"}`)
    .join("\n");
}

/**
 * Extrae un subconjunto de los campos según el perfil seleccionado para copiado en formato JSON.
 */
export function selectFieldsForProfile(
  fields: IdentityDocumentFields,
  profileId: ExportProfileId,
): Partial<IdentityDocumentFields> {
  return Object.fromEntries(
    getExportProfile(profileId).fields.map(({ field }) => [field, fields[field]]),
  );
}
