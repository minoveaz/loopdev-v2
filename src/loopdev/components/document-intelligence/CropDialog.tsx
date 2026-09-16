import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string;
  fileName?: string;
  onApplyCrop: (croppedBlob: Blob, previewUrl: string) => void;
}

export function CropDialog({
  open,
  onOpenChange,
  previewUrl,
  fileName = "documento-recortado.jpg",
  onApplyCrop,
}: CropDialogProps) {
  const [scale, setScale] = useState(0.85);
  const [applying, setApplying] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (open) {
      setScale(0.85);
      setApplying(false);
    }
  }, [open]);

  const handleApply = () => {
    setApplying(true);
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;
      const targetWidth = Math.round(naturalWidth * scale);
      const targetHeight = Math.round(naturalHeight * scale);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setApplying(false);
        return;
      }

      const offsetX = Math.round((naturalWidth - targetWidth) / 2);
      const offsetY = Math.round((naturalHeight - targetHeight) / 2);

      ctx.drawImage(
        image,
        offsetX,
        offsetY,
        targetWidth,
        targetHeight,
        0,
        0,
        targetWidth,
        targetHeight,
      );

      canvas.toBlob(
        (blob) => {
          setApplying(false);
          if (blob) {
            const nextUrl = URL.createObjectURL(blob);
            onApplyCrop(blob, nextUrl);
            onOpenChange(false);
          }
        },
        "image/jpeg",
        0.95,
      );
    };

    image.src = previewUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recortar imagen</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Ajusta el área para enfocar la identificación y eliminar bordes innecesarios antes de extraer.
          </p>
        </DialogHeader>

        <div className="relative flex min-h-[300px] max-h-[50vh] items-center justify-center overflow-hidden rounded-lg border border-border bg-slate-950 p-4">
          <img
            ref={imageRef}
            src={previewUrl}
            alt={`Vista para recortar: ${fileName}`}
            className="max-h-full max-w-full object-contain transition-all duration-150"
            style={{
              clipPath: `inset(${Math.round((1 - scale) * 50)}%)`,
            }}
          />
        </div>

        <div className="space-y-2 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Área visible</span>
            <span className="font-mono font-medium text-foreground">{Math.round(scale * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
            aria-label="Escala de recorte"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={applying}>
            {applying ? "Procesando..." : "Aplicar recorte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
