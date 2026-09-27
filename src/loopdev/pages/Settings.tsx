import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, CircleAlert, MailPlus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { platformAdapter } from "@/loopdev/domains/platform/adapter";
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
import { PageContainer, PageHeader, SurfaceCard, SurfaceCardBody, SurfaceCardHeader, StatusBadge } from "@/components/common";

const statusTone: Record<SettingsUserStatus, "success" | "warning" | "destructive"> = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
};

export default function Settings() {
  const { t } = useI18n();
  const { trail } = useBreadcrumbs();
  const organizationId = platformAdapter.getOrganizationContext().organizationId;
  const [snapshot, setSnapshot] = useState<SettingsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SettingsAdapterError | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<OrganizationSettings | null>(null);
  const [invite, setInvite] = useState({ name: "", email: "", role: "member" as "member" | "admin" });

  const load = () => {
    setLoading(true);
    setError(null);
    void settingsAdapter.getSnapshot(organizationId)
      .then((next) => {
        setSnapshot(next);
        setForm(next.organization);
      })
      .catch((cause: unknown) => setError(cause instanceof SettingsAdapterError ? cause : new SettingsAdapterError(t("settings.errors.load"), "invalid")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canManage = useMemo(() => platformAdapter.hasPermission("organization.read"), []);

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
      setSnapshot((current) => current ? { ...current, users: [...current.users, user] } : current);
      setInvite({ name: "", email: "", role: "member" });
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

  return (
    <PageContainer width="wide">
      <PageHeader title={t("settings.title")} description={t("settings.description")} breadcrumbs={trail.length ? trail : [{ label: t("settings.title") }]} />
      <div className="space-y-6">
        {notice && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{notice}</div>}
        {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"><span>{error.message}</span><Button size="sm" variant="ghost" onClick={() => setError(null)}>{t("common.close")}</Button></div>}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <SurfaceCard>
            <SurfaceCardHeader title={t("settings.organization.title")} description={t("settings.organization.description")} icon={Building2} />
            <SurfaceCardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="organization-name">{t("settings.organization.name")}</Label><Input id="organization-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="organization-slug">{t("settings.organization.slug")}</Label><Input id="organization-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="organization-timezone">{t("settings.organization.timezone")}</Label><Input id="organization-timezone" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} /></div>
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
        <SurfaceCard>
          <SurfaceCardHeader title={t("settings.users.title")} description={t("settings.users.description")} icon={Users} />
          <SurfaceCardBody className="space-y-5">
            <div className="grid gap-3 rounded-lg border border-dashed border-border p-4 md:grid-cols-[1fr_1fr_auto_auto]">
              <Input aria-label={t("settings.users.name")} placeholder={t("settings.users.name")} value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} />
              <Input aria-label={t("settings.users.email")} type="email" placeholder={t("settings.users.email")} value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} />
              <Select value={invite.role} onValueChange={(role: "member" | "admin") => setInvite({ ...invite, role })}><SelectTrigger aria-label={t("settings.users.role")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="member">{t("settings.roles.member")}</SelectItem><SelectItem value="admin">{t("settings.roles.admin")}</SelectItem></SelectContent></Select>
              <Button onClick={sendInvite} disabled={saving || !invite.name || !invite.email}><MailPlus className="me-2 h-4 w-4" />{t("settings.users.invite")}</Button>
            </div>
            {snapshot.users.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{t("settings.users.empty")}</p> : <div className="divide-y divide-border rounded-lg border border-border">{snapshot.users.map((user) => <div key={user.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p className="font-medium">{user.name}</p><p className="text-sm text-muted-foreground">{user.email}</p></div><div className="flex items-center gap-2"><StatusBadge tone={statusTone[user.status]}>{t(`settings.status.${user.status}`)}</StatusBadge><Select value={user.role} onValueChange={(role: SettingsUser["role"]) => void updateUser(user, { role })}><SelectTrigger className="w-32" aria-label={`${t("settings.users.role")} ${user.email}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">{t("settings.roles.owner")}</SelectItem><SelectItem value="admin">{t("settings.roles.admin")}</SelectItem><SelectItem value="member">{t("settings.roles.member")}</SelectItem></SelectContent></Select></div><Button variant="outline" size="sm" disabled={user.role === "owner"} onClick={() => void updateUser(user, { status: user.status === "suspended" ? "active" : "suspended" })}>{user.status === "suspended" ? t("settings.users.activate") : t("settings.users.suspend")}</Button></div>)}</div>}
          </SurfaceCardBody>
        </SurfaceCard>
      </div>
    </PageContainer>
  );
}
