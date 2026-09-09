import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common";
import { Showcase, ShowcaseRow } from "@/template/rivera/features/ui-kit/Showcase";
import { Button } from "@/components/ui/button";

export default function ToastsPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Toasts" description="Transient notifications powered by Sonner." />
      <Showcase title="Triggers" hint="sonner">
        <ShowcaseRow>
          <Button onClick={() => toast("Default toast")}>Default</Button>
          <Button variant="secondary" onClick={() => toast.success("Saved successfully")}>Success</Button>
          <Button variant="outline" onClick={() => toast.error("Something went wrong")}>Error</Button>
          <Button variant="ghost" onClick={() => toast.message("Heads up", { description: "With description" })}>With description</Button>
        </ShowcaseRow>
      </Showcase>
    </PageContainer>
  );
}