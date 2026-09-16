import { LogoSpinner } from "@/loopdev/components/LogoSpinner";

export function ExtractionTransitionSpinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Finalizando y preparando los campos extraídos"
      className="flex min-h-[460px] w-full flex-col items-center justify-center gap-5 p-8 text-center"
    >
      <div className="flex items-center justify-center">
        <LogoSpinner size="2xl" speed="fast" />
      </div>

      <div className="space-y-1.5">
        <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Loopdev / Neural Engine
        </div>
        <h4 className="font-display text-base font-semibold text-foreground">
          Estructurando datos y sincronizando perfiles...
        </h4>
        <p className="text-xs text-muted-foreground">
          Preparando el panel de revisión humana y cálculo de confianza.
        </p>
      </div>
    </div>
  );
}
