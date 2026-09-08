import { useLocation } from "react-router-dom";
import { routeMeta } from "@/app/navigation";
import type { BreadcrumbItem } from "@/components/common";

/** Resolve breadcrumbs for the current route from the navigation config. */
export function useBreadcrumbs(): { trail: BreadcrumbItem[]; meta?: typeof routeMeta[string] } {
  const { pathname } = useLocation();
  const meta = routeMeta[pathname];
  const trail: BreadcrumbItem[] = [];
  if (!meta) return { trail };
  trail.push({ label: meta.section });
  for (const label of meta.trail) {
    if (label !== meta.label) trail.push({ label });
  }
  trail.push({ label: meta.label });
  return { trail, meta };
}
