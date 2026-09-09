import { Link } from "react-router-dom";
import { RefreshCw, ServerCrash } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";

export default function Error500() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80" />
      <div className="relative">
        <div className="mb-10 flex justify-center">
          <Logo variant="light" />
        </div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20">
          <ServerCrash className="h-7 w-7" />
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-destructive">Error 500</p>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Something broke.
        </h1>
        <p className="mt-4 max-w-md text-balance text-muted-foreground">
          Our servers tripped on a wave. Try again in a moment, or head back to safety.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
          <Button variant="premium" asChild>
            <Link to="/">Return to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
