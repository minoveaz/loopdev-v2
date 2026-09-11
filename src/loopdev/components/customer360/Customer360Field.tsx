import { ReadOnlyField } from "@/components/common";

export function Customer360Field({
  label,
  value,
  mono = false,
  copyable = true,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  copyable?: boolean;
}) {
  return <ReadOnlyField label={label} value={value} mono={mono} copyable={copyable} />;
}

export function formatCustomerAttribute(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}
