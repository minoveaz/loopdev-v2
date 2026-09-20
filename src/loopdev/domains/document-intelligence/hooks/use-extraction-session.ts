import { useState, useCallback, useEffect } from "react";
import { localDocumentIntelligenceAdapter } from "../adapter/local";
import { supabaseDocumentIntelligenceAdapter } from "../adapter/supabase";
import { DEMO_DOCUMENT_FIXTURES, type DocumentDemoFixture } from "../data/fixtures";
import type {
  ExtractionRecord,
  ExtractionDocumentFile,
  IdentityDocumentFields,
  DocumentIntelligenceSourceSuite,
} from "../adapter/types";

export type ExtractionSessionStep =
  | "intake"
  | "preview"
  | "processing"
  | "transition"
  | "extracted";

export interface ProcessingStepProgress {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

const DEFAULT_PROCESSING_STEPS: Array<{ id: string; label: string; description: string }> = [
  { id: "validate", label: "Validando archivo", description: "Comprobando formato, tamaño e integridad." },
  { id: "classify", label: "Identificando tipo documental", description: "Clasificando DNI, Pasaporte o Licencia." },
  { id: "extract", label: "Leyendo campos de identidad", description: "Inferencia y transcripción de evidencias." },
  { id: "normalize", label: "Normalizando resultado", description: "Estructurando campos y calculando confianza." },
];

export interface UseExtractionSessionOptions {
  extractionId: string;
  sourceSuite?: DocumentIntelligenceSourceSuite;
  initialFile?: File | ExtractionDocumentFile | null;
  onApplyExtractedData?: (fields: IdentityDocumentFields) => void;
}

export function useExtractionSession({
  extractionId,
  sourceSuite = "standalone",
  initialFile = null,
  onApplyExtractedData,
}: UseExtractionSessionOptions) {
  const adapter = supabaseDocumentIntelligenceAdapter;
  const [step, setStep] = useState<ExtractionSessionStep>("intake");
  const [currentRecord, setCurrentRecord] = useState<ExtractionRecord | null>(null);
  const [frontFile, setFrontFile] = useState<File | ExtractionDocumentFile | null>(initialFile);
  const [selectedFixture, setSelectedFixture] = useState<DocumentDemoFixture | null>(null);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar si ya existe la extracción en el histórico
  useEffect(() => {
    let active = true;
    setLoading(true);

    adapter
      .getExtraction(extractionId)
      .then((record) => {
        if (!active) return;
        if (record) {
          setCurrentRecord(record);
          setFrontFile(record.files.front);
          setStep("extracted");
        } else if (initialFile) {
          setFrontFile(initialFile);
          setStep("preview");
        } else {
          setStep("intake");
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Error al cargar la extracción.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [adapter, extractionId, initialFile]);

  // Selección o subida de archivo
  const selectFile = useCallback((file: File | ExtractionDocumentFile) => {
    setFrontFile(file);
    setSelectedFixture(null);
    setStep("preview");
  }, []);

  // Uso de fixture demo
  const loadFixture = useCallback((fixtureId?: string) => {
    const fixture =
      DEMO_DOCUMENT_FIXTURES.find((f) => f.id === fixtureId) ?? DEMO_DOCUMENT_FIXTURES[0];
    setSelectedFixture(fixture);
    setFrontFile({
      name: fixture.record.files.front?.name ?? fixture.name,
      size: fixture.record.files.front?.size ?? 45000,
      mimeType: fixture.mimeType,
      previewUrl: fixture.previewUrl,
    });
    setStep("preview");
  }, []);

  // Iniciar proceso de extracción
  const startExtraction = useCallback(async () => {
    if (!frontFile) return;
    setStep("processing");
    setProcessingIndex(0);
    setProgressPercent(15);
    setError(null);

    // Simulación de los 4 pasos del modelo secuenciales
    const totalSteps = DEFAULT_PROCESSING_STEPS.length;
    for (let i = 0; i < totalSteps; i++) {
      setProcessingIndex(i);
      setProgressPercent(Math.round(((i + 1) / totalSteps) * 85));
      await new Promise((res) => setTimeout(res, 850));
    }

    setProgressPercent(100);

    // Transición de 3 segundos con el LogoSpinner de Loopdev
    setStep("transition");
    await new Promise((res) => setTimeout(res, 3000));

    try {
      const result = await adapter.startExtraction({
        organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
        sourceSuite,
        frontFile,
        fixtureId: selectedFixture?.id,
      });

      if (result.ok) {
        setCurrentRecord(result.extraction);
        setStep("extracted");
      } else {
        const errMessage = "error" in result ? result.error.message : "Error al iniciar la extracción.";
        setError(errMessage);
        setStep("preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el documento.");
      setStep("preview");
    }
  }, [adapter, frontFile, sourceSuite, selectedFixture]);

  // Confirmar extracción y finalizar
  const confirmExtraction = useCallback(
    async (editedFields: Partial<IdentityDocumentFields>) => {
      if (!currentRecord) return;
      setActionLoading(true);

      try {
        const result = await adapter.confirmExtraction({
          extractionId: currentRecord.id,
          fields: editedFields,
        });

        if (result.ok) {
          setCurrentRecord(result.extraction);
          onApplyExtractedData?.(result.extraction.fields);
          return result.extraction;
        } else {
          const errMessage = "error" in result ? result.error.message : "Error al confirmar la extracción.";
          setError(errMessage);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al confirmar la extracción.");
      } finally {
        setActionLoading(false);
      }
    },
    [adapter, currentRecord, onApplyExtractedData],
  );

  // Reiniciar a nueva subida
  const resetSession = useCallback(() => {
    setFrontFile(null);
    setSelectedFixture(null);
    setCurrentRecord(null);
    setError(null);
    setStep("intake");
  }, []);

  const stepsProgress: ProcessingStepProgress[] = DEFAULT_PROCESSING_STEPS.map((s, idx) => ({
    ...s,
    isComplete: idx < processingIndex,
    isActive: idx === processingIndex,
  }));

  return {
    step,
    currentRecord,
    frontFile,
    selectedFixture,
    loading,
    actionLoading,
    error,
    processingSteps: stepsProgress,
    progressPercent,
    selectFile,
    loadFixture,
    startExtraction,
    confirmExtraction,
    resetSession,
  };
}
