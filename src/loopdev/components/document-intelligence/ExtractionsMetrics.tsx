import { FileSearch, CheckCircle2, Clock, Zap } from "lucide-react";
import { StatCard } from "@/components/common";
import type { ExtractionMetrics } from "@/loopdev/domains/document-intelligence";
import { useT } from "@/i18n";

interface ExtractionsMetricsProps {
  metrics: ExtractionMetrics | null;
  loading?: boolean;
}

export function ExtractionsMetrics({ metrics }: ExtractionsMetricsProps) {
  const total = metrics?.totalProcessed ?? 0;
  const t = useT();
  const completed = metrics?.completedCount ?? 0;
  const avgConfidence = metrics ? Math.round(metrics.averageConfidence * 100) : 0;
  const cost = metrics ? `$${metrics.estimatedCostUsd.toFixed(3)}` : "$0.00";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t("documentIntelligenceOverview.totalProcessed")}
        value={String(total)}
        hint={t("documentIntelligenceOverview.documentsOnPlatform")}
        icon={FileSearch}
        accent="primary"
      />
      <StatCard
        label={t("documentIntelligenceOverview.completed")}
        value={String(completed)}
        hint={t("documentIntelligenceOverview.reviewedApproved")}
        icon={CheckCircle2}
        accent="info"
      />
      <StatCard
        label={t("documentIntelligenceOverview.averageAccuracy")}
        value={`${avgConfidence}%`}
        hint={t("documentIntelligenceOverview.extractionConfidence")}
        icon={Zap}
        accent="gold"
      />
      <StatCard
        label={t("documentIntelligenceOverview.accumulatedCost")}
        value={cost}
        hint={t("documentIntelligenceOverview.inferenceTokens")}
        icon={Clock}
        accent="primary"
      />
    </div>
  );
}
