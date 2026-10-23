import { ChevronRight } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMobileI18n } from "../i18n";
import { accountDestinations } from "../../../packages/contracts/src/account-navigation";
import { mobileTheme } from "../theme/tokens";

export function MobileAccountScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { lang } = useMobileI18n();
  const isEs = lang === "es";

  return (
    <ScrollView contentContainerStyle={styles.accountContent}>
      <Text style={styles.accountEyebrow}>{isEs ? "MÁS" : "MORE"}</Text>
      <Text style={styles.accountTitle}>{isEs ? "Espacio de trabajo y cuenta" : "Workspace & account"}</Text>
      <Text style={styles.accountDescription}>
        {isEs
          ? "Gestiona tu experiencia en LoopDev, recursos y preferencias."
          : "Manage your LoopDev experience, resources, and preferences."}
      </Text>
      <View style={styles.accountCard}>
        <AccountRow
          label={isEs ? "Perfil" : "Profile"}
          detail={isEs ? "Tu información personal y datos de cuenta" : "Your personal information and account"}
          onPress={() => onNavigate(accountDestinations.profile.path)}
        />
        <AccountRow
          label={isEs ? "Preferencias" : "Preferences"}
          detail={isEs ? "Tema y apariencia de la aplicación" : "Theme and app appearance"}
          onPress={() => onNavigate(accountDestinations.settings.path)}
        />
        <AccountRow
          label={isEs ? "Documentación" : "Documentation"}
          detail={isEs ? "Guías de productos y referencia de la plataforma" : "Product guides and platform reference"}
        />
        <AccountRow
          label={isEs ? "Novedades" : "Changelog"}
          detail={isEs ? "Nuevas funcionalidades y cambios en LoopDev" : "What is new in LoopDev"}
        />
        <AccountRow
          label={isEs ? "Soporte" : "Support"}
          detail={isEs ? "Obtén ayuda del equipo de LoopDev" : "Get help from the LoopDev team"}
        />
      </View>
      <View style={styles.systemCard}>
        <View style={styles.systemCardHeader}>
          <View style={styles.systemNormalDot} />
          <Text style={styles.systemNormalText}>
            {isEs ? "TODOS LOS SISTEMAS OPERATIVOS" : "ALL SYSTEMS NORMAL"}
          </Text>
        </View>
        <Text style={styles.systemCardDetail}>
          {isEs ? "Los servicios de LoopDev están operando con normalidad." : "LoopDev services are operating normally."}
        </Text>
      </View>
      <View style={styles.aboutCard}>
        <Text style={styles.aboutName}>Loopdev</Text>
        <Text style={styles.aboutVersion}>v0.0.1 · © 2026 LoopDev</Text>
      </View>
    </ScrollView>
  );
}

function AccountRow({ label, detail, onPress }: { label: string; detail: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.accountRow}>
      <View style={styles.accountRowCopy}>
        <Text style={styles.accountRowLabel}>{label}</Text>
        <Text style={styles.accountRowDetail}>{detail}</Text>
      </View>
      <ChevronRight size={18} color={mobileTheme.colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  accountContent: { paddingBottom: 40, paddingHorizontal: 22, paddingTop: 30 },
  accountEyebrow: { color: mobileTheme.colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 12, marginTop: 30 },
  accountTitle: { color: mobileTheme.colors.textHeading, fontSize: 32, fontWeight: "800", letterSpacing: -0.8, marginBottom: 12 },
  accountDescription: { color: mobileTheme.colors.textMuted, fontSize: 16, lineHeight: 24, marginBottom: 28 },
  accountCard: { backgroundColor: mobileTheme.colors.surface, borderColor: mobileTheme.colors.border, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  accountRow: { alignItems: "center", borderBottomColor: mobileTheme.colors.border, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 17, paddingVertical: 16 },
  accountRowCopy: { flex: 1, paddingRight: 12 },
  accountRowLabel: { color: mobileTheme.colors.textHeading, fontSize: 15, fontWeight: "700", marginBottom: 4 },
  accountRowDetail: { color: mobileTheme.colors.textMuted, fontSize: 12, lineHeight: 18 },
  accountRowArrow: { color: mobileTheme.colors.primary, fontSize: 18, fontWeight: "700" },
  systemCard: { backgroundColor: mobileTheme.colors.primarySoft, borderRadius: 16, marginTop: 18, padding: 17 },
  systemCardHeader: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 8 },
  systemNormalDot: { backgroundColor: mobileTheme.colors.success, borderRadius: 4, height: 8, width: 8 },
  systemNormalText: { color: mobileTheme.colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  systemCardDetail: { color: mobileTheme.colors.textMuted, fontSize: 12 },
  aboutCard: { alignItems: "center", paddingTop: 28 },
  aboutName: { color: mobileTheme.colors.textHeading, fontSize: 15, fontWeight: "800", letterSpacing: 1.2, marginBottom: 6 },
  aboutVersion: { color: mobileTheme.colors.textSubtle, fontFamily: "monospace", fontSize: 10 },
});
