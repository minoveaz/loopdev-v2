import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/features/ui-kit/Showcase";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SwitchesPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Switches" description="Binary on/off settings." />
      <Showcase title="Notifications" hint="switch">
        <div className="space-y-3">
          {["Push notifications", "Weekly digest", "Marketing emails"].map((label, i) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor={`s${i}`}>{label}</Label>
              <Switch id={`s${i}`} defaultChecked={i !== 2} />
            </div>
          ))}
        </div>
      </Showcase>
    </PageContainer>
  );
}