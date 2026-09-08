import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

/**
 * RouteLoader — reusable Suspense fallback for lazy-loaded routes.
 *
 * Renders a full-page skeleton layout (stats, chart, table) instead of a
 * generic spinner so the loading state mirrors the eventual page shape
 * and reduces perceived wait time.
 */
export function RouteLoader() {
  return (
    <div className="min-h-[60vh] w-full bg-background p-4 md:p-6">
      <LoadingSkeleton variant="page" surface={false} label="Loading Rivera…" />
    </div>
  );
}

export default RouteLoader;