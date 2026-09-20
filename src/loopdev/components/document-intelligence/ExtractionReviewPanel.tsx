import { useState, useEffect } from "react";
import { Check, Copy, Code, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSectionHeader } from "@/components/common";
import { ExtractionProfileSelector } from "./ExtractionProfileSelector";
import { ExtractionFieldsGrid } from "./ExtractionFieldsGrid";
import { ExtractionActionsBar } from "./ExtractionActionsBar";
import {
  DEFAULT_EXPORT_PROFILE_ID,
  type ExportProfileId,
  type ExportProfileField,
  splitSurnames,
  buildSurnames,
  formatFieldsForProfile,
  selectFieldsForProfile,
} from "@/loopdev/domains/document-intelligence";
import type {
  ExtractionRecord,
  IdentityDocumentFields,
} from "@/loopdev/domains/document-intelligence";
import { useT } from "@/i18n";

interface ExtractionReviewPanelProps {
  extraction: ExtractionRecord;
  onConfirm: (fields: Partial<IdentityDocumentFields>) => void;
  onReset: () => void;
  confirmLoading?: boolean;
  confirmLabel?: string;
  compact?: boolean;
}

export function ExtractionReviewPanel({
  extraction,
  onConfirm,
  onReset,
  confirmLoading = false,
  confirmLabel,
  compact = false,
}: ExtractionReviewPanelProps) {
  const t = useT();
  const [profileId, setProfileId] = useState<ExportProfileId>(DEFAULT_EXPORT_PROFILE_ID);
  const [fields, setFields] = useState<IdentityDocumentFields>(extraction.fields);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    setFields(extraction.fields);
  }, [extraction.fields]);

  // Manejador con sincronización inteligente de apellidos
  const handleFieldChange = (field: ExportProfileField, value: string) => {
    setFields((prev) => {
      const updated = { ...prev, [field]: value };

      // Si editamos primer o segundo apellido, sincronizamos surnames (apellidos agrupados)
      if (field === "firstSurname" || field === "secondSurname") {
        updated.surnames = buildSurnames(
          field === "firstSurname" ? value : prev.firstSurname,
          field === "secondSurname" ? value : prev.secondSurname,
        );
      }

      // Si editamos surnames (apellidos agrupados), dividimos inteligentemente
      if (field === "surnames") {
        const { firstSurname, secondSurname } = splitSurnames(value);
        updated.firstSurname = firstSurname;
        updated.secondSurname = secondSurname;
      }

      return updated;
    });
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(formatFieldsForProfile(fields, profileId));
    setCopyFeedback(t("common.loopdev.documentIntelligence.fieldsCopied"));
    setTimeout(() => setCopyFeedback(null), 1800);
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(selectFieldsForProfile(fields, profileId), null, 2),
    );
    setCopyFeedback(t("common.loopdev.documentIntelligence.jsonCopied"));
    setTimeout(() => setCopyFeedback(null), 1800);
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      {/* Cabecera contextual */}
      <div className="border-b border-border pb-4">
        <FormSectionHeader
          eyebrow={t("common.loopdev.documentIntelligence.extraction")}
          title={t("common.loopdev.documentIntelligence.reviewTitle")}
          description={t("common.loopdev.documentIntelligence.reviewDescription")}
          mode={compact ? "compact" : "standard"}
          responsive="auto"
        />

        {/* Barra de Formatos y Acciones globales de Copiado */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-[240px] flex-1">
            <ExtractionProfileSelector
              value={profileId}
              onChange={setProfileId}
              compact={compact}
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={copyText}
              title={t("common.loopdev.documentIntelligence.copyFormattedTitle")}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {t("common.loopdev.documentIntelligence.copyFields")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={copyJson}
              title={t("common.loopdev.documentIntelligence.copyJsonTitle")}
            >
              <Code className="h-3.5 w-3.5" />
              {t("common.loopdev.documentIntelligence.copyJson")}
            </Button>
          </div>
        </div>

        {copyFeedback && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            <span>{copyFeedback} {t("common.loopdev.documentIntelligence.toClipboard")}</span>
          </div>
        )}
      </div>

      {/* Grid de campos editables con scroll independiente */}
      <div className="flex-1 overflow-y-auto py-4">
        <ExtractionFieldsGrid
          profileId={profileId}
          fields={fields}
          confidence={extraction.fieldConfidence}
          onChange={handleFieldChange}
        />
      </div>

      {/* Footer de confirmación */}
      <ExtractionActionsBar
        onConfirm={() => onConfirm(fields)}
        onReset={onReset}
        loading={confirmLoading}
        confirmLabel={confirmLabel ?? t("common.loopdev.documentIntelligence.confirmExtraction")}
      />
    </div>
  );
}
