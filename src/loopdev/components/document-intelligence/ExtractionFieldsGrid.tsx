import { useMemo } from "react";
import {
  CreditCard,
  User,
  Calendar,
  MapPin,
  Binary,
  type LucideIcon,
} from "lucide-react";
import { ExtractionFieldItem } from "./ExtractionFieldItem";
import {
  getExportProfile,
  EXPORT_FIELD_GROUP_LABELS,
  type ExportProfileId,
  type ExportProfileField,
  type ExportFieldGroup,
  type ExportProfileFieldDefinition,
} from "@/loopdev/domains/document-intelligence";
import type {
  IdentityDocumentFields,
  ExtractionFieldConfidence,
} from "@/loopdev/domains/document-intelligence";

interface ExtractionFieldsGridProps {
  profileId: ExportProfileId;
  fields: IdentityDocumentFields;
  confidence: ExtractionFieldConfidence;
  onChange: (field: ExportProfileField, value: string) => void;
}

const GROUP_ICONS: Record<ExportFieldGroup, LucideIcon> = {
  identity: CreditCard,
  personal: User,
  validity: Calendar,
  address: MapPin,
  mrz: Binary,
};

export function ExtractionFieldsGrid({
  profileId,
  fields,
  confidence,
  onChange,
}: ExtractionFieldsGridProps) {
  const profile = getExportProfile(profileId);

  // Agrupamos los campos preservando el orden de definición
  const groupedFields = useMemo(() => {
    const groups: {
      groupKey: ExportFieldGroup;
      label: string;
      items: ExportProfileFieldDefinition[];
    }[] = [];

    profile.fields.forEach((fieldDef) => {
      const groupKey: ExportFieldGroup = fieldDef.group ?? "personal";
      let existing = groups.find((g) => g.groupKey === groupKey);
      if (!existing) {
        existing = {
          groupKey,
          label: EXPORT_FIELD_GROUP_LABELS[groupKey] ?? groupKey,
          items: [],
        };
        groups.push(existing);
      }
      existing.items.push(fieldDef);
    });

    return groups;
  }, [profile]);

  return (
    <div className="flex flex-col gap-6">
      {groupedFields.map(({ groupKey, label, items }) => {
        const Icon = GROUP_ICONS[groupKey] ?? User;

        return (
          <section
            key={`${profileId}-${groupKey}`}
            className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/20 p-3.5 sm:p-4"
          >
            {/* Cabecera de grupo por tipología */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {label}
              </h4>
              <span className="text-[11px] text-muted-foreground ml-auto">
                {items.length} {items.length === 1 ? "campo" : "campos"}
              </span>
            </div>

            {/* Grid de campos del grupo */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {items.map(({ field, label: fieldLabel, span }) => {
                const val = String(fields[field] ?? "");
                const conf = confidence[field];

                return (
                  <ExtractionFieldItem
                    key={`${profileId}-${field}`}
                    field={field}
                    label={fieldLabel}
                    value={val}
                    confidence={conf}
                    span={span}
                    onChange={onChange}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

