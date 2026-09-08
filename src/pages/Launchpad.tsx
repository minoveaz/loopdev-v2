import { SuiteCatalog } from "@/components/loopdev";
import { useAuth } from "@/hooks/use-auth";

export default function Launchpad() {
  const { session } = useAuth();
  const displayName = session?.name ?? "Admin";

  return (
    <div className="relative isolate -mx-3 -my-5 min-h-[calc(100vh-4rem)] overflow-hidden bg-background sm:-mx-4 sm:-my-6 md:-mx-6 md:-my-7 lg:-mx-8 lg:-my-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(19,91,236,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(19,91,236,0.04)_1px,transparent_1px)] [background-size:32px_32px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <header className="mx-auto mb-14 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Loopdev / Workspace Launcher
          </div>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            Welcome, <span className="font-black text-primary">{displayName}</span>
            <span className="block">choose your next work context.</span>
          </h1>
        </header>
        <section aria-labelledby="available-suites-heading">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2
              id="available-suites-heading"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground"
            >
              Available suites
            </h2>
          </div>
          <SuiteCatalog />
        </section>
      </div>
    </div>
  );
}
