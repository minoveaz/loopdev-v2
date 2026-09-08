import { useState } from "react";
import { Loader2, Monitor, Moon, Save, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useTheme } from "@/hooks/use-theme";
import { storage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";
import type { NotificationType } from "@/types";
import { useI18n } from "@/i18n";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelative,
  getFormatterLocale,
} from "@/lib/formatters";

const SETTINGS_KEY = "account:settings";

type Density = "comfortable" | "compact";

interface SettingsState {
  workspaceName: string;
  defaultLanding: "/" | "/dashboard/analytics" | "/dashboard/crm" | "/dashboard/ecommerce";
  density: Density;
  reducedMotion: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
}

const DEFAULTS: SettingsState = {
  workspaceName: "Rivera Studio",
  defaultLanding: "/",
  density: "comfortable",
  reducedMotion: false,
  language: "en-US",
  timezone: "Europe/Lisbon",
  dateFormat: "medium",
};

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "pt-PT", label: "Português (PT)" },
  { value: "fr-FR", label: "Français" },
  { value: "de-DE", label: "Deutsch" },
  { value: "es-ES", label: "Español" },
  { value: "ja-JP", label: "日本語" },
];

const TIMEZONES = [
  { value: "Europe/Lisbon", label: "Lisbon (UTC+0)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1)" },
  { value: "America/New_York", label: "New York (UTC−5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC−8)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
];

export default function SettingsPage() {
  const { trail } = useBreadcrumbs();
  const { theme, setTheme } = useTheme();
  const [state, setState] = useState<SettingsState>(() => ({
    ...DEFAULTS,
    ...storage.get<Partial<SettingsState>>(SETTINGS_KEY, DEFAULTS),
  }));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const { prefs: notifPrefs, setChannel, setType } = useNotificationPrefs();

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setDirty(true);
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      storage.set(SETTINGS_KEY, state);
      setSaving(false);
      setDirty(false);
      toast.success("Settings saved");
      import("@/lib/activity").then(({ logActivity }) =>
        logActivity({ action: "updated", entity: "settings", entityId: "account", summary: "Saved account settings" }),
      );
    }, 500);
  }

  function handleReset() {
    setState(DEFAULTS);
    storage.set(SETTINGS_KEY, DEFAULTS);
    setDirty(false);
    toast("Settings reset to defaults");
  }

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Account Settings"
        title="Settings"
        description="Manage workspace preferences, appearance, language, and notifications."
        breadcrumbs={trail.length ? trail : [{ label: "Account Settings" }, { label: "Settings" }]}
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

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1 bg-card-muted p-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="locale">Language & region</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <DataCard title="Workspace" description="Basic workspace information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ws-name">Workspace name</Label>
                <Input id="ws-name" value={state.workspaceName} onChange={(e) => update("workspaceName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landing">Default landing page</Label>
                <Select value={state.defaultLanding} onValueChange={(v) => update("defaultLanding", v as SettingsState["defaultLanding"])}>
                  <SelectTrigger id="landing"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/">Overview</SelectItem>
                    <SelectItem value="/dashboard/analytics">Analytics</SelectItem>
                    <SelectItem value="/dashboard/crm">CRM</SelectItem>
                    <SelectItem value="/dashboard/ecommerce">Ecommerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DataCard>

          <DataCard title="Density" description="Choose how compact dashboards and tables feel">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(["comfortable", "compact"] as Density[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => update("density", d)}
                  aria-pressed={state.density === d}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-fast",
                    state.density === d
                      ? "border-primary/60 bg-primary-soft shadow-soft"
                      : "border-border bg-card hover:border-border-strong",
                  )}
                >
                  <p className="font-display text-base font-semibold capitalize text-foreground">{d}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d === "comfortable"
                      ? "Generous spacing for readability."
                      : "Tighter rows to fit more on screen."}
                  </p>
                  <div className="mt-3 space-y-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-md bg-card-muted",
                          d === "comfortable" ? "h-3" : "h-2",
                        )}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <DataCard title="Theme" description="Light, dark, or follow your system preference — applies instantly">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(
                [
                  { value: "light", label: "Light", icon: Sun, disabled: false },
                  { value: "dark", label: "Dark", icon: Moon, disabled: false },
                  { value: "system", label: "System", icon: Monitor, disabled: false },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const active = !opt.disabled && theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      if (opt.disabled) return;
                      setTheme(opt.value);
                      toast(`Theme set to ${opt.label.toLowerCase()}`);
                    }}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 text-left transition-fast",
                      active
                        ? "border-primary/60 bg-primary-soft shadow-soft"
                        : "border-border bg-card hover:border-border-strong",
                      opt.disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-card-muted text-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {opt.value === "system" ? "Match your OS preference" : `Use the ${opt.label.toLowerCase()} palette`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </DataCard>

          <DataCard title="Motion" description="Reduce non-essential animations">
            <label className="flex items-center justify-between gap-4 surface-card-muted-compact p-4">
              <div>
                <p className="font-medium text-foreground">Reduce motion</p>
                <p className="text-xs text-muted-foreground">Minimize transitions and parallax effects.</p>
              </div>
              <Switch checked={state.reducedMotion} onCheckedChange={(v) => update("reducedMotion", v)} />
            </label>
          </DataCard>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <DataCard
            title="Channels"
            description="Choose how Rivera reaches you. Changes apply instantly to the in-app feed."
          >
            <div className="space-y-3">
              <ToggleRow
                label="In-app feed"
                description="Show alerts in the bell menu and notification feed."
                checked={notifPrefs.channels.inApp}
                onChange={(v) => setChannel("inApp", v)}
              />
              <ToggleRow
                label="Email"
                description="Send important updates to your inbox."
                checked={notifPrefs.channels.email}
                onChange={(v) => setChannel("email", v)}
              />
              <ToggleRow
                label="Push"
                description="Deliver real-time push notifications on supported devices."
                checked={notifPrefs.channels.push}
                onChange={(v) => setChannel("push", v)}
              />
              <ToggleRow
                label="Notification sounds"
                description="Play a soft chime when new alerts arrive."
                checked={notifPrefs.channels.sound}
                onChange={(v) => setChannel("sound", v)}
              />
            </div>
          </DataCard>

          <DataCard
            title="Types"
            description="Filter the in-app feed by category. Muted types are hidden but never deleted."
          >
            <div className="space-y-3">
              {(
                [
                  { type: "info", label: "Informational", desc: "General product updates and FYIs." },
                  { type: "success", label: "Success", desc: "Completed jobs, deploys, and milestones." },
                  { type: "warning", label: "Warnings", desc: "Quotas, expirations, and pending invites." },
                  { type: "error", label: "Errors", desc: "Failed payments, sync issues, and blockers." },
                ] as { type: NotificationType; label: string; desc: string }[]
              ).map((row) => (
                <ToggleRow
                  key={row.type}
                  label={row.label}
                  description={row.desc}
                  checked={notifPrefs.types[row.type]}
                  onChange={(v) => setType(row.type, v)}
                />
              ))}
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="locale" className="space-y-6">
          <DataCard title="Language & region" description="Display preferences for dates, numbers, and copy">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lang">Language</Label>
                <Select value={state.language} onValueChange={(v) => update("language", v)}>
                  <SelectTrigger id="lang"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tz">Timezone</Label>
                <Select value={state.timezone} onValueChange={(v) => update("timezone", v)}>
                  <SelectTrigger id="tz"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="datefmt">Date format</Label>
                <Select value={state.dateFormat} onValueChange={(v) => update("dateFormat", v)}>
                  <SelectTrigger id="datefmt"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short — 5/4/26</SelectItem>
                    <SelectItem value="medium">Medium — May 4, 2026</SelectItem>
                    <SelectItem value="long">Long — May 4th, 2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DataCard>
          <LocalePreviewCard />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function LocalePreviewCard() {
  const { lang, dir, locale, languages } = useI18n();
  const langLabel = languages.find((l) => l.code === lang)?.label ?? lang;
  const sampleDate = new Date();
  const samplePast = new Date(Date.now() - 1000 * 60 * 60 * 26);
  const items: { label: string; value: string }[] = [
    { label: "Short date", value: formatDate(sampleDate, "short") },
    { label: "Medium date", value: formatDate(sampleDate, "medium") },
    { label: "Long date", value: formatDate(sampleDate, "long") },
    { label: "Date & time", value: formatDate(sampleDate, "datetime") },
    { label: "Relative time", value: formatRelative(samplePast) },
    { label: "Number", value: formatNumber(1234567.89) },
    { label: "Compact number", value: formatNumber(1234567, { compact: true }) },
    { label: "Currency (USD)", value: formatCurrency(2499.5, "USD") },
    { label: "Currency (EUR)", value: formatCurrency(2499.5, "EUR") },
    { label: "Percent", value: formatPercent(0.1234) },
  ];
  return (
    <DataCard
      title="Locale preview"
      description="Sample formatted values using the active language and direction"
      eyebrow={`${langLabel} · ${getFormatterLocale()} · ${dir.toUpperCase()}`}
    >
      <div dir={dir} className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card-muted px-3 py-2"
            >
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {item.label}
              </span>
              <span className="font-mono text-sm tabular-nums text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            Layout sample
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
              1
            </span>
            <p className="flex-1 text-sm text-foreground">
              {dir === "rtl"
                ? "هذا نص تجريبي لاختبار الاتجاه من اليمين إلى اليسار."
                : "This sample text demonstrates the current text direction."}
            </p>
            <span className="rounded-md bg-accent-soft px-2 py-1 text-xs font-medium text-accent">
              {dir.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </DataCard>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 surface-card-muted-compact p-4">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}