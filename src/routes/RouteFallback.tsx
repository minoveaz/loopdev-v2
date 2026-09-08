import { Loader2 } from "lucide-react";

/**
 * Suspense fallback shown while a lazy-loaded route chunk is being
 * downloaded. Centered, themed, accessible. Uses semantic tokens so it
 * looks correct in light/dark + every brand preset.
 */
export function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 bg-background text-muted-foreground"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm font-medium">Loading…</span>
    </div>
  );
}