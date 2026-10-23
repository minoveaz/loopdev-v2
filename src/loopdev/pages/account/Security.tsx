import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { KeyRound, Mail, ShieldCheck, Smartphone, UsersRound } from "lucide-react";
import { useI18n } from "@/i18n";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataCard, PageContainer, PageHeader, ConfirmDialog } from "@/components/common";
import {
  defaultWebAuthAdapter,
} from "@/loopdev/domains/platform/adapter/auth-supabase";
import type { AuthError, AuthResult, AuthSecurityStatus, AuthMfaFactor } from "../../../../packages/contracts/src/auth-port";

type Operation = "password" | "email" | "enroll" | "verify" | "remove" | "sessions" | "reauth" | null;

export default function Security() {
  const { t } = useI18n();
  const { trail } = useBreadcrumbs();
  const [status, setStatus] = useState<AuthSecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [operation, setOperation] = useState<Operation>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [enrollment, setEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [reauthCode, setReauthCode] = useState("");
  const [removeFactor, setRemoveFactor] = useState<AuthMfaFactor | null>(null);
  const [confirmSignOutOthers, setConfirmSignOutOthers] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await defaultWebAuthAdapter.getSecurityStatus();
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

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 6 || newPassword !== confirmPassword) return;
    const changed = await runOperation(
      "password",
      () => defaultWebAuthAdapter.updatePassword({ newPassword }),
      t("common.accountSecurity.passwordSuccess"),
    );
    if (changed) {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newEmail.trim()) return;
    setOperation("email");
    setError(null);
    setNotice(null);
    try {
      const result = await defaultWebAuthAdapter.requestEmailChange({ newEmail });
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
      const result = await defaultWebAuthAdapter.beginTotpEnrollment();
      if (result.success === true) {
        setEnrollment({
          factorId: result.data.factorId,
          qrCode: result.data.qrCode,
          secret: result.data.secret,
        });
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

  const handleVerifyTotp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const factorId = enrollment?.factorId ?? status?.mfaFactors.find((factor) => factor.status === "unverified")?.id;
    if (!factorId || !/^\d{6}$/.test(totpCode.trim())) return;
    const verified = await runOperation(
      "verify",
      () => defaultWebAuthAdapter.verifyTotp({ factorId, code: totpCode.trim() }),
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
      () => defaultWebAuthAdapter.removeTotpFactor({ factorId: enrollment.factorId }),
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
      () => defaultWebAuthAdapter.removeTotpFactor({ factorId: removeFactor.id }),
      t("common.accountSecurity.totpRemoved"),
    );
    setRemoveFactor(null);
    if (removed) await loadStatus();
  };

  const handleSignOutOthers = async () => {
    const signedOut = await runOperation(
      "sessions",
      () => defaultWebAuthAdapter.signOutOtherSessions(),
      t("common.accountSecurity.sessionsRevoked"),
    );
    setConfirmSignOutOthers(false);
    if (signedOut) await loadStatus();
  };

  const handleReauthenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const factorId = verifiedFactors[0]?.id;
    if (!factorId || !/^\d{6}$/.test(reauthCode.trim())) return;
    const verified = await runOperation(
      "reauth",
      () => defaultWebAuthAdapter.verifyTotp({ factorId, code: reauthCode.trim() }),
      t("common.accountSecurity.reauthSuccess"),
    );
    if (verified) {
      setReauthCode("");
      await loadStatus();
    }
  };

  const qrCodeSrc = enrollment
    ? enrollment.qrCode.startsWith("data:")
      ? enrollment.qrCode
      : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(enrollment.qrCode)}`
    : null;
  const messageForError = (authError: AuthError) =>
    authError.code === "AUTH_REAUTH_REQUIRED"
      ? t("common.accountSecurity.reauthRequired")
      : authError.code === "AUTH_OPERATION_UNSUPPORTED"
        ? t("common.accountSecurity.providerUnavailable")
        : authError.code === "AUTH_SESSION_EXPIRED"
          ? t("common.accountSecurity.sessionExpired")
          : authError.message;

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow={t("common.account")}
        title={t("common.accountSecurity.title")}
        description={t("common.accountSecurity.description")}
        breadcrumbs={trail.length ? trail : [{ label: t("common.account") }, { label: t("common.security") }]}
      />

      {loading ? (
        <div role="status" className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {t("common.accountSecurity.loading")}
        </div>
      ) : error && !status ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="font-medium text-foreground">{t("common.accountSecurity.loadError")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{messageForError(error)}</p>
          <Button className="mt-4" variant="outline" onClick={() => void loadStatus()}>{t("common.retry")}</Button>
        </div>
      ) : status ? (
        <div className="space-y-5">
          {error && (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {messageForError(error)}
            </div>
          )}
          {notice && (
            <div role="status" className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
              {notice}
            </div>
          )}

          {error?.code === "AUTH_REAUTH_REQUIRED" && verifiedFactors.length > 0 && (
            <DataCard
              title={t("common.accountSecurity.reauthTitle")}
              description={t("common.accountSecurity.reauthDescription")}
            >
              <form onSubmit={(event) => void handleReauthenticate(event)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reauth-code">{t("common.accountSecurity.verificationCode")}</Label>
                  <Input
                    id="reauth-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={reauthCode}
                    onChange={(event) => setReauthCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                  />
                </div>
                <Button type="submit" disabled={operation !== null || reauthCode.length !== 6}>
                  {operation === "reauth" ? t("common.accountSecurity.verifying") : t("common.accountSecurity.verify")}
                </Button>
              </form>
            </DataCard>
          )}

          <DataCard
            title={t("common.accountSecurity.emailTitle")}
            description={t("common.accountSecurity.emailDescription")}
          >
            <div className="mb-4 flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 text-sm">
                <p className="break-all font-medium text-foreground">{status.email}</p>
                <p className="mt-1 text-muted-foreground">
                  {status.emailVerified ? t("common.accountSecurity.emailVerified") : t("common.accountSecurity.emailUnverified")}
                </p>
                {status.pendingEmailChange && (
                  <p className="mt-1 break-all text-warning-foreground">
                    {t("common.accountSecurity.pendingEmail", { email: status.pendingEmailChange })}
                  </p>
                )}
              </div>
            </div>
            <form onSubmit={(event) => void handleEmailSubmit(event)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">{t("common.accountSecurity.newEmail")}</Label>
                <Input id="new-email" type="email" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required />
              </div>
              <Button type="submit" disabled={operation !== null || !newEmail.trim()}>
                {operation === "email" ? t("common.accountSecurity.sending") : t("common.accountSecurity.requestEmailChange")}
              </Button>
            </form>
          </DataCard>

          <DataCard
            title={t("common.accountSecurity.passwordTitle")}
            description={t("common.accountSecurity.passwordDescription")}
          >
            <form onSubmit={(event) => void handlePasswordSubmit(event)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t("common.accountSecurity.newPassword")}</Label>
                <Input id="new-password" type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t("common.accountSecurity.confirmPassword")}</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p role="alert" className="text-sm text-destructive">{t("common.accountSecurity.passwordMismatch")}</p>
                )}
              </div>
              <Button type="submit" disabled={operation !== null || newPassword.length < 6 || newPassword !== confirmPassword}>
                <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
                {operation === "password" ? t("common.accountSecurity.saving") : t("common.accountSecurity.changePassword")}
              </Button>
            </form>
          </DataCard>

          <DataCard
            title={t("common.accountSecurity.totpTitle")}
            description={t("common.accountSecurity.totpDescription")}
          >
            {status.mfaFactors.length ? (
              <ul className="mb-4 space-y-3">
                {status.mfaFactors.map((factor) => (
                  <li key={factor.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium">{factor.friendlyName || t("common.accountSecurity.authenticator")}</p>
                        <p className="text-xs text-muted-foreground">
                          {factor.status === "verified" ? t("common.accountSecurity.factorVerified") : t("common.accountSecurity.factorPending")}
                        </p>
                      </div>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => setRemoveFactor(factor)} disabled={operation !== null}>
                      {t("common.accountSecurity.removeFactor")}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{t("common.accountSecurity.noFactors")}</p>
            )}

            {enrollment ? (
              <div className="space-y-4 rounded-lg border border-border p-4">
                <p className="text-sm font-medium">{t("common.accountSecurity.scanQr")}</p>
                {qrCodeSrc && <img src={qrCodeSrc} alt={t("common.accountSecurity.qrAlt")} className="mx-auto h-44 w-44 rounded-md bg-white p-2" />}
                <p className="text-sm text-muted-foreground">{t("common.accountSecurity.manualSecret")}</p>
                <code className="block break-all rounded-md bg-muted p-3 text-sm" data-testid="totp-secret">{enrollment.secret}</code>
                <form onSubmit={(event) => void handleVerifyTotp(event)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totp-code">{t("common.accountSecurity.verificationCode")}</Label>
                    <Input id="totp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
                  </div>
                  <Button type="submit" disabled={operation !== null || totpCode.length !== 6}>
                    {operation === "verify" ? t("common.accountSecurity.verifying") : t("common.accountSecurity.verifyAndEnable")}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => void handleCancelEnrollment()} disabled={operation !== null}>
                    {t("common.cancel")}
                  </Button>
                </form>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => void handleStartTotp()} disabled={operation !== null}>
                <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                {operation === "enroll" ? t("common.accountSecurity.starting") : t("common.accountSecurity.enableTotp")}
              </Button>
            )}
          </DataCard>

          <DataCard
            title={t("common.accountSecurity.sessionsTitle")}
            description={t("common.accountSecurity.sessionsDescription")}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <UsersRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>{t("common.accountSecurity.sessionsExplanation")}</p>
              </div>
              <Button type="button" variant="destructive" onClick={() => setConfirmSignOutOthers(true)} disabled={!status.signOutOtherSessionsAvailable || operation !== null}>
                {operation === "sessions" ? t("common.accountSecurity.endingSessions") : t("common.accountSecurity.signOutOthers")}
              </Button>
            </div>
          </DataCard>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(removeFactor)}
        onOpenChange={(open) => { if (!open) setRemoveFactor(null); }}
        title={t("common.accountSecurity.removeFactorTitle")}
        description={t("common.accountSecurity.removeFactorDescription")}
        confirmLabel={t("common.accountSecurity.removeFactor")}
        cancelLabel={t("common.cancel")}
        tone="destructive"
        loading={operation === "remove"}
        onConfirm={handleRemoveTotp}
      />
      <ConfirmDialog
        open={confirmSignOutOthers}
        onOpenChange={setConfirmSignOutOthers}
        title={t("common.accountSecurity.sessionsConfirmTitle")}
        description={t("common.accountSecurity.sessionsConfirmDescription")}
        confirmLabel={t("common.accountSecurity.signOutOthers")}
        cancelLabel={t("common.cancel")}
        tone="warning"
        loading={operation === "sessions"}
        onConfirm={handleSignOutOthers}
      />
    </PageContainer>
  );
}
