import { useCallback, useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { Camera, Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog, DataCard, PageContainer, PageHeader } from "@/components/common";
import { getInitials } from "@/lib/formatters";
import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import { supabaseProfileAvatarAdapter } from "@/loopdev/domains/platform/adapter/profile-avatar";
import { isPlatformAvatarReference } from "../../../../packages/contracts/src/account-profile";
import type { AuthErrorCode, PlatformUser } from "../../../../packages/contracts/src/auth-port";
import type { ProfileAvatarOperationResult } from "../../../../packages/contracts/src/profile-avatar-adapter";

type Operation = "name" | "avatar" | "remove-avatar" | null;

function mutationId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `profile-${Date.now()}`;
}

function exceptionMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

function authErrorMessage(code: AuthErrorCode, message: string, t: ReturnType<typeof useI18n>["t"]): string {
  switch (code) {
    case "AUTH_SESSION_EXPIRED":
      return t("common.accountSecurity.sessionExpired");
    case "AUTH_OPERATION_UNSUPPORTED":
      return t("common.accountSecurity.providerUnavailable");
    case "AUTH_REAUTH_REQUIRED":
      return t("common.accountSecurity.reauthRequired");
    default:
      return message;
  }
}

function avatarErrorMessage(
  error: Extract<ProfileAvatarOperationResult, { success: false }>["error"],
  t: ReturnType<typeof useI18n>["t"],
): { message: string; authCode?: AuthErrorCode } {
  if (error.code === "AUTH_UPDATE_FAILED") {
    return {
      message: authErrorMessage(error.authErrorCode, error.message, t),
      authCode: error.authErrorCode,
    };
  }
  return { message: error.message };
}

export default function Profile() {
  const { t } = useI18n();
  const { trail } = useBreadcrumbs();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [operation, setOperation] = useState<Operation>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPreviewError, setAvatarPreviewError] = useState<string | null>(null);
  const [avatarPreviewLoading, setAvatarPreviewLoading] = useState(false);
  const [confirmRemoveAvatar, setConfirmRemoveAvatar] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    setLoadError(null);
    setError(null);
    setNotice(null);
    setWarning(null);
    setConflict(false);
    try {
      const session = await defaultWebAuthAdapter.getSession();
      if (!session) {
        setUser(null);
        setFullName("");
        setForbidden(true);
        return;
      }
      setUser(session.user);
      setFullName(session.user.fullName);
    } catch (cause) {
      setUser(null);
      setLoadError(exceptionMessage(cause, t("common.accountProfile.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const reference = user?.avatarUrl;
    if (!reference) {
      setAvatarPreview(null);
      setAvatarPreviewError(null);
      setAvatarPreviewLoading(false);
      return;
    }
    if (!isPlatformAvatarReference(reference)) {
      setAvatarPreview(null);
      setAvatarPreviewError(t("common.accountProfile.previewError"));
      setAvatarPreviewLoading(false);
      return;
    }

    let active = true;
    setAvatarPreview(null);
    setAvatarPreviewError(null);
    setAvatarPreviewLoading(true);
    void supabaseProfileAvatarAdapter.getPreview(reference).then((result) => {
      if (!active) return;
      if (result.success === true) {
        setAvatarPreview(result.data.url);
      } else {
        setAvatarPreviewError(result.error.message);
      }
    }).catch((cause: unknown) => {
      if (active) setAvatarPreviewError(exceptionMessage(cause, t("common.accountProfile.previewError")));
    }).finally(() => {
      if (active) setAvatarPreviewLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user?.avatarUrl, t]);

  const handleNameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || operation) return;
    const normalizedName = fullName.trim();
    if (!normalizedName || normalizedName.length > 120) {
      setNameError(t("common.accountProfile.nameRequired"));
      return;
    }
    if (normalizedName === user.fullName) return;

    setOperation("name");
    setError(null);
    setNotice(null);
    setWarning(null);
    setConflict(false);
    setNameError(null);
    try {
      const result = await defaultWebAuthAdapter.updateProfile({
        fullName: normalizedName,
        expectedUserUpdatedAt: user.updatedAt,
        mutationId: mutationId(),
      });
      if (result.success === false) {
        setError(authErrorMessage(result.error.code, result.error.message, t));
        setConflict(result.error.code === "AUTH_VERSION_CONFLICT");
        return;
      }
      setUser(result.data);
      setFullName(result.data.fullName);
      setNotice(t("common.accountProfile.saved"));
    } catch (cause) {
      setError(exceptionMessage(cause, t("common.accountProfile.saveError")));
    } finally {
      setOperation(null);
    }
  };

  const updateAvatar = async (file: File) => {
    if (!user || operation) return;
    setOperation("avatar");
    setError(null);
    setNotice(null);
    setWarning(null);
    setConflict(false);
    try {
      const result = await supabaseProfileAvatarAdapter.updateAvatar({
        fileName: file.name,
        mediaType: file.type,
        content: file,
        mutationId: mutationId(),
        expectedUserUpdatedAt: user.updatedAt,
        previousAvatarReference: user.avatarUrl,
      });
      if (result.success === false) {
        const failure = avatarErrorMessage(result.error, t);
        setError(failure.message);
        setConflict(failure.authCode === "AUTH_VERSION_CONFLICT");
        if (result.error.code === "AUTH_UPDATE_FAILED" && result.error.cleanupError) {
          setWarning(result.error.cleanupError.message);
        }
        return;
      }
      setUser(result.data.user);
      setFullName(result.data.user.fullName);
      if (result.data.cleanup.previousAvatar?.success === false) {
        setWarning(`${t("common.accountProfile.cleanupWarning")} ${result.data.cleanup.previousAvatar.error.message}`);
      } else {
        setNotice(t("common.accountProfile.avatarUpdated"));
      }
    } catch (cause) {
      setError(exceptionMessage(cause, t("common.accountProfile.saveError")));
    } finally {
      setOperation(null);
    }
  };

  const handleAvatarSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) void updateAvatar(file);
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatarUrl || !isPlatformAvatarReference(user.avatarUrl) || operation) return;
    setOperation("remove-avatar");
    setError(null);
    setNotice(null);
    setWarning(null);
    setConflict(false);
    try {
      const result = await supabaseProfileAvatarAdapter.removeAvatar({
        mutationId: mutationId(),
        expectedUserUpdatedAt: user.updatedAt,
        previousAvatarReference: user.avatarUrl,
      });
      if (result.success === false) {
        const failure = avatarErrorMessage(result.error, t);
        setError(failure.message);
        setConflict(failure.authCode === "AUTH_VERSION_CONFLICT");
        return;
      }
      setUser(result.data.user);
      setFullName(result.data.user.fullName);
      if (result.data.cleanup.previousAvatar?.success === false) {
        setWarning(`${t("common.accountProfile.cleanupWarning")} ${result.data.cleanup.previousAvatar.error.message}`);
      } else {
        setNotice(t("common.accountProfile.avatarRemoved"));
      }
      setConfirmRemoveAvatar(false);
    } catch (cause) {
      setError(exceptionMessage(cause, t("common.accountProfile.saveError")));
    } finally {
      setOperation(null);
    }
  };

  const handleRetry = () => {
    setAvatarPreviewError(null);
    void loadProfile();
  };

  const hasAvatar = Boolean(user?.avatarUrl && isPlatformAvatarReference(user.avatarUrl));
  const nameIsDirty = Boolean(user && fullName.trim() !== user.fullName);

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow={t("common.account")}
        title={t("common.accountProfile.title")}
        description={t("common.accountProfile.description")}
        breadcrumbs={trail.length ? trail : [{ label: t("common.account") }, { label: t("common.profile") }]}
      />

      {loading ? (
        <div role="status" aria-live="polite" className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {t("common.accountProfile.loading")}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="font-medium text-foreground">{t("common.accountProfile.loadError")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
          <Button className="mt-4 min-h-11 sm:min-h-9" variant="outline" onClick={handleRetry}>{t("common.retry")}</Button>
        </div>
      ) : forbidden ? (
        <div role="alert" className="rounded-xl border border-border bg-card p-6">
          <p className="font-medium text-foreground">{t("common.accountProfile.signInRequired")}</p>
          <Button asChild className="mt-4 min-h-11 sm:min-h-9">
            <Link to="/pages/login">{t("common.accountProfile.signIn")}</Link>
          </Button>
        </div>
      ) : user ? (
        <div className="space-y-5">
          {error && (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
              {notice}
            </div>
          )}
          {warning && (
            <div role="status" className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
              {warning}
            </div>
          )}
          {conflict && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
              <span>{t("common.accountProfile.conflict")}</span>
              <Button variant="outline" size="sm" className="min-h-11 sm:min-h-8" onClick={handleRetry} disabled={operation !== null}>
                <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
                {t("common.accountProfile.reload")}
              </Button>
            </div>
          )}

          <DataCard
            title={t("common.accountProfile.personalTitle")}
            description={t("common.accountProfile.personalDescription")}
          >
            <div className="mb-6 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-center">
              <div className="relative">
                <Avatar className="h-20 w-20 border border-border">
                  {avatarPreview && <AvatarImage src={avatarPreview} alt={t("common.accountProfile.avatarAlt", { name: user.fullName })} />}
                  <AvatarFallback className="bg-gradient-primary text-lg font-semibold text-primary-foreground">
                    {getInitials(user.fullName || "U")}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  aria-label={t("common.accountProfile.changeAvatar")}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={operation !== null}
                  className="absolute -bottom-1 -end-1 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
                >
                  {operation === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-label={t("common.accountProfile.changeAvatar")}
                  onChange={handleAvatarSelected}
                  disabled={operation !== null}
                  tabIndex={-1}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-foreground">{user.fullName || t("common.accountProfile.nameEmpty")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                <p className="mt-2 text-xs text-muted-foreground">{t("common.accountProfile.avatarHelp")}</p>
                {avatarPreviewLoading && <p role="status" className="mt-1 text-xs text-muted-foreground">{t("common.accountProfile.previewLoading")}</p>}
                {avatarPreviewError && <p role="status" className="mt-1 text-xs text-warning-foreground">{avatarPreviewError}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="min-h-11 sm:min-h-8" onClick={() => fileInputRef.current?.click()} disabled={operation !== null}>
                    {operation === "avatar" ? t("common.accountProfile.uploading") : t("common.accountProfile.changeAvatar")}
                  </Button>
                  {hasAvatar && (
                    <Button type="button" variant="ghost" size="sm" className="min-h-11 sm:min-h-8" onClick={() => setConfirmRemoveAvatar(true)} disabled={operation !== null}>
                      <Trash2 className="me-2 h-4 w-4" aria-hidden="true" />
                      {t("common.accountProfile.removeAvatar")}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={(event) => void handleNameSubmit(event)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="profile-full-name">{t("common.accountProfile.fullName")}</Label>
                <Input
                  id="profile-full-name"
                  autoComplete="name"
                  maxLength={120}
                  className="h-11"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setNameError(null);
                  }}
                  placeholder={t("common.accountProfile.namePlaceholder")}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? "profile-name-error" : undefined}
                  required
                />
                {nameError && <p id="profile-name-error" role="alert" className="text-sm text-destructive">{nameError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">{t("common.accountProfile.email")}</Label>
                <Input id="profile-email" type="email" className="h-11" value={user.email} readOnly aria-readonly="true" />
                <p className="text-xs text-muted-foreground">{t("common.accountProfile.emailHelp")}</p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="min-h-11 sm:min-h-9" disabled={operation !== null || !nameIsDirty}>
                  {operation === "name" ? <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="me-2 h-4 w-4" aria-hidden="true" />}
                  {operation === "name" ? t("common.accountProfile.saving") : t("common.accountProfile.save")}
                </Button>
              </div>
            </form>
          </DataCard>
        </div>
      ) : (
        <div role="alert" className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {t("common.accountProfile.empty")}
        </div>
      )}

      <ConfirmDialog
        open={confirmRemoveAvatar}
        onOpenChange={setConfirmRemoveAvatar}
        title={t("common.accountProfile.removeAvatarTitle")}
        description={t("common.accountProfile.removeAvatarDescription")}
        confirmLabel={t("common.accountProfile.removeAvatar")}
        cancelLabel={t("common.cancel")}
        tone="destructive"
        cancelClassName="min-h-11 sm:min-h-9"
        confirmClassName="min-h-11 sm:min-h-9"
        loading={operation === "remove-avatar"}
        onConfirm={handleRemoveAvatar}
      />
    </PageContainer>
  );
}
