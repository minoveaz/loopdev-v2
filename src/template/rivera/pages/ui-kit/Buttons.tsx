import { useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  Loader2,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Showcase, ShowcaseRow, Token } from "@/template/rivera/features/ui-kit/Showcase";

export default function ButtonsPage() {
  const { trail } = useBreadcrumbs();
  const [loading, setLoading] = useState(false);

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="UI Kit"
        title="Buttons"
        description="Primary action elements built on shadcn/ui with Rivera tokens."
        breadcrumbs={trail.length ? trail : [{ label: "UI Kit" }, { label: "Buttons" }]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Showcase title="Variants" hint="variant">
          <ShowcaseRow label="Default">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </ShowcaseRow>
          <p className="text-xs text-muted-foreground">
            Use <Token>variant="default"</Token> for the primary call to action and
            <Token>destructive</Token> for irreversible actions.
          </p>
        </Showcase>

        <Showcase title="Sizes" hint="size">
          <ShowcaseRow label="Heights">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Settings">
              <Settings />
            </Button>
          </ShowcaseRow>
        </Showcase>

        <Showcase title="With icons" hint="icon">
          <ShowcaseRow label="Leading">
            <Button>
              <Plus /> New project
            </Button>
            <Button variant="outline">
              <Download /> Export
            </Button>
            <Button variant="destructive">
              <Trash2 /> Delete
            </Button>
          </ShowcaseRow>
          <ShowcaseRow label="Trailing">
            <Button variant="secondary">
              Continue <ArrowRight />
            </Button>
            <Button variant="ghost">
              Mark complete <Check />
            </Button>
          </ShowcaseRow>
        </Showcase>

        <Showcase title="States" hint="state">
          <ShowcaseRow label="Disabled">
            <Button disabled>Submit</Button>
            <Button variant="outline" disabled>Cancel</Button>
            <Button variant="destructive" disabled>Delete</Button>
          </ShowcaseRow>
          <ShowcaseRow label="Loading">
            <Button disabled={loading} onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1400);
            }}>
              {loading ? <Loader2 className="animate-spin" /> : <Check />}
              {loading ? "Saving…" : "Save changes"}
            </Button>
            <Button variant="outline" disabled>
              <Loader2 className="animate-spin" />
              Loading
            </Button>
          </ShowcaseRow>
        </Showcase>

        <Showcase title="Button groups" hint="group" className="lg:col-span-2">
          <ShowcaseRow label="Segmented">
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              <Button variant="ghost" size="sm" className="rounded-md">Day</Button>
              <Button variant="secondary" size="sm" className="rounded-md">Week</Button>
              <Button variant="ghost" size="sm" className="rounded-md">Month</Button>
              <Button variant="ghost" size="sm" className="rounded-md">Year</Button>
            </div>
          </ShowcaseRow>
          <ShowcaseRow label="Split">
            <div className="inline-flex">
              <Button className="rounded-r-none">Publish</Button>
              <Button variant="outline" size="icon" className="rounded-l-none border-l-0" aria-label="More options">
                <Settings />
              </Button>
            </div>
          </ShowcaseRow>
        </Showcase>
      </div>
    </PageContainer>
  );
}