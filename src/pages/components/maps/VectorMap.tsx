import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/features/ui-kit/Showcase";
import { Badge } from "@/components/ui/badge";

const markers = [
  { name: "San Francisco", x: 14, y: 42 },
  { name: "New York", x: 28, y: 38 },
  { name: "London", x: 48, y: 32 },
  { name: "Berlin", x: 52, y: 32 },
  { name: "Tokyo", x: 84, y: 42 },
  { name: "Sydney", x: 88, y: 72 },
];

export default function VectorMapPage() {
  return (
    <PageContainer width="default">
      <PageHeader eyebrow="Components" title="Vector Map" description="Stylized world map placeholder — no real GIS data." />
      <Showcase title="Global presence" hint="placeholder">
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <svg viewBox="0 0 100 50" className="absolute inset-0 h-full w-full opacity-30">
            <path d="M5,30 Q25,10 45,25 T95,20 L95,40 Q70,35 50,40 T5,40 Z" fill="hsl(var(--muted-foreground))" />
          </svg>
          {markers.map((m) => (
            <div key={m.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
              <span className="block h-3 w-3 animate-pulse rounded-full bg-primary ring-4 ring-primary/20" />
              <span className="absolute left-4 top-0 whitespace-nowrap rounded bg-background/90 px-1.5 py-0.5 text-[10px] shadow">{m.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {markers.map((m) => <Badge key={m.name} variant="outline">{m.name}</Badge>)}
        </div>
      </Showcase>
    </PageContainer>
  );
}