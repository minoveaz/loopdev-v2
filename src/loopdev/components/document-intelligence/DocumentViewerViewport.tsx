import { useRef, useState, type PointerEvent } from "react";
import type { FitMode } from "./DocumentViewerToolbar";

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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

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
          <iframe
            src={previewUrl}
            title={`Vista previa PDF: ${fileName}`}
            className="h-full w-full border-0 rounded"
          />
        ) : (
          <img
            src={previewUrl}
            alt={`Vista del documento: ${fileName}`}
            className={`${getImageFitClass()} rounded shadow-md pointer-events-none`}
          />
        )}
      </div>

      {!isPdf && (
        <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm">
          Arrastra para mover
        </span>
      )}
    </div>
  );
}
