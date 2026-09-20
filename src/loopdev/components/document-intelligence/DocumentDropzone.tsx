import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { UploadCloud, Clipboard, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_DOCUMENT_FIXTURES } from "@/loopdev/domains/document-intelligence/data/fixtures";
import { useT } from "@/i18n";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "application/pdf"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface DocumentDropzoneProps {
  onFileSelected: (file: File) => void;
  onSelectFixture: (fixtureId: string) => void;
  compact?: boolean;
}

export function DocumentDropzone({
  onFileSelected,
  onSelectFixture,
  compact = false,
}: DocumentDropzoneProps) {
  const t = useT();
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError(t("common.loopdev.documentIntelligence.unsupportedFormat"));
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(t("common.loopdev.documentIntelligence.fileTooLarge"));
      return;
    }
    setError(null);
    onFileSelected(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
    e.target.value = "";
  };

  const handlePasteClipboard = async () => {
    try {
      if (!navigator.clipboard?.read) {
        setError(t("common.loopdev.documentIntelligence.clipboardUnavailable"));
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => ALLOWED_MIME_TYPES.includes(t));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType === "application/pdf" ? "pdf" : "png";
          const file = new File([blob], `portapapeles-${Date.now()}.${ext}`, { type: imageType });
          validateAndSelect(file);
          return;
        }
      }
      setError(t("common.loopdev.documentIntelligence.clipboardEmpty"));
    } catch {
      setError(t("common.loopdev.documentIntelligence.clipboardReadFailed"));
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 ${
        isDragOver
          ? "border-primary bg-primary/5 scale-[0.99]"
          : "border-border/80 bg-card/60 hover:border-primary/40 hover:bg-card/90"
      } ${compact ? "p-6 min-h-[260px]" : "p-10 min-h-[380px]"}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(",")}
        onChange={handleInputChange}
        className="sr-only"
        aria-label={t("common.loopdev.documentIntelligence.selectDocument")}
      />

      <div className="flex max-w-lg flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="font-display text-lg font-semibold text-foreground sm:text-xl">
          {t("common.loopdev.documentIntelligence.dropzoneTitle")}
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
          {t("common.loopdev.documentIntelligence.dropzoneDescription")}
        </p>

        {error && (
          <p role="alert" className="mt-3 text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <FileText className="me-2 h-4 w-4" />
            {t("common.loopdev.documentIntelligence.selectFile")}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handlePasteClipboard()}
          >
            <Clipboard className="me-2 h-4 w-4" />
            {t("common.loopdev.documentIntelligence.pasteImage")}
          </Button>
        </div>

        {/* Muestras / Fixtures rápidas para pruebas */}
        <div className="mt-8 border-t border-border/60 pt-5 text-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("common.loopdev.documentIntelligence.tryFixture")}
          </span>
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            {DEMO_DOCUMENT_FIXTURES.map((fixture) => (
              <Button
                key={fixture.id}
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onSelectFixture(fixture.id)}
              >
                <Sparkles className="me-1.5 h-3 w-3 text-primary" />
                {fixture.name.split(" ")[0]} ({fixture.documentType === "passport" ? t("common.loopdev.documentIntelligence.passport") : t("common.loopdev.documentIntelligence.nationalId")})
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
