import { useState } from "react";
import { toast } from "sonner";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

const KEY = "academy:settings";

type Settings = {
  academyName: string;
  supportEmail: string;
  defaultCurrency: "USD" | "EUR" | "GBP";
  defaultLanguage: "English" | "Spanish" | "French" | "German";
  certificatesEnabled: boolean;
  autoEnroll: boolean;
  emailNotifications: boolean;
  reviewModeration: boolean;
  passingScore: number;
  certificateFooter: string;
};

const defaults: Settings = {
  academyName: "Rivera Academy",
  supportEmail: "academy@rivera.app",
  defaultCurrency: "USD",
  defaultLanguage: "English",
  certificatesEnabled: true,
  autoEnroll: false,
  emailNotifications: true,
  reviewModeration: true,
  passingScore: 70,
  certificateFooter: "Issued by Rivera Academy. Verified achievement of course requirements.",
};

function load(): Settings {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return defaults; }
}

export default function AcademySettings() {
  const { trail } = useBreadcrumbs();
  const [s, setS] = useState<Settings>(load);
  const save = () => { localStorage.setItem(KEY, JSON.stringify(s)); toast.success("Settings saved"); };
  const reset = () => { setS(defaults); localStorage.removeItem(KEY); toast.success("Reset to defaults"); };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Academy"
        title="Settings"
        description="Branding, learning defaults, and notification preferences."
        breadcrumbs={trail.length ? trail : [{ label: "Academy" }, { label: "Settings" }]}
        actions={<div className="flex gap-2"><Button variant="outline" onClick={reset}>Reset</Button><Button onClick={save}>Save changes</Button></div>}
      />

      <DataCard title="Branding" description="Public-facing details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Academy name</Label><Input value={s.academyName} onChange={(e) => setS({ ...s, academyName: e.target.value })} /></div>
          <div><Label>Support email</Label><Input type="email" value={s.supportEmail} onChange={(e) => setS({ ...s, supportEmail: e.target.value })} /></div>
        </div>
      </DataCard>

      <DataCard title="Defaults" description="Currency, language, and grading">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Currency</Label>
            <Select value={s.defaultCurrency} onValueChange={(v) => setS({ ...s, defaultCurrency: v as Settings["defaultCurrency"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Language</Label>
            <Select value={s.defaultLanguage} onValueChange={(v) => setS({ ...s, defaultLanguage: v as Settings["defaultLanguage"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="German">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Passing score (%)</Label><Input type="number" value={s.passingScore} onChange={(e) => setS({ ...s, passingScore: Number(e.target.value) || 0 })} /></div>
        </div>
      </DataCard>

      <DataCard title="Operations" description="Enrollment, reviews, certificates">
        <div className="space-y-4">
          <Toggle label="Auto-enroll on signup" hint="Add new users to a starter course." checked={s.autoEnroll} onChange={(v) => setS({ ...s, autoEnroll: v })} />
          <Separator />
          <Toggle label="Issue certificates" hint="Grant a downloadable certificate on completion." checked={s.certificatesEnabled} onChange={(v) => setS({ ...s, certificatesEnabled: v })} />
          <Separator />
          <Toggle label="Moderate reviews" hint="Hold reviews for review before publishing." checked={s.reviewModeration} onChange={(v) => setS({ ...s, reviewModeration: v })} />
          <Separator />
          <Toggle label="Email notifications" hint="Send transactional emails to learners." checked={s.emailNotifications} onChange={(v) => setS({ ...s, emailNotifications: v })} />
          <Separator />
          <div><Label>Certificate footer</Label><Textarea value={s.certificateFooter} onChange={(e) => setS({ ...s, certificateFooter: e.target.value })} /></div>
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