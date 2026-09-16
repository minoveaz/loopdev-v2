import { FileSearch, CheckCircle2, Clock, Zap } from "lucide-react";
import { StatCard } from "@/components/common";
import type { ExtractionMetrics } from "@/loopdev/domains/document-intelligence";

interface ExtractionsMetricsProps {
  metrics: ExtractionMetrics | null;
  loading?: boolean;
}

export function ExtractionsMetrics({ metrics }: ExtractionsMetricsProps) {
  const total = metrics?.totalProcessed ?? 0;
  const completed = metrics?.completedCount ?? 0;
  const avgConfidence = metrics ? Math.round(metrics.averageConfidence * 100) : 0;
  const cost = metrics ? `$${metrics.estimatedCostUsd.toFixed(3)}` : "$0.00";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total procesados"
        value={String(total)}
        hint="documentos en plataforma"
        icon={FileSearch}
        accent="primary"
      />
      <StatCard
        label="Completados"
        value={String(completed)}
        hint="revisados y aprobados"
        icon={CheckCircle2}
        accent="info"
      />
      <StatCard
        label="Precisión media"
        value={`${avgConfidence}%`}
        hint="confianza de extracción"
        icon={Zap}
        accent="gold"
      />
      <StatCard
        label="Coste acumulado"
        value={cost}
        hint="tokens de inferencia"
        icon={Clock}
        accent="primary"
      />
    </div>
  );
}
