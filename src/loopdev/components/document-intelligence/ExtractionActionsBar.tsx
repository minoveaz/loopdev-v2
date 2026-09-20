import { CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

interface ExtractionActionsBarProps {
  onConfirm: () => void;
  onReset: () => void;
  loading?: boolean;
  confirmLabel?: string;
}

export function ExtractionActionsBar({
  onConfirm,
  onReset,
  loading = false,
  confirmLabel,
}: ExtractionActionsBarProps) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onReset}
        disabled={loading}
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {t("common.loopdev.documentIntelligence.newDocument")}
      </Button>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="gap-2 shadow-sm"
        >
          <CheckCircle2 className="h-4 w-4" />
          {loading ? t("common.loopdev.documentIntelligence.confirming") : confirmLabel ?? t("common.loopdev.documentIntelligence.confirmExtraction")}
        </Button>
      </div>
    </div>
  );
}
