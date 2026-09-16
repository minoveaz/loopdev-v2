import { useId, useState } from "react";
import { AppDrawer } from "@/components/platform/AppDrawer";
import { Button } from "@/components/ui/button";
import { DocumentDropzone } from "./DocumentDropzone";
import { DocumentViewer } from "./DocumentViewer";
import { ExtractionProgressLoader } from "./ExtractionProgressLoader";
import { ExtractionTransitionSpinner } from "./ExtractionTransitionSpinner";
import { ExtractionReviewPanel } from "./ExtractionReviewPanel";
import {
  useExtractionSession,
  type IdentityDocumentFields,
  type ExtractionDocumentFile,
  type DocumentIntelligenceSourceSuite,
} from "@/loopdev/domains/document-intelligence";

export interface DocumentExtractionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceSuite?: DocumentIntelligenceSourceSuite;
  sourceReferenceId?: string | null;
  initialFile?: File | ExtractionDocumentFile | null;
  onApplyExtractedData: (fields: IdentityDocumentFields) => void;
}

export function DocumentExtractionDrawer({
  open,
  onOpenChange,
  sourceSuite = "crm",
  sourceReferenceId,
  initialFile = null,
  onApplyExtractedData,
}: DocumentExtractionDrawerProps) {
  const generatedId = useId().replace(/[:]/g, "-");
  const extractionSessionId = `drawer-${generatedId}`;

  const session = useExtractionSession({
    extractionId: extractionSessionId,
    sourceSuite,
    initialFile,
    onApplyExtractedData,
  });

  const handleApply = async (fields: any) => {
    const record = await session.confirmExtraction(fields);
    if (record) {
      onApplyExtractedData(record.fields);
      onOpenChange(false);
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
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      eyebrow="TOOLS / DOCUMENT INTELLIGENCE"
      title="Extracción de documento de identidad"
      description="Analiza y extrae los campos de identidad automáticamente para rellenar la ficha del cliente."
      confirmOnClose={session.step === "extracted"}
      confirmTitle="¿Descartar datos extraídos?"
      confirmDescription="Si cierras el drawer sin aplicar, los campos extraídos no se guardarán en el contacto."
    >
      <div className="space-y-4 py-2">
        {session.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {session.error}
          </div>
        )}

        {/* Paso 1: Dropzone (si no viene initialFile precargado) */}
        {session.step === "intake" && (
          <DocumentDropzone
            compact
            onFileSelected={session.selectFile}
            onSelectFixture={session.loadFixture}
          />
        )}

        {/* Paso 2: Preview con visor compacto y botón de extracción */}
        {session.step === "preview" && session.frontFile && (() => {
          const preview = getFilePreviewData();
          return (
            <div className="space-y-3.5">
              <DocumentViewer
                previewUrl={preview.url}
                fileName={preview.name}
                mimeType={preview.mimeType}
                className="h-[360px]"
                compact
              />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <Button variant="outline" size="sm" onClick={session.resetSession}>
                  Cambiar documento
                </Button>
                <Button size="sm" onClick={session.startExtraction}>
                  Extraer información
                </Button>
              </div>
            </div>
          );
        })()}

        {/* Paso 3: Loader detallado de progreso */}
        {session.step === "processing" && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <ExtractionProgressLoader
              steps={session.processingSteps}
              progressPercent={session.progressPercent}
            />
          </div>
        )}

        {/* Paso 4: Transición de 3 segundos con LogoSpinner */}
        {session.step === "transition" && (
          <div className="rounded-xl border border-border bg-card py-6 shadow-sm">
            <ExtractionTransitionSpinner />
          </div>
        )}

        {/* Paso 5: Revisión de campos con documento de referencia arriba */}
        {session.step === "extracted" && session.currentRecord && (() => {
          const preview = getFilePreviewData();
          return (
            <div className="space-y-4">
              {/* Documento colapsable o compacto arriba */}
              <div className="overflow-hidden rounded-xl border border-border bg-slate-950">
                <DocumentViewer
                  previewUrl={preview.url}
                  fileName={preview.name}
                  mimeType={preview.mimeType}
                  className="h-[220px]"
                  compact
                />
              </div>

              {/* Panel de revisión y botón de aplicar al contacto */}
              <ExtractionReviewPanel
                extraction={session.currentRecord}
                onConfirm={handleApply}
                onReset={session.resetSession}
                confirmLoading={session.actionLoading}
                confirmLabel="Aplicar al contacto"
                compact
              />
            </div>
          );
        })()}
      </div>
    </AppDrawer>
  );
}
