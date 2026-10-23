import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import type {
  DeviceAppearance,
  UserPreferenceLanguage,
  UserPreferences,
  UserPreferencesPatch,
} from "../../../packages/contracts/src/user-preferences";
import type { UserPreferencesSyncResult } from "../../../packages/contracts/src/user-preferences-sync";
import { mobileUserPreferencesAdapter } from "../adapters/user-preferences";
import { MobileSelectSheet, MobileButton, MobileCard, MobilePageContainer, MobilePageHeader } from "./ui";
import { useMobileI18n, MOBILE_LANGUAGES } from "../i18n";
import { useMobileTheme } from "../theme/MobileThemeProvider";
import { mobileTheme } from "../theme/tokens";

type RemoteState = "synced" | "pending_sync" | "offline" | "conflict" | "forbidden" | "error";
type Sheet = "language" | "timeZone" | "appearance" | null;
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

const APPEARANCES: readonly DeviceAppearance[] = ["light", "dark", "system"];

function mutationId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
  return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-${((8 + Math.random() * 4) | 0).toString(16)}${hex().slice(1)}-${hex()}${hex()}${hex()}`;
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

export function MobilePreferencesScreen({ onBack }: { onBack: () => void }) {
  const { t, lang, setLang, storageError } = useMobileI18n();
  const theme = useMobileTheme();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [remoteState, setRemoteState] = useState<RemoteState>("synced");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Extract<UserPreferencesSyncResult, { state: "conflict" }> | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);

  const timeZones = useMemo(
    () => getTimeZones(preferences?.timeZone ?? "UTC"),
    [preferences?.timeZone],
  );

  const applyPreferences = useCallback((next: UserPreferences) => {
    setPreferences(next);
    setLang(next.language);
  }, [setLang]);

  const receiveResult = useCallback((result: UserPreferencesSyncResult) => {
    setError(null);
    setNotice(null);
    if (isRemoteSuccess(result)) {
      setRemoteState(result.state);
      if (result.preferences) applyPreferences(result.preferences);
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
  }, [applyPreferences]);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    setConflict(null);
    try {
      const adapter = mobileUserPreferencesAdapter;
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

  const updatePreferences = async (patch: UserPreferencesPatch) => {
    if (!preferences || busy || conflict) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await mobileUserPreferencesAdapter.patch({
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
      const result = await mobileUserPreferencesAdapter.retryPending(lang);
      receiveResult(result ?? await mobileUserPreferencesAdapter.read(lang));
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
      await mobileUserPreferencesAdapter.discardPending();
      setConflict(null);
      receiveResult(await mobileUserPreferencesAdapter.read(lang));
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
      receiveResult(await mobileUserPreferencesAdapter.patch({
        patch: attemptedPatch,
        expectedVersion: latest.version,
        mutationId: mutationId(),
      }));
    } catch (cause) {
      setRemoteState("error");
      setError(cause instanceof Error ? cause.message : t("common.accountPreferences.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const keepServerConflictValue = () => {
    if (!conflict) return;
    applyPreferences(conflict.latest);
    setConflict(null);
    setRemoteState("synced");
  };

  const changeAppearance = async (nextAppearance: DeviceAppearance) => {
    const saved = await theme.setAppearance(nextAppearance);
    if (saved) setNotice(t("common.accountPreferences.deviceSaved"));
    else setError(theme.error ?? t("common.accountPreferences.saveError"));
  };

  const updateChannel = (channel: NotificationChannel, checked: boolean) => {
    void updatePreferences({ personalNotifications: { channels: { [channel]: checked } } });
  };

  const updateType = (type: NotificationType, checked: boolean) => {
    void updatePreferences({ personalNotifications: { types: { [type]: checked } } });
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

  const notificationRow = (kind: "channels" | "types", key: NotificationChannel | NotificationType, checked: boolean, onChange: (value: boolean) => void) => (
    <View key={`${kind}-${key}`} style={styles.notificationRow}>
      <Text style={styles.notificationLabel}>{t(`common.accountPreferences.${kind}.${key}`)}</Text>
      <Switch
        accessibilityLabel={t(`common.accountPreferences.${kind}.${key}`)}
        accessibilityRole="switch"
        accessibilityState={{ checked, disabled: controlsDisabled }}
        disabled={controlsDisabled}
        value={checked}
        onValueChange={onChange}
        trackColor={{ false: mobileTheme.colors.borderSubtle, true: mobileTheme.colors.primary }}
        thumbColor={mobileTheme.colors.surface}
      />
    </View>
  );

  const languageOptions = MOBILE_LANGUAGES.map((item) => ({
    id: item.code,
    label: item.label,
  }));
  const timeZoneOptions = timeZones.map((timeZone) => ({ id: timeZone, label: timeZone }));
  const appearanceOptions = APPEARANCES.map((value) => ({
    id: value,
    label: t(`common.accountPreferences.${value}`),
  }));

  return (
    <MobilePageContainer onRefresh={() => void loadPreferences()} refreshing={loading}>
      <MobilePageHeader
        eyebrow={t("common.account")}
        title={t("common.accountPreferences.title")}
        subtitle={t("common.accountPreferences.description")}
        backLabel={t("common.back")}
        onBack={onBack}
      />
      {loading ? (
        <View accessibilityRole="progressbar" style={styles.feedback}>
          <Text style={styles.feedbackText}>{t("common.accountPreferences.loading")}</Text>
        </View>
      ) : remoteState === "forbidden" ? (
        <View accessibilityRole="alert" style={styles.feedback}>
          <Text style={styles.feedbackText}>{t("common.accountPreferences.signInRequired")}</Text>
          <MobileButton label={t("common.accountPreferences.signIn")} onPress={onBack} variant="outline" />
        </View>
      ) : (
        <View style={styles.content}>
          <View
            accessibilityRole={remoteState === "conflict" ? "alert" : "summary"}
            accessibilityLiveRegion="polite"
            style={styles.status}
          >
            <Text style={styles.statusText}>{statusText}</Text>
            {(remoteState === "pending_sync" || remoteState === "offline" || remoteState === "error") && (
              <View style={styles.statusActions}>
                <MobileButton
                  label={remoteState === "error" ? t("common.retry") : t("common.accountPreferences.retry")}
                  onPress={() => void retryPending()}
                  disabled={busy}
                  variant="outline"
                  size="sm"
                />
                {(remoteState === "pending_sync" || remoteState === "offline") && (
                  <MobileButton
                    label={t("common.accountPreferences.discard")}
                    onPress={() => void discardPending()}
                    disabled={busy}
                    variant="ghost"
                    size="sm"
                  />
                )}
              </View>
            )}
          </View>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
          {storageError ? <Text accessibilityRole="alert" style={styles.error}>{storageError}</Text> : null}
          {theme.error ? <Text accessibilityRole="alert" style={styles.error}>{theme.error}</Text> : null}
          {theme.loading ? <Text style={styles.feedbackText}>{t("common.accountPreferences.loading")}</Text> : null}

          {conflict && (
            <MobileCard style={styles.card}>
              <Text style={styles.cardTitle}>{t("common.accountPreferences.conflict")}</Text>
              <Text style={styles.description}>{t("common.accountPreferences.conflictDescription")}</Text>
              <View style={styles.statusActions}>
                <MobileButton label={t("common.accountPreferences.keepMine")} onPress={() => void keepLocalConflictValue()} disabled={busy} size="sm" />
                <MobileButton label={t("common.accountPreferences.keepServer")} onPress={keepServerConflictValue} disabled={busy} variant="outline" size="sm" />
              </View>
            </MobileCard>
          )}

          <MobileCard style={styles.card}>
            <Text style={styles.cardTitle}>{t("common.accountPreferences.languageTitle")}</Text>
            <Text style={styles.description}>{t("common.accountPreferences.languageDescription")}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.accountPreferences.language")}
              accessibilityState={{ disabled: controlsDisabled }}
              disabled={controlsDisabled}
              onPress={() => setSheet("language")}
              style={styles.selectRow}
            >
              <Text style={styles.selectLabel}>{t("common.accountPreferences.language")}</Text>
              <Text style={styles.selectValue}>{MOBILE_LANGUAGES.find((item) => item.code === (preferences?.language ?? lang))?.label ?? lang}</Text>
            </Pressable>
          </MobileCard>

          <MobileCard style={styles.card}>
            <Text style={styles.cardTitle}>{t("common.accountPreferences.timeZoneTitle")}</Text>
            <Text style={styles.description}>{t("common.accountPreferences.timeZoneDescription")}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.accountPreferences.timeZone")}
              accessibilityState={{ disabled: controlsDisabled }}
              disabled={controlsDisabled}
              onPress={() => setSheet("timeZone")}
              style={styles.selectRow}
            >
              <Text style={styles.selectLabel}>{t("common.accountPreferences.timeZone")}</Text>
              <Text style={styles.selectValue}>{preferences?.timeZone ?? "UTC"}</Text>
            </Pressable>
          </MobileCard>

          <MobileCard style={styles.card}>
            <Text style={styles.cardTitle}>{t("common.accountPreferences.appearanceTitle")}</Text>
            <Text style={styles.description}>{t("common.accountPreferences.appearanceDescription")}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.accountPreferences.appearanceTitle")}
              accessibilityState={{ disabled: theme.loading }}
              disabled={theme.loading}
              onPress={() => setSheet("appearance")}
              style={styles.selectRow}
            >
              <Text style={styles.selectLabel}>{t("common.accountPreferences.appearanceTitle")}</Text>
              <Text style={styles.selectValue}>{t(`common.accountPreferences.${theme.appearance}`)}</Text>
            </Pressable>
          </MobileCard>

          {preferences && (
            <MobileCard style={styles.card}>
              <Text style={styles.cardTitle}>{t("common.accountPreferences.notificationsTitle")}</Text>
              <Text style={styles.description}>{t("common.accountPreferences.notificationsDescription")}</Text>
              <Text style={styles.groupTitle}>{t("common.accountPreferences.channelsTitle")}</Text>
              {(Object.keys(preferences.personalNotifications.channels) as NotificationChannel[]).map((channel) =>
                notificationRow("channels", channel, preferences.personalNotifications.channels[channel], (checked) => updateChannel(channel, checked)),
              )}
              <Text style={styles.groupTitle}>{t("common.accountPreferences.typesTitle")}</Text>
              {(Object.keys(preferences.personalNotifications.types) as NotificationType[]).map((type) =>
                notificationRow("types", type, preferences.personalNotifications.types[type], (checked) => updateType(type, checked)),
              )}
            </MobileCard>
          )}
        </View>
      )}

      <MobileSelectSheet
        visible={sheet === "language"}
        onClose={() => setSheet(null)}
        title={t("common.accountPreferences.languageTitle")}
        subtitle={t("common.accountPreferences.languageDescription")}
        options={languageOptions}
        selectedId={preferences?.language ?? null}
        searchable
        searchPlaceholder={t("common.search")}
        onSelect={(value: UserPreferenceLanguage) => void updatePreferences({ language: value })}
      />
      <MobileSelectSheet
        visible={sheet === "timeZone"}
        onClose={() => setSheet(null)}
        title={t("common.accountPreferences.timeZoneTitle")}
        subtitle={t("common.accountPreferences.timeZoneDescription")}
        options={timeZoneOptions}
        selectedId={preferences?.timeZone ?? null}
        searchable
        searchPlaceholder={t("common.search")}
        onSelect={(value) => void updatePreferences({ timeZone: value })}
      />
      <MobileSelectSheet
        visible={sheet === "appearance"}
        onClose={() => setSheet(null)}
        title={t("common.accountPreferences.appearanceTitle")}
        subtitle={t("common.accountPreferences.appearanceDescription")}
        options={appearanceOptions}
        selectedId={theme.appearance}
        onSelect={(value: DeviceAppearance) => void changeAppearance(value)}
      />
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 24 },
  feedback: { alignItems: "center", gap: 14, paddingVertical: 30 },
  feedbackText: { color: mobileTheme.colors.textMuted, fontSize: 14, textAlign: "center" },
  status: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radii.md,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  statusText: { color: mobileTheme.colors.textHeading, fontSize: 13, fontWeight: "600" },
  statusActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  error: { color: mobileTheme.colors.danger, fontSize: 13 },
  notice: { color: mobileTheme.colors.success, fontSize: 13 },
  card: { gap: 8, marginBottom: 0 },
  cardTitle: { color: mobileTheme.colors.textHeading, fontSize: 16, fontWeight: "700" },
  description: { color: mobileTheme.colors.textMuted, fontSize: 12, lineHeight: 18 },
  selectRow: {
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radii.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  selectLabel: { color: mobileTheme.colors.textMuted, flex: 1, fontSize: 13 },
  selectValue: { color: mobileTheme.colors.textHeading, fontSize: 13, fontWeight: "600", textAlign: "right" },
  groupTitle: { color: mobileTheme.colors.textMuted, fontSize: 11, fontWeight: "700", marginTop: 10, textTransform: "uppercase" },
  notificationRow: {
    alignItems: "center",
    borderBottomColor: mobileTheme.colors.borderLight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingVertical: 4,
  },
  notificationLabel: { color: mobileTheme.colors.textHeading, flex: 1, fontSize: 13 },
});
