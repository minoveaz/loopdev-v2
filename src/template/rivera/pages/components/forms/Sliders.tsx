import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { Slider } from "@/components/ui/slider";

export default function SlidersPage() {
  const [v, setV] = useState([40]);
  const [r, setR] = useState([20, 80]);
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Sliders" description="Single and range slider controls." />
      <div className="grid gap-6 md:grid-cols-2">
        <Showcase title="Single" hint="slider">
          <Slider value={v} onValueChange={setV} max={100} step={1} />
          <p className="text-sm text-muted-foreground">Value: {v[0]}</p>
        </Showcase>
        <Showcase title="Range" hint="multi-thumb">
          <Slider value={r} onValueChange={setR} max={100} step={1} />
          <p className="text-sm text-muted-foreground">Range: {r[0]} – {r[1]}</p>
        </Showcase>
      </div>
    </PageContainer>
  );
}