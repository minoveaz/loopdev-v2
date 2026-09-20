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
        label={t("crm.customer360.documentIntelligence.totalProcessed")}
        value={String(total)}
        hint={t("crm.customer360.documentIntelligence.documentsOnPlatform")}
        icon={FileSearch}
        accent="primary"
      />
      <StatCard
        label={t("crm.customer360.documentIntelligence.completed")}
        value={String(completed)}
        hint={t("crm.customer360.documentIntelligence.reviewedApproved")}
        icon={CheckCircle2}
        accent="info"
      />
      <StatCard
        label={t("crm.customer360.documentIntelligence.averageAccuracy")}
        value={`${avgConfidence}%`}
        hint={t("crm.customer360.documentIntelligence.extractionConfidence")}
        icon={Zap}
        accent="gold"
      />
      <StatCard
        label={t("crm.customer360.documentIntelligence.accumulatedCost")}
        value={cost}
        hint={t("crm.customer360.documentIntelligence.inferenceTokens")}
        icon={Clock}
        accent="primary"
      />
    </div>
  );
}
