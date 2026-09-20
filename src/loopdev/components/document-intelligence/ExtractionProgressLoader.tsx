import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ProcessingStepProgress } from "@/loopdev/domains/document-intelligence";
import { useT } from "@/i18n";

interface ExtractionProgressLoaderProps {
  steps: ProcessingStepProgress[];
  progressPercent: number;
}

export function ExtractionProgressLoader({
  steps,
  progressPercent,
}: ExtractionProgressLoaderProps) {
  const t = useT();
  return (
    <div className="mx-auto flex min-h-[420px] max-w-xl flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
        <Sparkles className="h-8 w-8 animate-pulse" />
      </div>

      <h3 className="font-display text-xl font-semibold text-foreground">
        {t("common.loopdev.documentIntelligence.extractingData")}
      </h3>
      <p className="mt-1 max-w-md text-xs text-muted-foreground sm:text-sm">
        {t("common.loopdev.documentIntelligence.processingDescription")}
      </p>

      {/* Barra de progreso visual */}
      <div className="mt-8 w-full space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>{t("common.loopdev.documentIntelligence.processingInference")}</span>
          <span className="font-mono text-foreground font-semibold">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2 w-full" />
      </div>

      {/* Lista de pasos secuenciales */}
      <div className="mt-8 w-full space-y-3.5 text-left">
        {steps.map((step) => {
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-all duration-200 ${
                step.isActive
                  ? "border-primary/50 bg-primary/[0.03] shadow-sm"
                  : step.isComplete
                  ? "border-border/60 bg-card/40 opacity-90"
                  : "border-transparent bg-transparent opacity-40"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {step.isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : step.isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className={`text-xs font-semibold ${
                    step.isActive
                      ? "text-primary"
                      : step.isComplete
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-[11px] text-muted-foreground">{step.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
