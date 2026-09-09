import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/common";
import { Sun, Moon } from "lucide-react";

const VARIANTS: { name: string; className: string; note: string }[] = [
  { name: "surface-card", className: "surface-card", note: "Default card surface" },
  { name: "surface-card + hover", className: "surface-card surface-card-hover", note: "Hover lifts shadow" },
  { name: "surface-card-muted", className: "surface-card-muted", note: "Low-emphasis panel" },
  { name: "surface-card-strong", className: "surface-card-strong", note: "Hero / highlighted" },
  { name: "surface-card-raised", className: "surface-card-raised", note: "Alias of -strong" },
  { name: "surface-card-compact", className: "surface-card-compact", note: "Dense tile (rounded-xl)" },
  { name: "surface-card-muted-compact", className: "surface-card-muted-compact", note: "Dense muted tile" },
  { name: "surface-card-interactive", className: "surface-card-interactive", note: "Clickable + hover lift" },
  { name: "surface-card-muted-interactive", className: "surface-card-muted-interactive", note: "Muted clickable" },
];

const SHADOWS = ["shadow-xs", "shadow-soft", "shadow-elegant", "shadow-elevated"];

export default function CardVariants() {
  const { resolvedTheme, toggle } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <PageContainer width="wide" className="space-y-8">
      <PageHeader
        title="Card variants"
        description="Visual regression checklist for every card-like surface utility. Toggle themes to verify both modes."
        actions={
          <Button variant="outline" onClick={toggle} className="gap-2">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Cycle theme
          </Button>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Surface variants</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {VARIANTS.map((v) => (
            <div key={v.name} className={`${v.className} p-5`}>
              <p className="font-mono text-xs text-muted-foreground">.{v.name}</p>
              <p className="mt-2 text-base font-semibold text-foreground">{v.note}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The quick brown fox jumps over the lazy dog. Verify shadow, radius, and bg in both themes.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Shadow tokens</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {SHADOWS.map((s) => (
            <div key={s} className={`rounded-xl bg-card p-5 ${s}`}>
              <p className="font-mono text-xs text-muted-foreground">.{s}</p>
              <p className="mt-2 text-sm text-foreground">Modern Tailwind elevation</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Density check</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="surface-card-compact p-4">
              <p className="text-xs text-muted-foreground">Tile {i + 1}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">$1,2{i}0</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Nested composition</h2>
        <div className="surface-card p-6">
          <p className="text-base font-semibold text-foreground">Outer surface-card</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="surface-card-muted p-4">
              <p className="text-sm font-medium text-foreground">Nested muted</p>
              <p className="text-xs text-muted-foreground">Should sit cleanly inside the outer card.</p>
            </div>
            <div className="surface-card-muted-compact p-4">
              <p className="text-sm font-medium text-foreground">Nested muted compact</p>
              <p className="text-xs text-muted-foreground">Tighter radius for dense content.</p>
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}