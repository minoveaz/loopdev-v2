import { Check, ChevronRight, CreditCard, Globe, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MobileBottomSheet } from "./MobileBottomSheet";
import { MobileConfirmDialog } from "./MobileModal";
import { mobileAuthAdapter, mobileTenantContextAdapter } from "../adapters/auth";
import type { AuthSession, Organization, TenantContextSnapshot } from "../../../packages/contracts/src/auth-port";
import { MOBILE_LANGUAGES, useMobileI18n, type MobileLangCode } from "../i18n";

type MobileAccountSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSwitchOrg?: (orgName: string) => void;
};

export function MobileAccountSheet({ visible, onClose, onSwitchOrg }: MobileAccountSheetProps) {
  const { lang, setLang, t } = useMobileI18n();
  const [context, setContext] = useState<TenantContextSnapshot | null>(() =>
    mobileTenantContextAdapter.getTenantContext(),
  );
  const [session, setSession] = useState<AuthSession | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => {
    void mobileAuthAdapter.getSession().then(setSession);
    const unsubAuth = mobileAuthAdapter.onAuthStateChange((_, s) => setSession(s));
    const unsubTenant = mobileTenantContextAdapter.onTenantContextChange((next) => {
      setContext(next);
      void mobileTenantContextAdapter.listOrganizations().then((res) => {
        if (res.success) setOrgs(res.data);
      });
    });
    void mobileTenantContextAdapter.listOrganizations().then((res) => {
      if (res.success) setOrgs(res.data);
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
    await mobileTenantContextAdapter.selectOrganization(orgId);
    if (onSwitchOrg) {
      onSwitchOrg(orgName);
    } else {
      onClose();
    }
  };

  const handleExecuteSignOut = async () => {
    setConfirmSignOut(false);
    onClose();
    await mobileAuthAdapter.signOut();
  };

  const activeOrgId = context?.activeOrganizationId ?? orgs[0]?.id;
  const userName = session?.user.fullName || session?.user.email?.split("@")[0] || t("common.user");
  const userEmail = session?.user.email || "user@loopdev.com";
  const initials = (session?.user.fullName ? session.user.fullName.split(" ").map((p: string) => p[0]).join("") : userName.slice(0, 2)).toUpperCase().slice(0, 2);

  const menuItems = [
    { label: t("common.profile"), icon: UserRound },
    { label: t("common.accountSettings"), icon: Settings },
    { label: t("common.security"), icon: ShieldCheck },
    { label: t("common.billing"), icon: CreditCard },
  ];

  return (
    <MobileBottomSheet onClose={onClose} title={t("common.account")} visible={visible}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "AD"}</Text>
        </View>
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

      {/* Language Switcher Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t("common.interfaceLanguage")}
        </Text>
        <View style={styles.langList}>
          {MOBILE_LANGUAGES.map((item) => {
            const isSelected = item.code === lang;
            return (
              <Pressable
                key={item.code}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setLang(item.code)}
                style={[styles.langCard, isSelected && styles.activeLangCard]}
              >
                <Text style={styles.langFlag}>{item.flag}</Text>
                <Text style={[styles.langName, isSelected && styles.activeLangName]}>{item.label}</Text>
                {isSelected ? (
                  <View style={styles.activeCheck}>
                    <Check color="#ffffff" size={14} strokeWidth={3} />
                  </View>
                ) : (
                  <View style={styles.emptyCheck} />
                )}
              </Pressable>
            );
          })}
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
                    <Check color="#ffffff" size={14} strokeWidth={3} />
                  </View>
                ) : (
                  <ChevronRight color="#94a3b8" size={18} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.items}>
        {menuItems.map(({ label, icon: Icon }) => (
          <Pressable key={label} onPress={onClose} style={styles.item}>
            <Icon color="#1f2937" size={22} strokeWidth={2} />
            <Text style={styles.itemLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.separator} />

      <Pressable onPress={() => setConfirmSignOut(true)} style={styles.item}>
        <LogOut color="#ef334e" size={22} strokeWidth={2} />
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
    backgroundColor: "#135bec",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
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
  name: { color: "#111827", fontSize: 18, fontWeight: "800" },
  superBadge: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  superBadgeText: {
    color: "#135bec",
    fontSize: 9,
    fontWeight: "800",
  },
  email: { color: "#64748b", fontSize: 13, marginTop: 2 },
  separator: { backgroundColor: "#e5e7eb", height: 1, marginVertical: 14 },
  section: {
    marginVertical: 4,
  },
  sectionTitle: {
    color: "#135bec",
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
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  activeOrgCard: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  orgIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#135bec",
    alignItems: "center",
    justifyContent: "center",
  },
  orgIconText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  orgInfo: {
    flex: 1,
    marginLeft: 10,
  },
  orgName: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  activeOrgName: {
    color: "#135bec",
    fontWeight: "700",
  },
  orgDetail: {
    color: "#64748b",
    fontSize: 11,
  },
  activeCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#135bec",
    alignItems: "center",
    justifyContent: "center",
  },
  orgArrow: {
    color: "#94a3b8",
    fontSize: 16,
  },
  langList: {
    flexDirection: "row",
    gap: 8,
  },
  langCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    minHeight: 44,
  },
  activeLangCard: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  langFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  langName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  activeLangName: {
    color: "#135bec",
    fontWeight: "700",
  },
  emptyCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
  },
  items: { gap: 2 },
  item: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 46,
    paddingVertical: 4,
  },
  itemLabel: { color: "#1f2937", fontSize: 16, marginLeft: 16 },
  signOut: { color: "#ef334e", fontSize: 16, marginLeft: 16, fontWeight: "600" },
});
