import { ArrowRight, FileText, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge, EmptyState } from "@/components/common";
import { formatDate } from "@/lib/formatters";
import type { ExtractionRecord } from "@/loopdev/domains/document-intelligence";

interface ExtractionsTableProps {
  extractions: ExtractionRecord[];
  loading?: boolean;
  onDelete?: (id: string) => void;
}

const statusToneMap: Record<ExtractionRecord["status"], "success" | "warning" | "neutral" | "info"> = {
  completed: "success",
  review: "warning",
  draft: "neutral",
  processing: "info",
  rejected: "neutral",
  failed: "neutral",
};

const statusLabelMap: Record<ExtractionRecord["status"], string> = {
  completed: "Completada",
  review: "En revisión",
  draft: "Borrador",
  processing: "Procesando",
  rejected: "Rechazada",
  failed: "Fallida",
};

const suiteLabelMap: Record<ExtractionRecord["sourceSuite"], string> = {
  standalone: "Tools / Standalone",
  crm: "CRM",
  communications: "Communications",
  files: "Files Platform",
};

export function ExtractionsTable({ extractions, loading, onDelete }: ExtractionsTableProps) {
  if (!loading && extractions.length === 0) {
    return (
      <EmptyState
        title="No hay extracciones registradas"
        description="Inicia un nuevo análisis o procesa un documento para ver el histórico centralizado."
        icon={FileText}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento / Título</TableHead>
            <TableHead>Tipo detectado</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead>Confianza</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {extractions.map((extraction) => {
            const confPercent = Math.round(extraction.overallConfidence * 100);
            return (
              <TableRow key={extraction.id} className="group">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-foreground">{extraction.title}</div>
                      <div className="text-xs text-muted-foreground font-mono">{extraction.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-xs font-mono">
                  {extraction.documentType.replace("-", " ")}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <span className="inline-flex rounded-md bg-secondary/80 px-2 py-0.5 font-medium text-secondary-foreground">
                    {suiteLabelMap[extraction.sourceSuite]}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`font-mono text-xs font-semibold ${
                      confPercent >= 90
                        ? "text-emerald-600 dark:text-emerald-400"
                        : confPercent >= 75
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {confPercent}%
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(extraction.createdAt)}
                </TableCell>
                <TableCell>
                  <StatusBadge dot tone={statusToneMap[extraction.status]}>
                    {statusLabelMap[extraction.status]}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onDelete && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Eliminar registro"
                        onClick={() => onDelete(extraction.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs font-medium text-primary hover:text-primary"
                      asChild
                    >
                      <Link to={`/app/tools/document-intelligence/${extraction.id}`}>
                        Abrir
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
