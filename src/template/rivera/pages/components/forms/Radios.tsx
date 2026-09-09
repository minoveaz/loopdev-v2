import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function RadiosPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Radios" description="Single choice selectors." />
      <Showcase title="Plan" hint="radio-group">
        <RadioGroup defaultValue="pro" className="space-y-2">
          {["starter", "pro", "enterprise"].map((v) => (
            <div key={v} className="flex items-center gap-2">
              <RadioGroupItem value={v} id={v} />
              <Label htmlFor={v} className="capitalize">{v}</Label>
            </div>
          ))}
        </RadioGroup>
      </Showcase>
    </PageContainer>
  );
}