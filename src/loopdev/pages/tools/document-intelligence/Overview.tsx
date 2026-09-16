import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles, SlidersHorizontal, RefreshCw } from "lucide-react";
import { PageContainer, PageHeader, SearchInput } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useDocumentIntelligence } from "@/loopdev/domains/document-intelligence";
import { ExtractionsMetrics } from "@/loopdev/components/document-intelligence/ExtractionsMetrics";
import { ExtractionsTable } from "@/loopdev/components/document-intelligence/ExtractionsTable";

export default function DocumentIntelligenceOverview() {
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [suiteFilter, setSuiteFilter] = useState<string>("all");

  const {
    extractions,
    metrics,
    loading,
    reload,
    deleteExtraction,
  } = useDocumentIntelligence({
    query: search,
    sourceSuite: suiteFilter !== "all" ? [suiteFilter as any] : undefined,
  });

  const handleStartExtraction = () => {
    // Genera un ID de sesión único y navega a la URL operativa
    const newExtractionId = `ext-${Date.now().toString(36)}`;
    navigate(`/app/tools/document-intelligence/${newExtractionId}`);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Document Intelligence"
        description="Centro operativo y registro histórico de extracción neuronal de documentos para todo Loopdev."
        breadcrumbs={trail.length ? trail : [{ label: "Tools" }, { label: "Document Intelligence" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={reload} title="Actualizar">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button onClick={handleStartExtraction} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Iniciar extracción
            </Button>
          </div>
        }
      />

      {/* Métricas consolidadas */}
      <div className="mb-6">
        <ExtractionsMetrics metrics={metrics} loading={loading} />
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[260px] flex-1">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar por nombre, documento o persona..."
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Origen:</span>
          </div>
          <Select value={suiteFilter} onValueChange={setSuiteFilter}>
            <SelectTrigger aria-label="Filtrar por suite de origen" className="h-9 w-44">
              <SelectValue placeholder="Todas las suites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las suites</SelectItem>
              <SelectItem value="standalone">Tools (Standalone)</SelectItem>
              <SelectItem value="crm">CRM</SelectItem>
              <SelectItem value="communications">Communications</SelectItem>
              <SelectItem value="files">Files Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla histórica */}
      <ExtractionsTable
        extractions={extractions}
        loading={loading}
        onDelete={deleteExtraction}
      />
    </PageContainer>
  );
}
