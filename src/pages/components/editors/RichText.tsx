import { useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Link2, Image as ImgIcon, Code } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/features/ui-kit/Showcase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const tools = [Bold, Italic, Underline, List, ListOrdered, Quote, Link2, ImgIcon, Code];

export default function RichTextPage() {
  const [v, setV] = useState("Welcome to the Rivera editor mock.\n\nUse the toolbar above to format your content.");
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Rich Text Editor" description="Mock editor toolbar over a textarea — no real formatting." />
      <Showcase title="Editor" hint="mock">
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2">
            {tools.map((Icon, i) => (
              <Button key={i} size="icon" variant="ghost" className="h-8 w-8"><Icon className="h-4 w-4" /></Button>
            ))}
          </div>
          <Textarea value={v} onChange={(e) => setV(e.target.value)} className="min-h-[260px] rounded-none border-0 focus-visible:ring-0" />
        </div>
      </Showcase>
    </PageContainer>
  );
}