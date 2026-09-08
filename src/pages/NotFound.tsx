import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.warn("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80" />
      <div className="relative">
        <div className="mb-10 flex justify-center">
          <Logo variant="light" />
        </div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-soft text-primary ring-1 ring-inset ring-primary/10">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">Error 404</p>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Off the map.
        </h1>
        <p className="mt-4 max-w-md text-balance text-muted-foreground">
          The page you were looking for has drifted away. Let's get you back to the harbor.
        </p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
          {location.pathname}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to="javascript:history.back()" onClick={(e) => { e.preventDefault(); history.back(); }}>
              <ArrowLeft className="h-4 w-4" /> Go back
            </Link>
          </Button>
          <Button variant="premium" asChild>
            <Link to="/">Return to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
