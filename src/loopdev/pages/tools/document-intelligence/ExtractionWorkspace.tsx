import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, FileText } from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useExtractionSession } from "@/loopdev/domains/document-intelligence";
import { DocumentDropzone } from "@/loopdev/components/document-intelligence/DocumentDropzone";
import { DocumentViewer } from "@/loopdev/components/document-intelligence/DocumentViewer";
import { ExtractionProgressLoader } from "@/loopdev/components/document-intelligence/ExtractionProgressLoader";
import { ExtractionTransitionSpinner } from "@/loopdev/components/document-intelligence/ExtractionTransitionSpinner";
import { ExtractionReviewPanel } from "@/loopdev/components/document-intelligence/ExtractionReviewPanel";

export default function DocumentIntelligenceExtractionWorkspace() {
  const { extractionId = "nueva" } = useParams<{ extractionId: string }>();
  const navigate = useNavigate();
  const { trail } = useBreadcrumbs();

  const session = useExtractionSession({
    extractionId,
    sourceSuite: "standalone",
  });

  const handleConfirmAndFinish = async (fields: any) => {
    const record = await session.confirmExtraction(fields);
    if (record) {
      // Regresa al histórico global con la nueva extracción completada
      navigate("/app/tools/document-intelligence");
    }
  };

  const getFilePreviewData = () => {
    if (!session.frontFile) return { url: "", name: "Documento", mimeType: "image/jpeg" };
    const file = session.frontFile;
    const isNativeFile = file instanceof File;
    return {
      url: isNativeFile ? URL.createObjectURL(file) : file.previewUrl || "",
      name: file.name,
      mimeType: isNativeFile ? file.type : file.mimeType,
    };
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title={`Extracción ${extractionId}`}
        description="Flujo operativo para ingesta, pre-visualización y extracción neuronal de campos de identidad."
        breadcrumbs={
          trail.length
            ? trail
            : [
                { label: "Tools" },
                { label: "Document Intelligence", to: "/app/tools/document-intelligence" },
                { label: extractionId },
              ]
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/tools/document-intelligence">
                <ArrowLeft className="me-1.5 h-3.5 w-3.5" />
                Histórico
              </Link>
            </Button>
          </div>
        }
      />

      {session.error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {session.error}
        </div>
      )}

      <div className="mt-2 min-h-[560px]">
        {/* Paso 1: Dropzone de subida */}
        {session.step === "intake" && (
          <DocumentDropzone
            onFileSelected={session.selectFile}
            onSelectFixture={session.loadFixture}
          />
        )}

        {/* Paso 2: Preview con visor y botón para extraer */}
        {session.step === "preview" && session.frontFile && (() => {
          const preview = getFilePreviewData();
          return (
            <div className="space-y-4">
              <DocumentViewer
                previewUrl={preview.url}
                fileName={preview.name}
                mimeType={preview.mimeType}
                className="h-[520px]"
              />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <Button variant="outline" onClick={session.resetSession}>
                  Cambiar documento
                </Button>
                <Button onClick={session.startExtraction} className="gap-2">
                  Extraer información
                </Button>
              </div>
            </div>
          );
        })()}

        {/* Paso 3: Loader detallado por pasos */}
        {session.step === "processing" && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <ExtractionProgressLoader
              steps={session.processingSteps}
              progressPercent={session.progressPercent}
            />
          </div>
        )}

        {/* Paso 4: Transición de 3 segundos con LogoSpinner */}
        {session.step === "transition" && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <ExtractionTransitionSpinner />
          </div>
        )}

        {/* Paso 5: Split-Screen con documento a la izquierda y campos a la derecha */}
        {session.step === "extracted" && session.currentRecord && (() => {
          const preview = getFilePreviewData();
          return (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 min-h-[640px]">
              {/* Lado izquierdo: Visor fijado con la imagen/pdf procesada */}
              <div className="flex flex-col">
                <DocumentViewer
                  previewUrl={preview.url}
                  fileName={preview.name}
                  mimeType={preview.mimeType}
                  className="h-full min-h-[540px]"
                />
              </div>

              {/* Lado derecho: Panel de campos con las 3 opciones de organización */}
              <div className="flex flex-col">
                <ExtractionReviewPanel
                  extraction={session.currentRecord}
                  onConfirm={handleConfirmAndFinish}
                  onReset={session.resetSession}
                  confirmLoading={session.actionLoading}
                  confirmLabel="Confirmar extracción"
                />
              </div>
            </div>
          );
        })()}
      </div>
    </PageContainer>
  );
}
