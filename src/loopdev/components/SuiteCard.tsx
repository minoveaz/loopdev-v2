import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface SuiteCardProps {
  title: string;
  description: string;
  illustration: ReactNode;
  version: string;
  status?: "ready" | "lab";
  isLocked?: boolean;
  to?: string;
  className?: string;
}

export function SuiteCard({
  title,
  description,
  illustration,
  version,
  status,
  isLocked = false,
  to,
  className,
}: SuiteCardProps) {
  const navigate = useNavigate();
  const isNavigable = Boolean(to && !isLocked);

  return (
    <article
      aria-label={isNavigable ? `Open ${title}` : undefined}
      role={isNavigable ? "link" : undefined}
      tabIndex={isNavigable ? 0 : undefined}
      onClick={isNavigable ? () => navigate(to!) : undefined}
      onKeyDown={isNavigable ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(to!);
        }
      } : undefined}
      className={cn(
        "group relative flex min-h-[390px] flex-col overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-sm transition-all duration-500",
        !isLocked &&
          "cursor-pointer hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_45px_rgba(19,91,236,0.12)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(19,91,236,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(19,91,236,0.035)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative z-10 flex h-full flex-col p-6">
        <div className="mb-8 flex items-start justify-between gap-3">
          <span className="rounded-md border border-border bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            v{version}
          </span>
          {isLocked ? (
            <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] text-muted-foreground/70">
              {"{ LOCKED }"}
            </span>
          ) : (
            <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
              {status === "lab" ? "Lab" : "Ready"}
            </span>
          )}
        </div>

        <div className="mb-7 flex h-36 items-center justify-center text-primary">
          <div className="h-full w-full max-w-[170px] transition-transform duration-700 group-hover:scale-110">
            {illustration}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isLocked ? "bg-muted-foreground/30" : "animate-pulse bg-primary",
              )}
            />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {isLocked ? "Auth_Required" : "System_Ready"}
            </span>
          </div>
          {!isLocked && (
            <ArrowRight className="h-4 w-4 -translate-x-2 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          )}
        </div>
      </div>
    </article>
  );
}
