import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReferenceDataItem } from "../types";

const EMPTY_VALUE = "__reference_data_empty__";

export interface ReferenceSelectProps<T extends Pick<ReferenceDataItem, "code" | "label">> {
  items: readonly T[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  preserveUnknown?: boolean;
  "aria-label"?: string;
  disabled?: boolean;
}

/**
 * Selects a stable reference code while retaining an unknown legacy value.
 */
export function ReferenceSelect<T extends Pick<ReferenceDataItem, "code" | "label">>({
  items,
  value,
  onValueChange,
  placeholder = "Select an option",
  emptyLabel = "Not provided",
  preserveUnknown = true,
  "aria-label": ariaLabel,
  disabled,
}: ReferenceSelectProps<T>) {
  const knownValue = items.some((item) => item.code === value);
  const unknownItem = preserveUnknown && value && !knownValue
    ? { code: value, label: `${value} (legacy value)` }
    : null;

  return (
    <Select
      value={value || EMPTY_VALUE}
      onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_VALUE ? "" : nextValue)}
      disabled={disabled}
    >
      <SelectTrigger aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem>
        {unknownItem && <SelectItem value={unknownItem.code}>{unknownItem.label}</SelectItem>}
        {items.map((item) => (
          <SelectItem key={item.code} value={item.code}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
