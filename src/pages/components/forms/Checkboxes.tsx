import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/features/ui-kit/Showcase";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function CheckboxesPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Checkboxes" description="Multi-select toggles." />
      <Showcase title="Preferences" hint="checkbox">
        <div className="space-y-2">
          {["Email me updates", "Allow analytics", "Share usage data"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <Checkbox id={`c${i}`} defaultChecked={i === 0} />
              <Label htmlFor={`c${i}`}>{label}</Label>
            </div>
          ))}
        </div>
      </Showcase>
    </PageContainer>
  );
}