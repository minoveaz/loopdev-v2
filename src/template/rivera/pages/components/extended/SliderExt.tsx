import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { Slider } from "@/components/ui/slider";

export default function SliderExtPage() {
  const [vol, setVol] = useState([60]);
  const [bri, setBri] = useState([80]);
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Slider" description="Extended slider controls with live values." />
      <div className="grid gap-6">
        <Showcase title="Volume" hint={`${vol[0]}%`}><Slider value={vol} onValueChange={setVol} max={100} /></Showcase>
        <Showcase title="Brightness" hint={`${bri[0]}%`}><Slider value={bri} onValueChange={setBri} max={100} /></Showcase>
      </div>
    </PageContainer>
  );
}