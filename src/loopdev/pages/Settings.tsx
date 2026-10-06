import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, CircleAlert, MailPlus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useTenantContext } from "@/hooks/use-tenant-context";
import {
  settingsAdapter,
  SettingsAdapterError,
  type OrganizationSettings,
  type SettingsSnapshot,
  type SettingsUser,
  type SettingsUserStatus,
} from "@/loopdev/domains/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader, SurfaceCard, SurfaceCardBody, SurfaceCardHeader, StatusBadge } from "@/components/common";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

const statusTone: Record<SettingsUserStatus, "success" | "warning" | "destructive"> = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
};

const TIMEZONE_OPTIONS = [
  { value: "Europe/Madrid", label: "settings.organization.timezones.madrid" },
  { value: "Europe/London", label: "settings.organization.timezones.london" },
  { value: "Europe/Paris", label: "settings.organization.timezones.paris" },
  { value: "America/New_York", label: "settings.organization.timezones.newYork" },
  { value: "America/Los_Angeles", label: "settings.organization.timezones.losAngeles" },
  { value: "America/Mexico_City", label: "settings.organization.timezones.mexicoCity" },
  { value: "UTC", label: "settings.organization.timezones.utc" },
] as const;

export default function Settings() {
  const { t, setLang } = useI18n();
  const { trail } = useBreadcrumbs();
  const { activeOrganization } = useTenantContext();
  const organizationId = activeOrganization?.id ?? null;
  const [snapshot, setSnapshot] = useState<SettingsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SettingsAdapterError | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activationUrl, setActivationUrl] = useState<string | null>(null);
  const [form, setForm] = useState<OrganizationSettings | null>(null);
  const [invite, setInvite] = useState({ name: "", email: "", role: "viewer" as "viewer" | "agent" | "admin" });
  const [removingUser, setRemovingUser] = useState<SettingsUser | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    if (!organizationId) {
      setLoading(false);
      return;
    }
    void settingsAdapter.getSnapshot(organizationId)
      .then((next) => {
        setSnapshot(next);
        setForm(next.organization);
        setLang(next.organization.locale);
      })
      .catch((cause: unknown) => setError(cause instanceof SettingsAdapterError ? cause : new SettingsAdapterError(t("settings.errors.load"), "invalid")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canManage = useMemo(() => Boolean(organizationId), [organizationId]);

  if (!canManage || error?.code === "forbidden") {
    return (
      <PageContainer width="narrow">
        <PageHeader title={t("settings.title")} description={t("settings.description")} breadcrumbs={trail.length ? trail : [{ label: t("settings.title") }]} />
        <SurfaceCard>
          <SurfaceCardBody className="space-y-3 py-10 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("settings.forbidden.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("settings.forbidden.description")}</p>
          </SurfaceCardBody>
        </SurfaceCard>
      </PageContainer>
    );
  }

  if (loading) {
    return <PageContainer width="wide"><PageHeader title={t("settings.title")} description={t("settings.description")} /><div role="status" className="rounded-lg border border-border p-8 text-sm text-muted-foreground">{t("common.loading")}</div></PageContainer>;
  }

  if (error || !snapshot || !form) {
    return (
      <PageContainer width="narrow">
        <PageHeader title={t("settings.title")} description={t("settings.description")} />
        <SurfaceCard>
          <SurfaceCardBody className="space-y-4 py-10 text-center">
            <CircleAlert className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="text-lg font-semibold">{t("settings.errors.title")}</h2>
            <p role="alert" className="text-sm text-muted-foreground">{error?.message ?? t("settings.errors.load")}</p>
            <Button variant="outline" onClick={load}><RefreshCw className="me-2 h-4 w-4" />{t("common.retry")}</Button>
          </SurfaceCardBody>
        </SurfaceCard>
      </PageContainer>
    );
  }

  const saveOrganization = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const organization = await settingsAdapter.updateOrganization(organizationId, form);
      setSnapshot((current) => current ? { ...current, organization } : current);
      setForm(organization);
      setLang(organization.locale);
      setNotice(t("settings.organization.saved"));
    } catch (cause) {
      setError(cause instanceof SettingsAdapterError ? cause : new SettingsAdapterError(t("settings.errors.save"), "invalid"));
    } finally {
      setSaving(false);
    }
  };

  const sendInvite = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const user = await settingsAdapter.inviteUser(organizationId, invite);
      setActivationUrl(user.activationUrl ?? null);
      setSnapshot((current) => current ? { ...current, users: [...current.users, user] } : current);
      setInvite({ name: "", email: "", role: "viewer" });
      setNotice(t("settings.users.invited"));
    } catch (cause) {
      setError(cause instanceof SettingsAdapterError ? cause : new SettingsAdapterError(t("settings.errors.save"), "invalid"));
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (user: SettingsUser, patch: Partial<Pick<SettingsUser, "role" | "status">>) => {
    try {
      const updated = "role" in patch
        ? await settingsAdapter.updateUserRole(organizationId, user.id, patch.role ?? user.role)
        : await settingsAdapter.updateUserStatus(organizationId, user.id, patch.status ?? user.status);
      setSnapshot((current) => current ? { ...current, users: current.users.map((item) => item.id === user.id ? updated : item) } : current);
      setNotice(t("settings.users.updated"));
    } catch (cause) {
      setError(cause instanceof SettingsAdapterError ? cause : new SettingsAdapterError(t("settings.errors.save"), "invalid"));
    }
  };

  const removeUser = async () => {
    if (!removingUser) return;
    setSaving(true);
    try {
      await settingsAdapter.removeUser(organizationId!, removingUser.id);
      setSnapshot((current) => current ? { ...current, users: current.users.filter((item) => item.id !== removingUser.id) } : current);
      setRemovingUser(null);
      setNotice(t("settings.users.removed"));
    } catch (cause) {
      setError(cause instanceof SettingsAdapterError ? cause : new SettingsAdapterError(t("settings.errors.save"), "invalid"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer width="wide">
      <PageHeader title={t("settings.title")} description={t("settings.description")} breadcrumbs={trail.length ? trail : [{ label: t("settings.title") }]} />
      <div className="space-y-6">
        {notice && <div role="status" className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{notice}</div>{activationUrl && <div className="flex gap-2"><Input readOnly value={activationUrl} aria-label={t("settings.users.activationUrl")} /><Button variant="outline" onClick={() => void navigator.clipboard.writeText(activationUrl)}>{t("common.copy")}</Button></div>}</div>}
        {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"><span>{error.message}</span><Button size="sm" variant="ghost" onClick={() => setError(null)}>{t("common.close")}</Button></div>}
        <Tabs defaultValue="organization" className="w-full">
          <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1 bg-card-muted p-1">
            <TabsTrigger value="organization">{t("settings.tabs.organization")}</TabsTrigger>
            <TabsTrigger value="users">{t("settings.tabs.users")}</TabsTrigger>
          </TabsList>
          <TabsContent value="organization" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <SurfaceCard>
                <SurfaceCardHeader title={t("settings.organization.title")} description={t("settings.organization.description")} icon={Building2} />
                <SurfaceCardBody className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="organization-name">{t("settings.organization.name")}</Label><Input id="organization-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="organization-slug">{t("settings.organization.slug")}</Label><Input id="organization-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="organization-timezone">{t("settings.organization.timezone")}</Label><Select value={form.timezone} onValueChange={(timezone) => setForm({ ...form, timezone })}><SelectTrigger id="organization-timezone"><SelectValue /></SelectTrigger><SelectContent>{TIMEZONE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{t(option.label)}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label htmlFor="organization-locale">{t("settings.organization.locale")}</Label><Select value={form.locale} onValueChange={(locale: "en" | "es") => setForm({ ...form, locale })}><SelectTrigger id="organization-locale"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">{t("settings.organization.english")}</SelectItem><SelectItem value="es">{t("settings.organization.spanish")}</SelectItem></SelectContent></Select></div>
                  </div>
                  <Button onClick={saveOrganization} disabled={saving}>{t("common.save")}</Button>
                </SurfaceCardBody>
              </SurfaceCard>
              <SurfaceCard>
                <SurfaceCardHeader title={t("settings.overview.title")} description={t("settings.overview.description")} icon={ShieldCheck} />
                <SurfaceCardBody className="space-y-3 text-sm">
                  <div className="flex items-center justify-between"><span>{t("settings.overview.organizationId")}</span><code className="rounded bg-muted px-2 py-1 text-xs">{organizationId}</code></div>
                  <div className="flex items-center justify-between"><span>{t("settings.overview.members")}</span><strong>{snapshot.users.length}</strong></div>
                  <Link className="text-primary underline-offset-4 hover:underline" to="/app/settings">{t("settings.overview.singleEntry")}</Link>
                </SurfaceCardBody>
              </SurfaceCard>
            </div>
          </TabsContent>
          <TabsContent value="users" className="space-y-6">
            <SurfaceCard>
              <SurfaceCardHeader title={t("settings.users.title")} description={t("settings.users.description")} icon={Users} />
              <SurfaceCardBody className="space-y-5">
                <div className="grid gap-3 rounded-lg border border-dashed border-border p-4 md:grid-cols-[1fr_1fr_auto_auto]">
                  <Input aria-label={t("settings.users.name")} placeholder={t("settings.users.name")} value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} />
                  <Input aria-label={t("settings.users.email")} type="email" placeholder={t("settings.users.email")} value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} />
                  <Select value={invite.role} onValueChange={(role: "viewer" | "agent" | "admin") => setInvite({ ...invite, role })}><SelectTrigger aria-label={t("settings.users.role")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="viewer">{t("settings.roles.viewer")}</SelectItem><SelectItem value="agent">{t("settings.roles.agent")}</SelectItem><SelectItem value="admin">{t("settings.roles.admin")}</SelectItem></SelectContent></Select>
                  <Button onClick={sendInvite} disabled={saving || !invite.name || !invite.email}><MailPlus className="me-2 h-4 w-4" />{t("settings.users.invite")}</Button>
                </div>
                {snapshot.users.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{t("settings.users.empty")}</p> : <div className="divide-y divide-border rounded-lg border border-border">{snapshot.users.map((user) => <div key={user.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p className="font-medium">{user.name}</p><p className="text-sm text-muted-foreground">{user.email}</p></div><div className="flex items-center gap-2"><StatusBadge tone={statusTone[user.status]}>{t(`settings.status.${user.status}`)}</StatusBadge><Select value={user.role} onValueChange={(role: SettingsUser["role"]) => void updateUser(user, { role })}><SelectTrigger className="w-32" aria-label={`${t("settings.users.role")} ${user.email}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">{t("settings.roles.owner")}</SelectItem><SelectItem value="admin">{t("settings.roles.admin")}</SelectItem><SelectItem value="agent">{t("settings.roles.agent")}</SelectItem><SelectItem value="viewer">{t("settings.roles.viewer")}</SelectItem></SelectContent></Select></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={user.role === "owner"} onClick={() => void updateUser(user, { status: user.status === "suspended" ? "active" : "suspended" })}>{user.status === "suspended" ? t("settings.users.activate") : t("settings.users.suspend")}</Button><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={user.role === "owner"} onClick={() => setRemovingUser(user)}>{t("settings.users.remove")}</Button></div></div>)}</div>}
              </SurfaceCardBody>
            </SurfaceCard>
          </TabsContent>
        </Tabs>
      </div>
      <ConfirmDialog
        open={Boolean(removingUser)}
        onOpenChange={(open) => !open && setRemovingUser(null)}
        title={t("settings.users.removeTitle")}
        description={t("settings.users.removeDescription", { name: removingUser?.name ?? "" })}
        confirmLabel={t("settings.users.removeConfirm")}
        cancelLabel={t("common.cancel")}
        tone="destructive"
        loading={saving}
        onConfirm={removeUser}
      />
    </PageContainer>
  );
}
