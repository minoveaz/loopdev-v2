import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/features/ui-kit/Showcase";
import { Progress } from "@/components/ui/progress";

const items = [
  { label: "Storage", value: 72 },
  { label: "Bandwidth", value: 45 },
  { label: "API quota", value: 88 },
  { label: "Seats", value: 30 },
];

function Ring({ value, label }: { value: number; label: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={92} height={92} className="-rotate-90">
        <circle cx={46} cy={46} r={r} stroke="hsl(var(--muted))" strokeWidth={8} fill="none" />
        <circle cx={46} cy={46} r={r} stroke="hsl(var(--primary))" strokeWidth={8} fill="none" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="text-sm font-medium">{value}% — {label}</div>
    </div>
  );
}

export default function ProgressChartsPage() {
  return (
    <PageContainer width="default">
      <PageHeader eyebrow="Components" title="Progress Charts" description="Linear and circular progress indicators." />
      <div className="grid gap-6 md:grid-cols-2">
        <Showcase title="Linear" hint="Progress">
          <div className="space-y-4">
            {items.map((it) => (
              <div key={it.label}>
                <div className="mb-1 flex justify-between text-xs"><span>{it.label}</span><span className="text-muted-foreground">{it.value}%</span></div>
                <Progress value={it.value} />
              </div>
            ))}
          </div>
        </Showcase>
        <Showcase title="Radial" hint="svg">
          <div className="flex flex-wrap gap-6">
            {items.map((it) => <Ring key={it.label} {...it} />)}
          </div>
        </Showcase>
      </div>
    </PageContainer>
  );
}