import { useState } from "react";
import { toast } from "sonner";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

const KEY = "blogs:settings";

type Settings = {
  blogTitle: string;
  tagline: string;
  baseUrl: string;
  postsPerPage: number;
  allowComments: boolean;
  moderateComments: boolean;
  enableRSS: boolean;
  showAuthors: boolean;
  metaDescription: string;
};

const defaults: Settings = {
  blogTitle: "Rivera Blog",
  tagline: "Stories, ideas, and engineering notes from the team.",
  baseUrl: "https://rivera.app/blog",
  postsPerPage: 12,
  allowComments: true,
  moderateComments: true,
  enableRSS: true,
  showAuthors: true,
  metaDescription: "Insights and updates from Rivera.",
};

function load(): Settings {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return defaults; }
}

export default function BlogSettings() {
  const { trail } = useBreadcrumbs();
  const [s, setS] = useState<Settings>(load);
  const save = () => { localStorage.setItem(KEY, JSON.stringify(s)); toast.success("Settings saved"); };
  const reset = () => { setS(defaults); localStorage.removeItem(KEY); toast.success("Reset to defaults"); };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Blogs"
        title="Blog settings"
        description="Site identity, layout, and engagement options."
        breadcrumbs={trail.length ? trail : [{ label: "Blogs" }, { label: "Settings" }]}
        actions={<div className="flex gap-2"><Button variant="outline" onClick={reset}>Reset</Button><Button onClick={save}>Save changes</Button></div>}
      />

      <DataCard title="Identity" description="What readers see at the top">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Blog title</Label><Input value={s.blogTitle} onChange={(e) => setS({ ...s, blogTitle: e.target.value })} /></div>
          <div><Label>Base URL</Label><Input value={s.baseUrl} onChange={(e) => setS({ ...s, baseUrl: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Tagline</Label><Input value={s.tagline} onChange={(e) => setS({ ...s, tagline: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Meta description</Label><Textarea value={s.metaDescription} onChange={(e) => setS({ ...s, metaDescription: e.target.value })} /></div>
        </div>
      </DataCard>

      <DataCard title="Reading" description="Layout and engagement">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Posts per page</Label><Input type="number" value={s.postsPerPage} onChange={(e) => setS({ ...s, postsPerPage: Number(e.target.value) || 0 })} /></div>
          </div>
          <Separator />
          <Toggle label="Allow comments" hint="Let readers leave comments on posts." checked={s.allowComments} onChange={(v) => setS({ ...s, allowComments: v })} />
          <Separator />
          <Toggle label="Moderate comments" hint="Hold new comments for review." checked={s.moderateComments} onChange={(v) => setS({ ...s, moderateComments: v })} />
          <Separator />
          <Toggle label="Enable RSS feed" hint="Publish an RSS feed of recent posts." checked={s.enableRSS} onChange={(v) => setS({ ...s, enableRSS: v })} />
          <Separator />
          <Toggle label="Show author bios" hint="Render an author section on each post." checked={s.showAuthors} onChange={(v) => setS({ ...s, showAuthors: v })} />
        </div>
      </DataCard>
    </PageContainer>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{hint}</p></div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}