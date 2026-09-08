import { cn } from "@/lib/utils";

/**
 * Rivera shimmer placeholder.
 * Uses the shared `.skeleton-shimmer` utility (light + dark mode aware) so
 * every loading state across the app feels cohesive with surface-card.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-shimmer rounded-md", className)} {...props} />;
}

export { Skeleton };
