import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export default function StarterPage() {
  const { trail } = useBreadcrumbs();
  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Pages"
        title="Starter page"
        description="A clean blank canvas — copy this layout to begin a new module."
        breadcrumbs={trail.length ? trail : [{ label: "Pages" }, { label: "Starter" }]}
      />
      <DataCard className="bg-gradient-primary text-primary-foreground">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            <div>
              <p className="font-display text-lg font-semibold">Begin building</p>
              <p className="text-sm opacity-90">PageHeader + DataCard + your content.</p>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link to="/helpdesk/documentation">Read the docs <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </DataCard>
      <DataCard title="Your content goes here" description="Replace this card with your own components">
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Drop your sections, tables, and forms here.
        </div>
      </DataCard>
    </PageContainer>
  );
}