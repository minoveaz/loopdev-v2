import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { AuthErrorCode, AuthSession, PlatformUser } from "../../../packages/contracts/src/auth-port";
import { isPlatformAvatarReference } from "../../../packages/contracts/src/account-profile";
import { PROFILE_AVATAR_MAX_BYTES } from "../../../packages/contracts/src/private-user-files";
import { mobileProfileImagePicker } from "../adapters/profile-image-picker";
import type { ProfileImageAsset } from "../adapters/profile-image-picker";
import { mobileProfileAvatarAdapter } from "../adapters/profile-avatar";
import { mobileAuthAdapter } from "../adapters/auth";
import { useMobileI18n } from "../i18n";
import { mobileTheme } from "../theme/tokens";
import {
  MobileAvatar,
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

type Operation = "name" | "avatar" | "remove-avatar" | null;

function mutationId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `profile-${Date.now()}`;
}

function imageExtension(mediaType: string): string | null {
  switch (mediaType.toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

function authErrorMessage(code: AuthErrorCode, message: string, t: (key: string) => string): string {
  if (code === "AUTH_VERSION_CONFLICT") return t("common.accountProfile.conflict");
  if (code === "AUTH_SESSION_EXPIRED") return t("common.accountSecurity.sessionExpired");
  return message;
}

export function MobileProfileScreen({ onBack }: { onBack: () => void }) {
  const { t } = useMobileI18n();
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [preview, setPreview] = useState<{ userId: string; url: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirmRemoveAvatar, setConfirmRemoveAvatar] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    setLoadError(null);
    setError(null);
    setNotice(null);
    setWarning(null);
    setNameError(null);
    try {
      const session = await mobileAuthAdapter.getSession();
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
      setLoadError(cause instanceof Error ? cause.message : t("common.accountProfile.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => mobileAuthAdapter.onAuthStateChange((_event, session: AuthSession | null) => {
    setPreview(null);
    setPreviewError(null);
    if (!session) {
      setUser(null);
      setFullName("");
      setForbidden(true);
      setError(null);
      setNotice(null);
      setWarning(null);
      return;
    }
    setUser(session.user);
    setFullName(session.user.fullName);
    setForbidden(false);
  }), []);

  useEffect(() => {
    const avatarReference = user?.avatarUrl;
    const userId = user?.id;
    setPreview(null);
    setPreviewError(null);
    if (!avatarReference || !userId) {
      setPreviewLoading(false);
      return;
    }
    if (!isPlatformAvatarReference(avatarReference)) {
      setPreviewError(t("common.accountProfile.previewError"));
      setPreviewLoading(false);
      return;
    }

    let active = true;
    setPreviewLoading(true);
    void mobileProfileAvatarAdapter.getPreview(avatarReference).then((result) => {
      if (!active) return;
      if (result.success === false) {
        setPreviewError(result.error.message);
      } else {
        setPreview({ userId, url: result.data.url });
      }
    }).catch((cause: unknown) => {
      if (active) {
        setPreviewError(cause instanceof Error ? cause.message : t("common.accountProfile.previewError"));
      }
    }).finally(() => {
      if (active) setPreviewLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user?.id, user?.avatarUrl, t]);

  const handleNameSave = async () => {
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
    setNameError(null);
    try {
      const result = await mobileAuthAdapter.updateProfile({
        fullName: normalizedName,
        expectedUserUpdatedAt: user.updatedAt,
        mutationId: mutationId(),
      });
      if (result.success === false) {
        setError(authErrorMessage(result.error.code, result.error.message, t));
        return;
      }
      setUser(result.data);
      setFullName(result.data.fullName);
      setNotice(t("common.accountProfile.saved"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.accountProfile.saveError"));
    } finally {
      setOperation(null);
    }
  };

  const uploadAvatar = async (asset: ProfileImageAsset) => {
    if (!user || operation) return;
    setOperation("avatar");
    setError(null);
    setNotice(null);
    setWarning(null);
    try {
      if (asset.fileSize !== undefined && asset.fileSize > PROFILE_AVATAR_MAX_BYTES) {
        throw new Error(t("common.accountProfile.avatarHelp"));
      }
      const content = asset.file ?? await (await fetch(asset.uri)).blob();
      const mediaType = asset.mimeType?.toLowerCase() || content.type.toLowerCase();
      const extension = imageExtension(mediaType);
      if (!extension) throw new Error(t("common.accountProfile.avatarHelp"));
      if (content.size > PROFILE_AVATAR_MAX_BYTES) throw new Error(t("common.accountProfile.avatarHelp"));

      const result = await mobileProfileAvatarAdapter.updateAvatar({
        fileName: asset.fileName?.trim() || `profile-avatar.${extension}`,
        mediaType,
        content,
        mutationId: mutationId(),
        expectedUserUpdatedAt: user.updatedAt,
        previousAvatarReference: user.avatarUrl,
      });
      if (result.success === false) {
        if (result.error.code === "AUTH_UPDATE_FAILED") {
          setError(authErrorMessage(result.error.authErrorCode, result.error.message, t));
          if (result.error.cleanupError) setWarning(result.error.cleanupError.message);
        } else {
          setError(result.error.message);
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
      setError(cause instanceof Error ? cause.message : t("common.accountProfile.saveError"));
    } finally {
      setOperation(null);
    }
  };

  const handleAvatarPick = async () => {
    if (!user || operation) return;
    setOperation("avatar");
    setError(null);
    setNotice(null);
    try {
      const asset = await mobileProfileImagePicker.pickImage();
      if (asset) {
        setOperation(null);
        await uploadAvatar(asset);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.accountProfile.saveError"));
    } finally {
      setOperation(null);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user?.avatarUrl || !isPlatformAvatarReference(user.avatarUrl) || operation) return;
    setOperation("remove-avatar");
    setError(null);
    setNotice(null);
    setWarning(null);
    try {
      const result = await mobileProfileAvatarAdapter.removeAvatar({
        mutationId: mutationId(),
        expectedUserUpdatedAt: user.updatedAt,
        previousAvatarReference: user.avatarUrl,
      });
      if (result.success === false) {
        if (result.error.code === "AUTH_UPDATE_FAILED") {
          setError(authErrorMessage(result.error.authErrorCode, result.error.message, t));
        } else {
          setError(result.error.message);
        }
        return;
      }
      setUser(result.data.user);
      setFullName(result.data.user.fullName);
      if (result.data.cleanup.previousAvatar?.success === false) {
        setWarning(`${t("common.accountProfile.cleanupWarning")} ${result.data.cleanup.previousAvatar.error.message}`);
      } else {
        setNotice(t("common.accountProfile.avatarRemoved"));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.accountProfile.saveError"));
    } finally {
      setConfirmRemoveAvatar(false);
      setOperation(null);
    }
  };

  const imageUri = preview && preview.userId === user?.id ? preview.url : null;
  const privateAvatar = Boolean(user?.avatarUrl && isPlatformAvatarReference(user.avatarUrl));

  return (
    <MobilePageContainer contentContainerStyle={styles.content}>
      <MobilePageHeader
        eyebrow={t("common.account")}
        title={t("common.accountProfile.title")}
        subtitle={t("common.accountProfile.description")}
        onBack={onBack}
        backLabel={t("common.back")}
      />

      {loading ? <MobileLoadingState message={t("common.accountProfile.loading")} /> : null}
      {!loading && loadError ? (
        <View>
          <Text accessibilityRole="alert" style={styles.error}>{loadError}</Text>
          <MobileButton label={t("common.retry")} onPress={() => void loadProfile()} variant="outline" />
        </View>
      ) : null}
      {!loading && forbidden ? (
        <Text accessibilityRole="alert" style={styles.muted}>{t("common.accountProfile.signInRequired")}</Text>
      ) : null}
      {!loading && !loadError && !forbidden && user ? (
        <>
          <MobileCard style={styles.card}>
            <MobileCardHeader
              title={t("common.accountProfile.personalTitle")}
              subtitle={t("common.accountProfile.personalDescription")}
            />
            <MobileCardBody>
              <View style={styles.avatarRow}>
                <View
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={t("common.accountProfile.avatarAlt", { name: user.fullName })}
                  style={styles.avatar}
                >
                  <MobileAvatar
                    name={user.fullName}
                    imageUri={imageUri}
                    size="lg"
                    style={styles.avatarPrimitive}
                  />
                </View>
                <View style={styles.avatarActions}>
                  <MobileButton
                    label={operation === "avatar" ? t("common.accountProfile.uploading") : t("common.accountProfile.changeAvatar")}
                    onPress={() => void handleAvatarPick()}
                    loading={operation === "avatar"}
                    disabled={operation !== null}
                    variant="outline"
                  />
                  {privateAvatar ? (
                    <MobileButton
                      label={t("common.accountProfile.removeAvatar")}
                      onPress={() => setConfirmRemoveAvatar(true)}
                      disabled={operation !== null}
                      variant="ghost"
                    />
                  ) : null}
                </View>
              </View>
              <Text style={styles.helper}>{t("common.accountProfile.avatarHelp")}</Text>
              {previewLoading ? <Text style={styles.muted}>{t("common.accountProfile.previewLoading")}</Text> : null}
              {previewError ? <Text accessibilityRole="alert" style={styles.error}>{previewError}</Text> : null}

              <MobileInput
                label={t("common.accountProfile.fullName")}
                accessibilityLabel={t("common.accountProfile.fullName")}
                value={fullName}
                onChangeText={(value) => {
                  setFullName(value);
                  setNameError(null);
                }}
                autoCapitalize="words"
                maxLength={120}
                error={nameError ?? undefined}
              />
              <MobileInput
                label={t("common.accountProfile.email")}
                accessibilityLabel={t("common.accountProfile.email")}
                value={user.email ?? ""}
                editable={false}
                helperText={t("common.accountProfile.emailHelp")}
              />
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
              {warning ? <Text accessibilityRole="alert" style={styles.warning}>{warning}</Text> : null}
              <MobileButton
                label={operation === "name" ? t("common.accountProfile.saving") : t("common.accountProfile.save")}
                onPress={() => void handleNameSave()}
                loading={operation === "name"}
                disabled={operation !== null || fullName.trim() === user.fullName}
                fullWidth
              />
            </MobileCardBody>
          </MobileCard>
          <MobileConfirmDialog
            visible={confirmRemoveAvatar}
            title={t("common.accountProfile.removeAvatarTitle")}
            description={t("common.accountProfile.removeAvatarDescription")}
            cancelLabel={t("common.cancel")}
            confirmLabel={t("common.accountProfile.removeAvatar")}
            destructive
            onCancel={() => setConfirmRemoveAvatar(false)}
            onConfirm={() => void handleAvatarRemove()}
          />
        </>
      ) : null}
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  card: { marginBottom: 8 },
  avatarRow: { alignItems: "center", flexDirection: "row", gap: 16, marginBottom: 8 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarPrimitive: { height: 72, width: 72 },
  avatarActions: { alignItems: "flex-start", flex: 1, gap: 4 },
  helper: { color: mobileTheme.colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 14 },
  muted: { color: mobileTheme.colors.textMuted, fontSize: 13, marginVertical: 8 },
  error: { color: mobileTheme.colors.danger, fontSize: 13, marginBottom: 10 },
  notice: { color: mobileTheme.colors.success, fontSize: 13, marginBottom: 10 },
  warning: { color: mobileTheme.colors.warning, fontSize: 13, marginBottom: 10 },
});
