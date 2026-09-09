import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateVisualProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  showBrackets?: boolean;
}

export function EmptyStateVisual({
  children,
  className,
  size = "md",
  showBrackets = true,
}: EmptyStateVisualProps) {
  const sizeClasses = {
    sm: "h-24 w-24",
    md: "h-32 w-32",
    lg: "h-40 w-40",
  };

  return (
    <div className={cn("relative mb-8 flex items-center justify-center", sizeClasses[size], className)}>
      <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] border border-dashed border-slate-200 bg-slate-50 shadow-inner dark:border-white/10 dark:bg-white/5">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.12] dark:opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(#135bec 0.5px, transparent 0.5px)",
            backgroundSize: "12px 12px",
          }}
        />
      </div>
      {showBrackets && (
        <>
          <div className="absolute -left-3 -top-3 h-5 w-5 rounded-tl-sm border-l-2 border-t-2 border-primary/20" />
          <div className="absolute -bottom-3 -right-3 h-5 w-5 rounded-br-sm border-b-2 border-r-2 border-primary/20" />
        </>
      )}
      <div className="relative z-10 text-slate-400 transition-all duration-700 group-hover:scale-110 group-hover:text-primary">
        {children}
      </div>
    </div>
  );
}

export function AIBracketVisual({ children }: { children: ReactNode }) {
  return (
    <div className="relative mb-10 flex items-center justify-center">
      <div className="absolute inset-0 animate-pulse rounded-full bg-violet-500/5 blur-3xl" />
      <div className="relative flex items-center gap-6">
        <span className="text-5xl font-black text-violet-600">{"{"}</span>
        <div className="relative z-10">{children}</div>
        <span className="text-5xl font-black text-violet-600">{"}"}</span>
      </div>
    </div>
  );
}
