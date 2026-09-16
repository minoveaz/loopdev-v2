import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Crop,
  ExternalLink,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type FitMode = "contain" | "width" | "actual";

interface DocumentViewerToolbarProps {
  fitMode: FitMode;
  onFitModeChange: (mode: FitMode) => void;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRotate: () => void;
  onOpenCrop?: () => void;
  previewUrl?: string;
  isPdf?: boolean;
  compact?: boolean;
}

export function DocumentViewerToolbar({
  fitMode,
  onFitModeChange,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRotate,
  onOpenCrop,
  previewUrl,
  isPdf = false,
  compact = false,
}: DocumentViewerToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Controles del visor de documento"
      className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border bg-card/60 px-3 py-1.5 text-xs backdrop-blur-sm"
    >
      {/* Modos de ajuste */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant={fitMode === "contain" ? "secondary" : "ghost"}
          className="h-7 px-2 text-[11px]"
          onClick={() => onFitModeChange("contain")}
        >
          Ajustar
        </Button>
        <Button
          type="button"
          size="sm"
          variant={fitMode === "width" ? "secondary" : "ghost"}
          className="h-7 px-2 text-[11px]"
          onClick={() => onFitModeChange("width")}
        >
          Ancho
        </Button>
        {!compact && (
          <Button
            type="button"
            size="sm"
            variant={fitMode === "actual" ? "secondary" : "ghost"}
            className="h-7 px-2 text-[11px]"
            onClick={() => onFitModeChange("actual")}
          >
            100%
          </Button>
        )}
      </div>

      {/* Controles de Zoom, Giro y Herramientas */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="Alejar"
          onClick={onZoomOut}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>

        <button
          type="button"
          onClick={onResetZoom}
          className="min-w-[42px] px-1 text-center font-mono text-[11px] font-medium text-muted-foreground hover:text-foreground"
          title="Restablecer zoom"
        >
          {zoomPercent}%
        </button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="Acercar"
          onClick={onZoomIn}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-0.5 h-3.5 w-px bg-border" />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="Girar 90 grados"
          title="Girar 90°"
          onClick={onRotate}
        >
          <RotateCw className="h-3.5 w-3.5" />
        </Button>

        {!isPdf && onOpenCrop && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            aria-label="Recortar imagen"
            title="Recortar"
            onClick={onOpenCrop}
          >
            <Crop className="h-3.5 w-3.5" />
          </Button>
        )}

        {previewUrl && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            aria-label="Abrir en nueva pestaña"
            title="Abrir en pestaña nueva"
            asChild
          >
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
