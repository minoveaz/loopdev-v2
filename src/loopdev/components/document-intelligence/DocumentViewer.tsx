import { useState } from "react";
import { DocumentViewerToolbar, type FitMode } from "./DocumentViewerToolbar";
import { DocumentViewerViewport } from "./DocumentViewerViewport";
import { CropDialog } from "./CropDialog";

export interface DocumentViewerProps {
  previewUrl: string;
  fileName?: string;
  mimeType?: string;
  className?: string;
  compact?: boolean;
  onCropApplied?: (newBlob: Blob, newPreviewUrl: string) => void;
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

export function DocumentViewer({
  previewUrl,
  fileName = "Documento",
  mimeType = "image/jpeg",
  className = "",
  compact = false,
  onCropApplied,
}: DocumentViewerProps) {
  const [fitMode, setFitMode] = useState<FitMode>("contain");
  const [zoomIndex, setZoomIndex] = useState(2); // 1.0 (100%) por defecto
  const [rotation, setRotation] = useState(0);
  const [cropOpen, setCropOpen] = useState(false);
  const [activeUrl, setActiveUrl] = useState(previewUrl);

  const isPdf = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  const zoom = ZOOM_STEPS[zoomIndex] ?? 1;
  const zoomPercent = Math.round(zoom * 100);

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_STEPS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleResetZoom = () => {
    setZoomIndex(2); // 100%
    setRotation(0);
    setFitMode("contain");
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleCropApply = (croppedBlob: Blob, newPreviewUrl: string) => {
    setActiveUrl(newPreviewUrl);
    onCropApplied?.(croppedBlob, newPreviewUrl);
  };

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm ${className}`}>
      <DocumentViewerToolbar
        fitMode={fitMode}
        onFitModeChange={setFitMode}
        zoomPercent={zoomPercent}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onRotate={handleRotate}
        onOpenCrop={!isPdf ? () => setCropOpen(true) : undefined}
        previewUrl={activeUrl}
        isPdf={isPdf}
        compact={compact}
      />

      <DocumentViewerViewport
        previewUrl={activeUrl}
        fileName={fileName}
        isPdf={isPdf}
        zoom={zoom}
        rotation={rotation}
        fitMode={fitMode}
      />

      {!isPdf && (
        <CropDialog
          open={cropOpen}
          onOpenChange={setCropOpen}
          previewUrl={activeUrl}
          fileName={fileName}
          onApplyCrop={handleCropApply}
        />
      )}
    </div>
  );
}
