import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { storage } from "@/lib/storage";

interface ProjectSettings {
  workspaceName: string;
  description: string;
  defaultCurrency: "USD" | "EUR" | "GBP";
  defaultPriority: "low" | "medium" | "high" | "urgent";
  weeklyCapacity: number;
  emailNotifications: boolean;
  allowGuestComments: boolean;
  autoArchiveCompleted: boolean;
}

const KEY = "settings:projects";
const DEFAULTS: ProjectSettings = {
  workspaceName: "Rivera Studio",
  description: "Design and engineering studio building modern brands.",
  defaultCurrency: "USD",
  defaultPriority: "medium",
  weeklyCapacity: 40,
  emailNotifications: true,
  allowGuestComments: false,
  autoArchiveCompleted: true,
};

export default function ProjectSettings() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const [s, setS] = useState<ProjectSettings>(DEFAULTS);

  useEffect(() => {
    setS(storage.get<ProjectSettings>(KEY, DEFAULTS));
  }, []);

  const set = <K extends keyof ProjectSettings>(k: K, v: ProjectSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const save = () => {
    storage.set(KEY, s);
    toast({ title: "Settings saved" });
  };

  const reset = () => {
    setS(DEFAULTS);
    storage.set(KEY, DEFAULTS);
    toast({ title: "Settings reset" });
  };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Projects"
        title="Project settings"
        description="Workspace defaults for new projects and tasks."
        breadcrumbs={trail}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>Reset</Button>
            <Button onClick={save} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save</Button>
          </div>
        }
      />

      <DataCard title="Workspace">
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Workspace name</Label>
            <Input value={s.workspaceName} onChange={(e) => set("workspaceName", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={s.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
      </DataCard>

      <DataCard title="Defaults">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Default currency</Label>
            <Select value={s.defaultCurrency} onValueChange={(v) => set("defaultCurrency", v as ProjectSettings["defaultCurrency"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Default priority</Label>
            <Select value={s.defaultPriority} onValueChange={(v) => set("defaultPriority", v as ProjectSettings["defaultPriority"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Weekly capacity (h)</Label>
            <Input type="number" min={1} max={80} value={s.weeklyCapacity} onChange={(e) => set("weeklyCapacity", Number(e.target.value))} />
          </div>
        </div>
      </DataCard>

      <DataCard title="Preferences">
        <div className="space-y-3">
          {[
            { k: "emailNotifications" as const,   label: "Email notifications",  hint: "Send weekly digests to project members." },
            { k: "allowGuestComments" as const,   label: "Allow guest comments", hint: "Clients can comment without an account." },
            { k: "autoArchiveCompleted" as const, label: "Auto-archive done",    hint: "Move completed projects to archive after 30 days." },
          ].map(({ k, label, hint }) => (
            <div key={k} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <Label htmlFor={k} className="cursor-pointer">{label}</Label>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <Switch id={k} checked={s[k]} onCheckedChange={(v) => set(k, v)} />
            </div>
          ))}
        </div>
      </DataCard>
    </PageContainer>
  );
}