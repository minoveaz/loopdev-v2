import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Clock3, Languages, Loader2, Monitor, Moon, RefreshCw, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useNotificationPrefs, setNotificationPrefs } from "@/hooks/use-notification-prefs";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DataCard, LoadingState, PageContainer, PageHeader } from "@/components/common";
import { getWebUserPreferencesAdapter } from "@/loopdev/domains/platform/adapter/user-preferences";
import type {
  UserPreferences,
  UserPreferencesPatch,
} from "../../../../packages/contracts/src/user-preferences";
import type { UserPreferencesSyncResult } from "../../../../packages/contracts/src/user-preferences-sync";

type RemoteState = "synced" | "pending_sync" | "offline" | "conflict" | "forbidden" | "error";
type NotificationChannel = keyof UserPreferences["personalNotifications"]["channels"];
type NotificationType = keyof UserPreferences["personalNotifications"]["types"];

const COMMON_TIME_ZONES = [
  "UTC",
  "Europe/Madrid",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function mutationId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `preferences-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTimeZones(current: string): string[] {
  const intlWithTimeZones = Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  const available = typeof intlWithTimeZones.supportedValuesOf === "function"
    ? intlWithTimeZones.supportedValuesOf("timeZone")
    : COMMON_TIME_ZONES;
  return [...new Set(["UTC", ...available, current])].sort((left, right) => left.localeCompare(right));
}

function isRemoteSuccess(
  result: UserPreferencesSyncResult,
): result is Extract<UserPreferencesSyncResult, { success: true }> {
  return result.success;
}

export default function AccountSettings() {
  const { t, lang, languages, setLang } = useI18n();
  const { trail } = useBreadcrumbs();
  const { theme, setTheme } = useTheme();
  const { prefs: localNotificationPrefs } = useNotificationPrefs();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [remoteState, setRemoteState] = useState<RemoteState>("synced");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<Extract<UserPreferencesSyncResult, { state: "conflict" }> | null>(null);
  const [deviceNotice, setDeviceNotice] = useState<string | null>(null);

  const applyConfirmedPreferences = useCallback((next: UserPreferences) => {
    setPreferences(next);
    setLang(next.language);
    setNotificationPrefs(next.personalNotifications);
  }, [setLang]);

  const receiveResult = useCallback((result: UserPreferencesSyncResult) => {
    setError(null);
    if (isRemoteSuccess(result)) {
      setRemoteState(result.state);
      setPreferences(result.preferences ?? null);
      if (result.preferences) {
        applyConfirmedPreferences(result.preferences);
      }
      return;
    }
    if (result.state === "conflict") {
      setPreferences(result.latest);
      setConflict(result);
      setRemoteState("conflict");
      return;
    }
    setRemoteState(result.state);
    setError(result.error.message);
  }, [applyConfirmedPreferences]);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    setConflict(null);
    try {
      const adapter = getWebUserPreferencesAdapter();
      const pending = await adapter.pendingForCurrentUser();
      const result = pending ? await adapter.retryPending(lang) : await adapter.read(lang);
      receiveResult(result ?? await adapter.read(lang));
    } catch (cause) {
      setRemoteState("error");
      setError(cause instanceof Error ? cause.message : t("common.accountPreferences.loadError"));
    } finally {
      setLoading(false);
    }
  }, [lang, receiveResult, t]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const timeZones = useMemo(
    () => getTimeZones(preferences?.timeZone ?? "UTC"),
    [preferences?.timeZone],
  );

  const updatePreferences = async (patch: UserPreferencesPatch) => {
    if (!preferences || busy || conflict) return;
    setBusy(true);
    setError(null);
    setDeviceNotice(null);
    try {
      const result = await getWebUserPreferencesAdapter().patch({
        patch,
        expectedVersion: preferences.version,
        mutationId: mutationId(),
      });
      receiveResult(result);
    } catch (cause) {
      setRemoteState("error");
      setError(cause instanceof Error ? cause.message : t("common.accountPreferences.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const retryPending = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const adapter = getWebUserPreferencesAdapter();
      const result = await adapter.retryPending(lang);
      receiveResult(result ?? await adapter.read(lang));
    } catch (cause) {
      setRemoteState("error");
      setError(cause instanceof Error ? cause.message : t("common.accountPreferences.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const discardPending = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const adapter = getWebUserPreferencesAdapter();
      await adapter.discardPending();
      setConflict(null);
      receiveResult(await adapter.read(lang));
    } catch (cause) {
      setRemoteState("error");
      setError(cause instanceof Error ? cause.message : t("common.accountPreferences.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const keepLocalConflictValue = async () => {
    if (!conflict || busy) return;
    const attemptedPatch = conflict.attemptedPatch;
    const latest = conflict.latest;
    setConflict(null);
    setPreferences(latest);
    setRemoteState("synced");
    setBusy(true);
    setError(null);
    try {
      const result = await getWebUserPreferencesAdapter().patch({
        patch: attemptedPatch,
        expectedVersion: latest.version,
        mutationId: mutationId(),
      });
      receiveResult(result);
    } catch (cause) {
      setRemoteState("error");
      setError(cause instanceof Error ? cause.message : t("common.accountPreferences.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const keepServerConflictValue = () => {
    if (!conflict) return;
    applyConfirmedPreferences(conflict.latest);
    setConflict(null);
    setRemoteState("synced");
  };

  const updateChannel = (channel: NotificationChannel, checked: boolean) => {
    if (!preferences) return;
    void updatePreferences({ personalNotifications: { channels: { [channel]: checked } } });
  };

  const updateType = (type: NotificationType, checked: boolean) => {
    if (!preferences) return;
    void updatePreferences({ personalNotifications: { types: { [type]: checked } } });
  };

  const changeLanguage = (value: string) => {
    const language = languages.find((entry) => entry.code === value)?.code;
    if (language) void updatePreferences({ language });
  };

  const changeTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    setDeviceNotice(t("common.accountPreferences.deviceSaved"));
  };

  const controlsDisabled = !preferences || busy || remoteState === "forbidden" || remoteState === "conflict";
  const statusText = remoteState === "synced"
    ? t("common.accountPreferences.synced")
    : remoteState === "pending_sync"
      ? t("common.accountPreferences.pending")
      : remoteState === "offline"
        ? t("common.accountPreferences.offline")
        : remoteState === "conflict"
          ? t("common.accountPreferences.conflict")
          : remoteState === "error"
            ? t("common.accountPreferences.loadError")
          : null;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("common.account")}
        title={t("common.accountPreferences.title")}
        description={t("common.accountPreferences.description")}
        breadcrumbs={trail}
      />

      {loading ? (
        <LoadingState label={t("common.accountPreferences.loading")} />
      ) : remoteState === "forbidden" ? (
        <div role="alert" className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="mb-4 text-sm text-muted-foreground">{t("common.accountPreferences.signInRequired")}</p>
          <Button asChild className="min-h-11">
            <Link to="/pages/login">{t("common.accountPreferences.signIn")}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {statusText && (
            <div
              role={remoteState === "conflict" ? "alert" : "status"}
              aria-live="polite"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {statusText}
              </span>
              <div className="flex flex-wrap gap-2">
                {(remoteState === "pending_sync" || remoteState === "offline" || remoteState === "error") && (
                  <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => void retryPending()} disabled={busy}>
                    <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
                    {remoteState === "error" ? t("common.retry") : t("common.accountPreferences.retry")}
                  </Button>
                )}
                {remoteState === "pending_sync" && (
                  <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => void discardPending()} disabled={busy}>
                    {t("common.accountPreferences.discard")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

          {conflict && (
            <div role="alert" className="rounded-xl border border-warning/40 bg-warning/5 p-4">
              <p className="text-sm text-foreground">{t("common.accountPreferences.conflictDescription")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" className="min-h-11" onClick={() => void keepLocalConflictValue()} disabled={busy}>
                  {t("common.accountPreferences.keepMine")}
                </Button>
                <Button type="button" variant="outline" className="min-h-11" onClick={keepServerConflictValue} disabled={busy}>
                  {t("common.accountPreferences.keepServer")}
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-2">
            <DataCard
              title={t("common.accountPreferences.languageTitle")}
              description={t("common.accountPreferences.languageDescription")}
              className="min-w-0"
            >
              <div className="flex items-center gap-3">
                <Languages className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor="account-language">{t("common.accountPreferences.language")}</Label>
                  <Select
                    value={preferences?.language ?? ""}
                    onValueChange={changeLanguage}
                    disabled={controlsDisabled}
                  >
                    <SelectTrigger id="account-language" className="min-h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.code} value={language.code}>{language.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DataCard>

            <DataCard
              title={t("common.accountPreferences.timeZoneTitle")}
              description={t("common.accountPreferences.timeZoneDescription")}
              className="min-w-0"
            >
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor="account-time-zone">{t("common.accountPreferences.timeZone")}</Label>
                  <Select
                    value={preferences?.timeZone ?? ""}
                    onValueChange={(value) => void updatePreferences({ timeZone: value })}
                    disabled={controlsDisabled}
                  >
                    <SelectTrigger id="account-time-zone" className="min-h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeZones.map((zone) => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DataCard>

            <DataCard
              title={t("common.accountPreferences.appearanceTitle")}
              description={t("common.accountPreferences.appearanceDescription")}
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {([
                  ["light", Sun, t("common.accountPreferences.light")],
                  ["dark", Moon, t("common.accountPreferences.dark")],
                  ["system", Monitor, t("common.accountPreferences.system")],
                ] as const).map(([value, Icon, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={theme === value}
                    onClick={() => changeTheme(value)}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${theme === value ? "border-primary bg-primary/5 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-hover"}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
              {deviceNotice && <p role="status" className="mt-3 text-xs text-muted-foreground">{deviceNotice}</p>}
            </DataCard>

            <DataCard
              title={t("common.accountPreferences.notificationsTitle")}
              description={t("common.accountPreferences.notificationsDescription")}
              className="min-w-0"
            >
              <div className="space-y-5">
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Bell className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    {t("common.accountPreferences.channelsTitle")}
                  </h4>
                  <div className="space-y-3">
                    {(["inApp", "email", "push", "sound"] as const).map((channel) => {
                      const id = `account-notification-channel-${channel}`;
                      return (
                        <div key={channel} className="flex min-h-11 items-center justify-between gap-3">
                          <Label id={`${id}-label`} htmlFor={id} className="cursor-pointer">
                            {t(`common.accountPreferences.channels.${channel}`)}
                          </Label>
                          <Switch
                            id={id}
                            aria-labelledby={`${id}-label`}
                            checked={preferences?.personalNotifications.channels[channel] ?? localNotificationPrefs.channels[channel]}
                            onCheckedChange={(checked) => updateChannel(channel, checked)}
                            disabled={controlsDisabled}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="mb-3 text-sm font-medium">{t("common.accountPreferences.typesTitle")}</h4>
                  <div className="space-y-3">
                    {(["info", "success", "warning", "error"] as const).map((type) => {
                      const id = `account-notification-type-${type}`;
                      return (
                        <div key={type} className="flex min-h-11 items-center justify-between gap-3">
                          <Label id={`${id}-label`} htmlFor={id} className="cursor-pointer">
                            {t(`common.accountPreferences.types.${type}`)}
                          </Label>
                          <Switch
                            id={id}
                            aria-labelledby={`${id}-label`}
                            checked={preferences?.personalNotifications.types[type] ?? localNotificationPrefs.types[type]}
                            onCheckedChange={(checked) => updateType(type, checked)}
                            disabled={controlsDisabled}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </DataCard>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
