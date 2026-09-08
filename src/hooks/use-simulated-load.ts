import { useEffect, useState } from "react";

/**
 * Frontend-only loading simulation. Returns `true` for `delay` ms after mount
 * so dashboard cards and tables can show skeletons briefly, then real content.
 */
export function useSimulatedLoad(delay = 600): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(id);
  }, [delay]);
  return loading;
}