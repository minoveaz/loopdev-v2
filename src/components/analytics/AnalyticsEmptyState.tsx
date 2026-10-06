import { BarChart3 } from "lucide-react";

export function AnalyticsEmptyState({ message = "Sin datos todavía", description = "Los datos aparecerán cuando el tenant registre actividad." }: { message?: string; description?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 text-center">
      <BarChart3 className="h-6 w-6 text-muted-foreground/60" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
