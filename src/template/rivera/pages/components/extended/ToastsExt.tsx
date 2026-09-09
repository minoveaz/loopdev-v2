import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common";
import { Showcase, ShowcaseRow } from "@/template/rivera/features/ui-kit/Showcase";
import { Button } from "@/components/ui/button";

export default function ToastsExtPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Toast Examples" description="Extended sonner patterns — actions, promises, durations." />
      <div className="grid gap-6 md:grid-cols-2">
        <Showcase title="With action" hint="action">
          <ShowcaseRow>
            <Button onClick={() => toast("Item archived", { action: { label: "Undo", onClick: () => toast.success("Restored") } })}>Show</Button>
          </ShowcaseRow>
        </Showcase>
        <Showcase title="Promise" hint="async">
          <ShowcaseRow>
            <Button onClick={() => toast.promise(new Promise((res) => setTimeout(res, 1500)), { loading: "Saving…", success: "Saved", error: "Failed" })}>Run</Button>
          </ShowcaseRow>
        </Showcase>
        <Showcase title="Long duration" hint="duration">
          <ShowcaseRow><Button onClick={() => toast("Sticky toast", { duration: 8000 })}>8s toast</Button></ShowcaseRow>
        </Showcase>
        <Showcase title="Rich content" hint="description">
          <ShowcaseRow><Button onClick={() => toast.success("Payment received", { description: "Invoice #INV-1042 marked as paid." })}>Show</Button></ShowcaseRow>
        </Showcase>
      </div>
    </PageContainer>
  );
}