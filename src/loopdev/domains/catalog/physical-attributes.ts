import { CatalogAdapterError } from "./types";
import type { ProductPhysicalAttributes } from "./types";

const physicalAttributeKeys = ["weightKg", "lengthCm", "widthCm", "heightCm"] as const;
type PhysicalAttributeKey = (typeof physicalAttributeKeys)[number];
type PhysicalAttributeDraft = Record<PhysicalAttributeKey, string>;

const weightFactorsToKg: Record<string, number> = {
  g: 0.001,
  kg: 1,
  oz: 0.028349523125,
  lb: 0.45359237,
};
const dimensionFactorsToCm: Record<string, number> = {
  mm: 0.1,
  cm: 1,
  m: 100,
  in: 2.54,
};

export function normalizePhysicalAttributes(value: unknown): ProductPhysicalAttributes | null {
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new CatalogAdapterError("Physical attributes must be an object.", "invalid-input");
  }

  const record = value as Record<string, unknown>;
  const unknownKey = Object.keys(record).find((key) => !physicalAttributeKeys.includes(key as PhysicalAttributeKey));
  if (unknownKey) {
    throw new CatalogAdapterError(`Unsupported physical attribute: ${unknownKey}.`, "invalid-input");
  }

  const result: ProductPhysicalAttributes = {};
  for (const key of physicalAttributeKeys) {
    const measurement = record[key];
    if (measurement === undefined) continue;
    if (typeof measurement !== "number" || !Number.isFinite(measurement) || measurement < 0) {
      throw new CatalogAdapterError("Physical measurements must be finite, non-negative numbers.", "invalid-input");
    }
    result[key] = measurement;
  }

  return Object.keys(result).length ? result : null;
}

export function parsePhysicalAttributeDraft(draft: PhysicalAttributeDraft): ProductPhysicalAttributes | null {
  const parsed: ProductPhysicalAttributes = {};
  for (const key of physicalAttributeKeys) {
    const value = draft[key].trim();
    if (!value) continue;
    const measurement = Number(value);
    if (!Number.isFinite(measurement) || measurement < 0) {
      throw new CatalogAdapterError("Physical measurements must be finite, non-negative numbers.", "invalid-input");
    }
    parsed[key] = measurement;
  }
  return normalizePhysicalAttributes(parsed);
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function convertValue(value: unknown, unit: unknown, factors: Record<string, number>, defaultUnit: string): number | undefined {
  const amount = numberValue(value);
  if (amount === null || amount < 0) return undefined;
  const normalizedUnit = typeof unit === "string" && unit.trim() ? unit.trim().toLowerCase() : defaultUnit;
  const factor = factors[normalizedUnit];
  return factor === undefined ? undefined : amount * factor;
}

export function legacyPhysicalAttributes(metadata: Record<string, unknown>): ProductPhysicalAttributes | null {
  const dimensions = metadata.dimensionsValue && typeof metadata.dimensionsValue === "object" && !Array.isArray(metadata.dimensionsValue)
    ? metadata.dimensionsValue as Record<string, unknown>
    : {};
  const legacyWeight = typeof metadata.weight === "string" ? metadata.weight.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*([a-zA-Z]+)$/) : null;
  const weightValue = metadata.weightValue ?? legacyWeight?.[1];
  const weightUnit = metadata.weightUnit ?? legacyWeight?.[2];
  const attributes: ProductPhysicalAttributes = {};

  const weightKg = convertValue(weightValue, weightUnit, weightFactorsToKg, "kg");
  if (weightKg !== undefined) attributes.weightKg = weightKg;

  for (const dimension of ["lengthCm", "widthCm", "heightCm"] as const) {
    const legacyKey = dimension.slice(0, -2);
    const value = convertValue(dimensions[legacyKey], dimensions.unit, dimensionFactorsToCm, "cm");
    if (value !== undefined) attributes[dimension] = value;
  }

  return Object.keys(attributes).length ? attributes : null;
}

export function formatPhysicalWeight(weightKg: number | null | undefined, locale?: string): string {
  if (weightKg == null) return "";
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
  return `${formatter.format(weightKg)} kg`;
}

export function formatPhysicalDimensions(attributes: ProductPhysicalAttributes | null | undefined, locale?: string): string {
  if (!attributes) return "";
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
  const dimensions = [attributes.lengthCm, attributes.widthCm, attributes.heightCm]
    .map((value) => value == null ? "" : formatter.format(value));
  return dimensions.some(Boolean) ? `${dimensions.map((value) => value || "—").join(" × ")} cm` : "";
}

export function formatPhysicalAttributes(attributes: ProductPhysicalAttributes | null | undefined, locale?: string): string {
  const weight = formatPhysicalWeight(attributes?.weightKg, locale);
  const dimensionsLabel = formatPhysicalDimensions(attributes, locale);
  return [weight, dimensionsLabel].filter(Boolean).join(" · ");
}
