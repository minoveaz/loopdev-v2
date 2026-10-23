import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import type {
  AuthError,
  AuthResult,
  AuthSecurityStatus,
  AuthMfaFactor,
  TotpEnrollment,
} from "../../../packages/contracts/src/auth-port";
import { mobileAuthAdapter } from "../adapters/auth";
import { useMobileI18n } from "../i18n";
import { mobileTheme } from "../theme/tokens";
import {
  MobileButton,
  MobileCard,
  MobileCardBody,
  MobileCardHeader,
  MobileConfirmDialog,
  MobileInput,
  MobileLoadingState,
  MobilePageContainer,
  MobilePageHeader,
} from "./ui";

type Operation = "password" | "email" | "enroll" | "verify" | "remove" | "sessions" | "reauth" | null;

export function MobileSecurityScreen({ onBack }: { onBack: () => void }) {
  const { t } = useMobileI18n();
  const [status, setStatus] = useState<AuthSecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [operation, setOperation] = useState<Operation>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [reauthCode, setReauthCode] = useState("");
  const [removeFactor, setRemoveFactor] = useState<AuthMfaFactor | null>(null);
  const [confirmSignOutOthers, setConfirmSignOutOthers] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await mobileAuthAdapter.getSecurityStatus();
      if (result.success === true) {
        setStatus(result.data);
      } else {
        setStatus(null);
        setError(result.error);
      }
    } catch (cause) {
      setStatus(null);
      setError({
        code: "AUTH_NETWORK_ERROR",
        message: cause instanceof Error ? cause.message : t("common.accountSecurity.loadError"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const verifiedFactors = useMemo(
    () => status?.mfaFactors.filter((factor) => factor.status === "verified") ?? [],
    [status],
  );

  const runOperation = useCallback(async <T,>(
    currentOperation: Exclude<Operation, null>,
    request: () => Promise<AuthResult<T>>,
    successMessage: string,
  ): Promise<boolean> => {
    setOperation(currentOperation);
    setError(null);
    setNotice(null);
    try {
      const result = await request();
      if (result.success === false) {
        setError(result.error);
        return false;
      }
      setNotice(successMessage);
      return true;
    } catch (cause) {
      setError({
        code: "AUTH_NETWORK_ERROR",
        message: cause instanceof Error ? cause.message : t("common.accountSecurity.loadError"),
      });
      return false;
    } finally {
      setOperation(null);
    }
  }, [t]);

  const handlePasswordSubmit = async () => {
    if (newPassword.length < 6 || newPassword !== confirmPassword) return;
    const changed = await runOperation(
      "password",
      () => mobileAuthAdapter.updatePassword({ newPassword }),
      t("common.accountSecurity.passwordSuccess"),
    );
    if (changed) {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleEmailSubmit = async () => {
    if (!newEmail.trim()) return;
    setOperation("email");
    setError(null);
    setNotice(null);
    try {
      const result = await mobileAuthAdapter.requestEmailChange({ newEmail });
      if (result.success === false) {
        setError(result.error);
        return;
      }
      setStatus((current) => current ? { ...current, pendingEmailChange: result.data.newEmail } : current);
      setNotice(t("common.accountSecurity.emailPending"));
      setNewEmail("");
    } catch (cause) {
      setError({
        code: "AUTH_NETWORK_ERROR",
        message: cause instanceof Error ? cause.message : t("common.accountSecurity.loadError"),
      });
    } finally {
      setOperation(null);
    }
  };

  const handleStartTotp = async () => {
    setOperation("enroll");
    setError(null);
    setNotice(null);
    try {
      const result = await mobileAuthAdapter.beginTotpEnrollment();
      if (result.success === true) {
        setEnrollment(result.data);
        setTotpCode("");
      } else {
        setError(result.error);
      }
    } catch (cause) {
      setError({
        code: "AUTH_NETWORK_ERROR",
        message: cause instanceof Error ? cause.message : t("common.accountSecurity.loadError"),
      });
    } finally {
      setOperation(null);
    }
  };

  const handleVerifyTotp = async () => {
    const factorId = enrollment?.factorId ?? status?.mfaFactors.find((factor) => factor.status === "unverified")?.id;
    if (!factorId || !/^\d{6}$/.test(totpCode.trim())) return;
    const verified = await runOperation(
      "verify",
      () => mobileAuthAdapter.verifyTotp({ factorId, code: totpCode.trim() }),
      t("common.accountSecurity.totpSuccess"),
    );
    if (verified) {
      setEnrollment(null);
      setTotpCode("");
      await loadStatus();
    }
  };

  const handleCancelEnrollment = async () => {
    if (!enrollment) return;
    const removed = await runOperation(
      "remove",
      () => mobileAuthAdapter.removeTotpFactor({ factorId: enrollment.factorId }),
      t("common.accountSecurity.totpRemoved"),
    );
    if (removed) {
      setEnrollment(null);
      setTotpCode("");
      await loadStatus();
    }
  };

  const handleRemoveTotp = async () => {
    if (!removeFactor) return;
    const removed = await runOperation(
      "remove",
      () => mobileAuthAdapter.removeTotpFactor({ factorId: removeFactor.id }),
      t("common.accountSecurity.totpRemoved"),
    );
    setRemoveFactor(null);
    if (removed) await loadStatus();
  };

  const handleSignOutOthers = async () => {
    const signedOut = await runOperation(
      "sessions",
      () => mobileAuthAdapter.signOutOtherSessions(),
      t("common.accountSecurity.sessionsRevoked"),
    );
    setConfirmSignOutOthers(false);
    if (signedOut) await loadStatus();
  };

  const handleReauthenticate = async () => {
    const factorId = verifiedFactors[0]?.id;
    if (!factorId || !/^\d{6}$/.test(reauthCode.trim())) return;
    const verified = await runOperation(
      "reauth",
      () => mobileAuthAdapter.verifyTotp({ factorId, code: reauthCode.trim() }),
      t("common.accountSecurity.reauthSuccess"),
    );
    if (verified) {
      setReauthCode("");
      await loadStatus();
    }
  };

  const messageForError = (authError: AuthError) =>
    authError.code === "AUTH_REAUTH_REQUIRED"
      ? t("common.accountSecurity.reauthRequired")
      : authError.code === "AUTH_OPERATION_UNSUPPORTED"
        ? t("common.accountSecurity.providerUnavailable")
        : authError.code === "AUTH_SESSION_EXPIRED"
          ? t("common.accountSecurity.sessionExpired")
          : authError.message;

  return (
    <MobilePageContainer onRefresh={() => void loadStatus()} refreshing={loading}>
      <MobilePageHeader
        eyebrow={t("common.account")}
        title={t("common.accountSecurity.title")}
        subtitle={t("common.accountSecurity.description")}
        onBack={onBack}
        backLabel={t("common.back")}
      />

      {loading ? (
        <MobileLoadingState message={t("common.accountSecurity.loading")} />
      ) : error && !status ? (
        <MobileCard>
          <MobileCardBody>
            <Text accessibilityRole="alert" style={styles.alertText}>{messageForError(error)}</Text>
            <MobileButton
              label={t("common.retry")}
              onPress={() => void loadStatus()}
              variant="outline"
              style={styles.spacedButton}
            />
          </MobileCardBody>
        </MobileCard>
      ) : status ? (
        <View style={styles.content}>
          {error ? <Text accessibilityRole="alert" style={styles.alertText}>{messageForError(error)}</Text> : null}
          {notice ? <Text accessibilityRole="alert" style={styles.noticeText}>{notice}</Text> : null}

          {error?.code === "AUTH_REAUTH_REQUIRED" && verifiedFactors.length > 0 ? (
            <MobileCard>
              <MobileCardHeader title={t("common.accountSecurity.reauthTitle")} subtitle={t("common.accountSecurity.reauthDescription")} />
              <MobileCardBody>
                <MobileInput
                  accessibilityLabel={t("common.accountSecurity.verificationCode")}
                  label={t("common.accountSecurity.verificationCode")}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={reauthCode}
                  onChangeText={(value) => setReauthCode(value.replace(/\D/g, "").slice(0, 6))}
                />
                <MobileButton
                  label={operation === "reauth" ? t("common.accountSecurity.verifying") : t("common.accountSecurity.verify")}
                  onPress={() => void handleReauthenticate()}
                  disabled={operation !== null || reauthCode.length !== 6}
                  loading={operation === "reauth"}
                />
              </MobileCardBody>
            </MobileCard>
          ) : null}

          <MobileCard>
            <MobileCardHeader title={t("common.accountSecurity.emailTitle")} subtitle={t("common.accountSecurity.emailDescription")} />
            <MobileCardBody>
              <Text style={styles.primaryValue}>{status.email}</Text>
              <Text style={styles.secondaryText}>
                {status.emailVerified ? t("common.accountSecurity.emailVerified") : t("common.accountSecurity.emailUnverified")}
              </Text>
              {status.pendingEmailChange ? (
                <Text style={styles.pendingText}>
                  {t("common.accountSecurity.pendingEmail", { email: status.pendingEmailChange })}
                </Text>
              ) : null}
              <MobileInput
                accessibilityLabel={t("common.accountSecurity.newEmail")}
                label={t("common.accountSecurity.newEmail")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={newEmail}
                onChangeText={setNewEmail}
              />
              <MobileButton
                label={operation === "email" ? t("common.accountSecurity.sending") : t("common.accountSecurity.requestEmailChange")}
                onPress={() => void handleEmailSubmit()}
                disabled={operation !== null || !newEmail.trim()}
                loading={operation === "email"}
              />
            </MobileCardBody>
          </MobileCard>

          <MobileCard>
            <MobileCardHeader title={t("common.accountSecurity.passwordTitle")} subtitle={t("common.accountSecurity.passwordDescription")} />
            <MobileCardBody>
              <MobileInput
                accessibilityLabel={t("common.accountSecurity.newPassword")}
                label={t("common.accountSecurity.newPassword")}
                secureTextEntry
                autoComplete="new-password"
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <MobileInput
                accessibilityLabel={t("common.accountSecurity.confirmPassword")}
                label={t("common.accountSecurity.confirmPassword")}
                secureTextEntry
                autoComplete="new-password"
                value={confirmPassword}
                error={confirmPassword && newPassword !== confirmPassword ? t("common.accountSecurity.passwordMismatch") : undefined}
                onChangeText={setConfirmPassword}
              />
              <MobileButton
                label={operation === "password" ? t("common.accountSecurity.saving") : t("common.accountSecurity.changePassword")}
                onPress={() => void handlePasswordSubmit()}
                disabled={operation !== null || newPassword.length < 6 || newPassword !== confirmPassword}
                loading={operation === "password"}
              />
            </MobileCardBody>
          </MobileCard>

          <MobileCard>
            <MobileCardHeader title={t("common.accountSecurity.totpTitle")} subtitle={t("common.accountSecurity.totpDescription")} />
            <MobileCardBody>
              {status.mfaFactors.length ? status.mfaFactors.map((factor) => (
                <View key={factor.id} style={styles.factorRow}>
                  <View style={styles.factorInfo}>
                    <Text style={styles.primaryValue}>{factor.friendlyName || t("common.accountSecurity.authenticator")}</Text>
                    <Text style={styles.secondaryText}>
                      {factor.status === "verified" ? t("common.accountSecurity.factorVerified") : t("common.accountSecurity.factorPending")}
                    </Text>
                  </View>
                  <MobileButton
                    label={t("common.accountSecurity.removeFactor")}
                    onPress={() => setRemoveFactor(factor)}
                    variant="outline"
                    size="sm"
                    disabled={operation !== null}
                  />
                </View>
              )) : <Text style={styles.secondaryText}>{t("common.accountSecurity.noFactors")}</Text>}

              {enrollment ? (
                <View style={styles.enrollment}>
                  <Text style={styles.primaryValue}>{t("common.accountSecurity.scanQr")}</Text>
                  <View accessibilityLabel={t("common.accountSecurity.qrAlt")} style={styles.qrWrap}>
                    {enrollment.qrCode.trim().startsWith("<svg") ? (
                      <SvgXml xml={enrollment.qrCode} width={192} height={192} />
                    ) : enrollment.qrCode.startsWith("data:image/") ? (
                      <Image source={{ uri: enrollment.qrCode }} style={styles.qrImage} />
                    ) : (
                      <Text style={styles.secondaryText}>{t("common.accountSecurity.qrAlt")}</Text>
                    )}
                  </View>
                  <Text style={styles.secondaryText}>{t("common.accountSecurity.manualSecret")}</Text>
                  <Text selectable style={styles.secret}>{enrollment.secret}</Text>
                  <MobileInput
                    accessibilityLabel={t("common.accountSecurity.verificationCode")}
                    label={t("common.accountSecurity.verificationCode")}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={totpCode}
                    onChangeText={(value) => setTotpCode(value.replace(/\D/g, "").slice(0, 6))}
                  />
                  <MobileButton
                    label={operation === "verify" ? t("common.accountSecurity.verifying") : t("common.accountSecurity.verifyAndEnable")}
                    onPress={() => void handleVerifyTotp()}
                    disabled={operation !== null || totpCode.length !== 6}
                    loading={operation === "verify"}
                  />
                  <MobileButton
                    label={t("common.cancel")}
                    onPress={() => void handleCancelEnrollment()}
                    variant="ghost"
                    style={styles.spacedButton}
                    disabled={operation !== null}
                  />
                </View>
              ) : (
                <MobileButton
                  label={operation === "enroll" ? t("common.accountSecurity.starting") : t("common.accountSecurity.enableTotp")}
                  onPress={() => void handleStartTotp()}
                  variant="outline"
                  loading={operation === "enroll"}
                  disabled={operation !== null}
                  style={styles.spacedButton}
                />
              )}
            </MobileCardBody>
          </MobileCard>

          <MobileCard>
            <MobileCardHeader title={t("common.accountSecurity.sessionsTitle")} subtitle={t("common.accountSecurity.sessionsDescription")} />
            <MobileCardBody>
              <Text style={styles.secondaryText}>{t("common.accountSecurity.sessionsExplanation")}</Text>
              <MobileButton
                label={operation === "sessions" ? t("common.accountSecurity.endingSessions") : t("common.accountSecurity.signOutOthers")}
                onPress={() => setConfirmSignOutOthers(true)}
                variant="destructive"
                disabled={operation !== null || !status.signOutOtherSessionsAvailable}
                style={styles.spacedButton}
              />
            </MobileCardBody>
          </MobileCard>
        </View>
      ) : null}

      <MobileConfirmDialog
        visible={Boolean(removeFactor)}
        title={t("common.accountSecurity.removeFactorTitle")}
        description={t("common.accountSecurity.removeFactorDescription")}
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.accountSecurity.removeFactor")}
        destructive
        loading={operation === "remove"}
        onCancel={() => setRemoveFactor(null)}
        onConfirm={() => void handleRemoveTotp()}
      />
      <MobileConfirmDialog
        visible={confirmSignOutOthers}
        title={t("common.accountSecurity.sessionsConfirmTitle")}
        description={t("common.accountSecurity.sessionsConfirmDescription")}
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.accountSecurity.signOutOthers")}
        loading={operation === "sessions"}
        onCancel={() => setConfirmSignOutOthers(false)}
        onConfirm={() => void handleSignOutOthers()}
      />
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 20 },
  alertText: {
    backgroundColor: mobileTheme.colors.dangerBg,
    borderRadius: mobileTheme.radii.md,
    color: mobileTheme.colors.danger,
    fontSize: 13,
    lineHeight: 19,
    padding: 12,
  },
  noticeText: {
    backgroundColor: mobileTheme.colors.primarySoft,
    borderRadius: mobileTheme.radii.md,
    color: mobileTheme.colors.textHeading,
    fontSize: 13,
    lineHeight: 19,
    padding: 12,
  },
  primaryValue: {
    color: mobileTheme.colors.textHeading,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  pendingText: {
    color: mobileTheme.colors.warning,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    marginTop: 4,
  },
  factorRow: {
    alignItems: "center",
    borderBottomColor: mobileTheme.colors.borderLight,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  factorInfo: { flex: 1 },
  enrollment: {
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radii.md,
    borderWidth: 1,
    marginTop: 14,
    padding: 12,
  },
  qrWrap: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radii.sm,
    borderWidth: 1,
    justifyContent: "center",
    marginVertical: 12,
    minHeight: 210,
    padding: 8,
    width: "100%",
  },
  qrImage: { height: 192, width: 192 },
  secret: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderRadius: mobileTheme.radii.sm,
    color: mobileTheme.colors.textHeading,
    fontFamily: "monospace",
    fontSize: 14,
    marginBottom: 14,
    padding: 12,
  },
  spacedButton: { marginTop: 8 },
});
