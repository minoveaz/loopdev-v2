import { Check, ChevronRight, CreditCard, Globe, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MobileBottomSheet } from "./MobileBottomSheet";
import { MobileConfirmDialog } from "./MobileModal";
import { mobileAuthAdapter, mobileTenantContextAdapter } from "../adapters/auth";
import type { AuthSession, Organization, TenantContextSnapshot } from "../../../packages/contracts/src/auth-port";
import { accountDestinations } from "../../../packages/contracts/src/account-navigation";
import { useMobileI18n } from "../i18n";
import { mobileTheme } from "../theme/tokens";

type MobileAccountSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSwitchOrg?: (orgName: string) => void;
  onNavigate?: (path: string) => void;
};

export function MobileAccountSheet({ visible, onClose, onSwitchOrg, onNavigate }: MobileAccountSheetProps) {
  const { t } = useMobileI18n();
  const [context, setContext] = useState<TenantContextSnapshot | null>(() =>
    mobileTenantContextAdapter.getTenantContext(),
  );
  const [session, setSession] = useState<AuthSession | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    void mobileAuthAdapter.getSession().then(setSession).catch((error: unknown) => {
      setAuthError(error instanceof Error ? error.message : "Unable to load the authentication session.");
    });
    const unsubAuth = mobileAuthAdapter.onAuthStateChange((_, s) => setSession(s));
    const unsubTenant = mobileTenantContextAdapter.onTenantContextChange((next) => {
      setContext(next);
      void mobileTenantContextAdapter.listOrganizations().then((res) => {
        if (res.success === true) {
          setOrgs(res.data);
          setAuthError(null);
        } else {
          setAuthError(res.error.message);
        }
      });
    });
    void mobileTenantContextAdapter.listOrganizations().then((res) => {
      if (res.success === true) {
        setOrgs(res.data);
        setAuthError(null);
      } else {
        setAuthError(res.error.message);
      }
    });
    return () => {
      unsubAuth();
      unsubTenant();
    };
  }, []);

  const handleSelectOrg = async (orgId: string, orgName: string) => {
    if (orgId === activeOrgId) {
      onClose();
      return;
    }
    const result = await mobileTenantContextAdapter.selectOrganization(orgId);
    if (result.success === false) {
      setAuthError(result.error.message);
      return;
    }
    setAuthError(null);
    if (onSwitchOrg) {
      onSwitchOrg(orgName);
    } else {
      onClose();
    }
  };

  const handleExecuteSignOut = async () => {
    const result = await mobileAuthAdapter.signOut();
    setConfirmSignOut(false);
    if (result.success === false) {
      setAuthError(result.error.message);
      return;
    }
    setAuthError(null);
    onClose();
  };

  const activeOrgId = context?.activeOrganizationId ?? orgs[0]?.id;
  const userName = session?.user.fullName || session?.user.email?.split("@")[0] || t("common.user");
  const userEmail = session?.user.email || "user@loopdev.com";
  const initials = (session?.user.fullName ? session.user.fullName.split(" ").map((p: string) => p[0]).join("") : userName.slice(0, 2)).toUpperCase().slice(0, 2);

  const menuItems = [
    { label: t("common.profile"), icon: UserRound, path: accountDestinations.profile.path },
    { label: t("common.accountSettings"), icon: Settings, path: accountDestinations.settings.path },
    { label: t("common.security"), icon: ShieldCheck, path: accountDestinations.security.path },
    {
      label: t("common.billing"),
      icon: CreditCard,
      path: accountDestinations.billing.enabled ? accountDestinations.billing.path : undefined,
      disabled: !accountDestinations.billing.enabled,
    },
  ];

  return (
    <MobileBottomSheet onClose={onClose} title={t("common.account")} visible={visible}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "AD"}</Text>
        </View>
        {authError && (
          <Text accessibilityRole="alert" style={styles.authError}>
            {authError}
          </Text>
        )}
        <View style={styles.profileMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{userName}</Text>
            {context?.isSuperAdmin && (
              <View style={styles.superBadge}>
                <Text style={styles.superBadgeText}>
                  {t("common.superAdmin")}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      {/* Organization Switcher inside Mobile Account Sheet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t("common.switchOrganization")}
        </Text>
        <View style={styles.orgList}>
          {orgs.map((org) => {
            const isActive = org.id === activeOrgId;
            return (
              <Pressable
                key={org.id}
                onPress={() => handleSelectOrg(org.id, org.name)}
                style={[styles.orgCard, isActive && styles.activeOrgCard]}
              >
                <View style={styles.orgIcon}>
                  <Text style={styles.orgIconText}>{org.name.slice(0, 1)}</Text>
                </View>
                <View style={styles.orgInfo}>
                  <Text style={[styles.orgName, isActive && styles.activeOrgName]}>{org.name}</Text>
                  <Text style={styles.orgDetail}>
                    {isActive
                      ? t("common.activeOrganization")
                      : t("common.tapToSwitch")}
                  </Text>
                </View>
                {isActive ? (
                  <View style={styles.activeCheck}>
                    <Check color={mobileTheme.colors.textInverse} size={14} strokeWidth={3} />
                  </View>
                ) : (
                  <ChevronRight color={mobileTheme.colors.textSubtle} size={18} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.items}>
        {menuItems.map(({ label, icon: Icon, path, disabled = false }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => {
              if (disabled) return;
              if (path) onNavigate?.(path);
              onClose();
            }}
            style={[styles.item, disabled && styles.disabledItem]}
          >
            <Icon
              color={disabled ? mobileTheme.colors.textSubtle : mobileTheme.colors.textHeading}
              size={22}
              strokeWidth={2}
            />
            <Text style={[styles.itemLabel, disabled && styles.disabledItemLabel]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.separator} />

      <Pressable onPress={() => setConfirmSignOut(true)} style={styles.item}>
        <LogOut color={mobileTheme.colors.destructive} size={22} strokeWidth={2} />
        <Text style={styles.signOut}>{t("common.signOut")}</Text>
      </Pressable>

      <MobileConfirmDialog
        visible={confirmSignOut}
        title={t("common.signOutTitle")}
        description={t("common.signOutDescription")}
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.signOut")}
        destructive
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={handleExecuteSignOut}
      />
    </MobileBottomSheet>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: mobileTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: mobileTheme.colors.textInverse,
    fontSize: 16,
    fontWeight: "700",
  },
  profileMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: { color: mobileTheme.colors.textHeading, fontSize: 18, fontWeight: "800" },
  superBadge: {
    backgroundColor: mobileTheme.colors.primarySoft,
    borderColor: mobileTheme.colors.primaryBorder,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  superBadgeText: {
    color: mobileTheme.colors.primary,
    fontSize: 9,
    fontWeight: "800",
  },
  email: { color: mobileTheme.colors.textMuted, fontSize: 13, marginTop: 2 },
  separator: { backgroundColor: mobileTheme.colors.border, height: 1, marginVertical: 14 },
  section: {
    marginVertical: 4,
  },
  sectionTitle: {
    color: mobileTheme.colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  orgList: {
    gap: 6,
  },
  orgCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
  },
  activeOrgCard: {
    borderColor: mobileTheme.colors.primary,
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  orgIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: mobileTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  orgIconText: {
    color: mobileTheme.colors.textInverse,
    fontSize: 12,
    fontWeight: "700",
  },
  orgInfo: {
    flex: 1,
    marginLeft: 10,
  },
  orgName: {
    color: mobileTheme.colors.textHeading,
    fontSize: 14,
    fontWeight: "600",
  },
  activeOrgName: {
    color: mobileTheme.colors.primary,
    fontWeight: "700",
  },
  orgDetail: {
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
  },
  activeCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  orgArrow: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 16,
  },
  items: { gap: 2 },
  item: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 46,
    paddingVertical: 4,
  },
  disabledItem: { opacity: 0.55 },
  itemLabel: { color: mobileTheme.colors.textHeading, fontSize: 16, marginLeft: 16 },
  disabledItemLabel: { color: mobileTheme.colors.textSubtle },
  signOut: { color: mobileTheme.colors.destructive, fontSize: 16, marginLeft: 16, fontWeight: "600" },
  authError: {
    color: mobileTheme.colors.danger,
    fontSize: 13,
    marginTop: 10,
  },
});
