import { useEffect, useMemo, useState } from "react";
import { Camera, Loader2, Mail, MapPin, Phone, Save } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataCard, PageContainer, PageHeader, StatusBadge, type StatusTone } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";
import { activityStore, mockUsers } from "@/data";
import { formatDate, formatRelative, getInitials, titleCase } from "@/lib/formatters";
import { severityForAction, severityTone } from "@/features/reports/shared";

const PROFILE_KEY = "account:profile";

interface ProfileForm {
  name: string;
  title: string;
  department: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  timezone: string;
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  title: z.string().trim().max(80).optional().or(z.literal("")),
  department: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email.").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  timezone: z.string().trim().max(40),
});

const TIMEZONES = [
  { value: "Europe/Lisbon", label: "Lisbon (UTC+0)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1)" },
  { value: "America/New_York", label: "New York (UTC−5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC−8)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
];

function defaultsFor(authName: string | undefined, authEmail: string | undefined): ProfileForm {
  const seed = mockUsers[0];
  return {
    name: authName ?? seed.name,
    title: seed.title ?? "Founder",
    department: seed.department ?? "Leadership",
    bio: "Designing thoughtful admin experiences at Rivera.",
    email: authEmail ?? seed.email,
    phone: "+351 910 000 000",
    location: "Lisbon, Portugal",
    timezone: "Europe/Lisbon",
  };
}

export default function ProfilePage() {
  const { trail } = useBreadcrumbs();
  const { session } = useAuth();
  const [form, setForm] = useState<ProfileForm>(() =>
    storage.get<ProfileForm>(PROFILE_KEY, defaultsFor(session?.name, session?.email)),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync once from session if storage is empty.
  useEffect(() => {
    if (!storage.get<ProfileForm | null>(PROFILE_KEY, null)) {
      setForm(defaultsFor(session?.name, session?.email));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recent = useMemo(() => {
    const usersById = new Map(mockUsers.map((u) => [u.id, u] as const));
    return activityStore
      .list()
      .slice(0, 6)
      .map((log) => ({ log, actor: usersById.get(log.actorId) }));
  }, []);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSave() {
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      const next: typeof errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ProfileForm;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      storage.set(PROFILE_KEY, result.data);
      setSaving(false);
      setDirty(false);
      toast.success("Profile saved");
    }, 500);
  }

  function handleReset() {
    const next = defaultsFor(session?.name, session?.email);
    setForm(next);
    storage.set(PROFILE_KEY, next);
    setErrors({});
    setDirty(false);
    toast("Profile reset to defaults");
  }

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Account Settings"
        title="Profile"
        description="Update your personal information, contact details, and how you appear in Rivera."
        breadcrumbs={trail.length ? trail : [{ label: "Account Settings" }, { label: "Profile" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>Reset</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !dirty} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DataCard title="Personal information" description="How you appear across Rivera">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="relative">
                <Avatar className="h-20 w-20 border border-border">
                  <AvatarFallback className="bg-gradient-primary text-lg font-semibold text-primary-foreground">
                    {getInitials(form.name || "RA")}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => toast("Avatar uploads are mocked in this demo")}
                  aria-label="Change avatar"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-fast hover:bg-muted hover:text-foreground"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1">
                <p className="font-display text-lg font-semibold text-foreground">{form.name}</p>
                <p className="text-sm text-muted-foreground">{form.title}{form.department ? ` · ${form.department}` : ""}</p>
                <div className="mt-2"><StatusBadge tone="success" dot>Active</StatusBadge></div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} aria-invalid={!!errors.name} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Senior Designer" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="e.g. Design" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={form.timezone} onValueChange={(v) => update("timezone", v)}>
                  <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="A short summary about you" />
                <p className="text-xs text-muted-foreground">{form.bio.length}/280</p>
              </div>
            </div>
          </DataCard>

          <DataCard title="Contact information" description="Where teammates can reach you">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-9" value={form.email} onChange={(e) => update("email", e.target.value)} aria-invalid={!!errors.email} />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="phone" type="tel" className="pl-9" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+351 910 000 000" />
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="location" className="pl-9" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="City, Country" />
                </div>
              </div>
            </div>
          </DataCard>
        </div>

        <DataCard title="Recent activity" description="Latest events from this workspace" className="lg:col-span-1">
          <ol className="space-y-4">
            {recent.map(({ log, actor }) => {
              const sev = severityForAction(log.action);
              const tone: StatusTone = severityTone[sev];
              return (
                <li key={log.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0 border border-border">
                    <AvatarFallback className="bg-primary-soft text-[11px] text-primary">
                      {getInitials(actor?.name ?? "·")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{actor?.name ?? "Unknown"}</span>
                      <StatusBadge tone={tone} dot>{titleCase(log.action)}</StatusBadge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{log.summary}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {formatRelative(log.createdAt)} · {formatDate(log.createdAt, "short")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </DataCard>
      </div>
    </PageContainer>
  );
}