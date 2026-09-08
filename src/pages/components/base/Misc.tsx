import { PageContainer, PageHeader } from "@/components/common";
import { Showcase, ShowcaseRow } from "@/features/ui-kit/Showcase";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export default function MiscPage() {
  return (
    <PageContainer width="default">
      <PageHeader eyebrow="Components" title="Miscellaneous" description="Badges, separators, skeletons, tooltips, progress." />
      <div className="grid gap-6 md:grid-cols-2">
        <Showcase title="Badges" hint="badge">
          <ShowcaseRow>
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </ShowcaseRow>
        </Showcase>
        <Showcase title="Skeleton" hint="loading">
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </Showcase>
        <Showcase title="Separator" hint="divider">
          <div className="space-y-3">
            <p className="text-sm">Above</p>
            <Separator />
            <p className="text-sm">Below</p>
          </div>
        </Showcase>
        <Showcase title="Progress" hint="progress">
          <Progress value={62} />
        </Showcase>
        <Showcase title="Tooltip" hint="tooltip">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="outline">Hover me</Button></TooltipTrigger>
              <TooltipContent>Helpful tip</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Showcase>
      </div>
    </PageContainer>
  );
}