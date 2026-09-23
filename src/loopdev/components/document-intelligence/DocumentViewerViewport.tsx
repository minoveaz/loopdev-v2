import { useEffect, useRef, useState, type PointerEvent } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { FitMode } from "./DocumentViewerToolbar";
import { useT } from "@/i18n";

interface DocumentViewerViewportProps {
  previewUrl: string;
  fileName?: string;
  isPdf?: boolean;
  zoom: number;
  rotation: number;
  fitMode: FitMode;
}

export function DocumentViewerViewport({
  previewUrl,
  fileName = "Documento",
  isPdf = false,
  zoom,
  rotation,
  fitMode,
}: DocumentViewerViewportProps) {
  const t = useT();
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragOrigin = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    if (!isPdf || !previewUrl || !pdfCanvasRef.current) return;
    GlobalWorkerOptions.workerSrc = workerSrc;
    let cancelled = false;
    const canvas = pdfCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    void getDocument({ url: previewUrl }).promise.then(async (pdf) => {
      if (cancelled) return;
      const page = await pdf.getPage(1);
      if (cancelled) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1.8, 760 / baseViewport.width);
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, canvas, viewport }).promise;
    }).catch(() => {
      if (!cancelled) context.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      cancelled = true;
    };
  }, [isPdf, previewUrl]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || isPdf) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragOrigin.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: dragOrigin.current.panX + (e.clientX - dragOrigin.current.x),
      y: dragOrigin.current.panY + (e.clientY - dragOrigin.current.y),
    });
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  // Ajuste según el fitMode
  const getImageFitClass = () => {
    if (fitMode === "width") return "w-full h-auto";
    if (fitMode === "actual") return "w-auto h-auto max-w-none";
    return "max-w-full max-h-full object-contain"; // contain default
  };

  return (
    <div
      className={`relative flex flex-1 items-center justify-center overflow-hidden bg-slate-900/60 select-none ${
        !isPdf ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      <div
        className="flex h-full w-full items-center justify-center transition-transform duration-75 origin-center"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) rotate(${rotation}deg) scale(${zoom})`,
        }}
      >
        {isPdf ? (
          <canvas
            ref={pdfCanvasRef}
            aria-label={t("common.loopdev.documentIntelligence.documentPreviewPdf", { fileName })}
            className="max-h-full max-w-full rounded bg-white shadow-md"
          />
        ) : (
          <img
            src={previewUrl}
            alt={t("common.loopdev.documentIntelligence.documentPreview", { fileName })}
            className={`${getImageFitClass()} rounded shadow-md pointer-events-none`}
          />
        )}
      </div>

      {!isPdf && (
        <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm">
          {t("common.loopdev.documentIntelligence.dragToMove")}
        </span>
      )}
    </div>
  );
}
