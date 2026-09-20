import { LogoSpinner } from "@/loopdev/components/LogoSpinner";
import { useT } from "@/i18n";

export function ExtractionTransitionSpinner() {
  const t = useT();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t("common.loopdev.documentIntelligence.finishingExtraction")}
      className="flex min-h-[460px] w-full flex-col items-center justify-center gap-5 p-8 text-center"
    >
      <div className="flex items-center justify-center">
        <LogoSpinner size="2xl" speed="fast" />
      </div>

      <div className="space-y-1.5">
        <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Loopdev / Neural Engine
        </div>
        <h4 className="font-display text-base font-semibold text-foreground">
          {t("common.loopdev.documentIntelligence.structuringData")}
        </h4>
        <p className="text-xs text-muted-foreground">
          {t("common.loopdev.documentIntelligence.reviewPreparation")}
        </p>
      </div>
    </div>
  );
}
