import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer, PageHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Showcase, ShowcaseRow } from "@/features/ui-kit/Showcase";

export default function FormsPage() {
  const { trail } = useBreadcrumbs();
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="UI Kit"
        title="Forms"
        description="Inputs, selects, switches, and form controls — all theme-aware."
        breadcrumbs={trail.length ? trail : [{ label: "UI Kit" }, { label: "Forms" }]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Showcase title="Text inputs" hint="input">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@rivera.app" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <div className="relative">
                <Input id="pw" type={showPw ? "text" : "password"} placeholder="••••••••" />
                <button
                  type="button"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Use 12+ characters with a mix of letters and numbers.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="search" placeholder="Search projects, users, or invoices…" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="disabled">Disabled</Label>
              <Input id="disabled" defaultValue="Locked value" disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="error">With error</Label>
              <Input id="error" defaultValue="invalid@" aria-invalid className="border-destructive focus-visible:ring-destructive/30" />
              <p className="text-xs text-destructive">Please enter a valid email address.</p>
            </div>
          </div>
        </Showcase>

        <Showcase title="Select & textarea" hint="select">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select>
                <SelectTrigger id="role"><SelectValue placeholder="Choose a role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={4} placeholder="A short summary about you…" />
            </div>
            <div className="space-y-1.5">
              <Label>Budget</Label>
              <Slider defaultValue={[42]} max={100} step={1} />
            </div>
          </div>
        </Showcase>

        <Showcase title="Choice controls" hint="boolean">
          <ShowcaseRow label="Checkbox">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox defaultChecked /> Email notifications
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox /> Marketing updates
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox disabled /> Disabled
            </label>
          </ShowcaseRow>
          <ShowcaseRow label="Switch">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch defaultChecked /> Two-factor auth
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch /> Public profile
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch disabled /> Disabled
            </label>
          </ShowcaseRow>
          <ShowcaseRow label="Radio">
            <RadioGroup defaultValue="weekly" className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="daily" /> Daily
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="weekly" /> Weekly
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="monthly" /> Monthly
              </label>
            </RadioGroup>
          </ShowcaseRow>
        </Showcase>

        <Showcase title="Form layout" description="Two-column responsive form" hint="layout">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitting(true);
              setTimeout(() => setSubmitting(false), 1200);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="first">First name</Label>
                <Input id="first" placeholder="Amelia" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last">Last name</Label>
                <Input id="last" placeholder="Hart" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Rivera Studio" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={3} placeholder="How can we help?" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline">Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </form>
        </Showcase>
      </div>
    </PageContainer>
  );
}