import { ChevronRight } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMobileI18n } from "../i18n";

export function MobileAccountScreen() {
  const { lang, setLang } = useMobileI18n();
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
        />
        <AccountRow
          label={isEs ? "Idioma / Language" : "Language / Idioma"}
          detail={isEs ? "Español (toca para cambiar a English)" : "English (tap to switch to Español)"}
          onPress={() => setLang(isEs ? "en" : "es")}
        />
        <AccountRow
          label={isEs ? "Preferencias" : "Preferences"}
          detail={isEs ? "Tema y apariencia de la aplicación" : "Theme and app appearance"}
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
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.accountRow}>
      <View style={styles.accountRowCopy}>
        <Text style={styles.accountRowLabel}>{label}</Text>
        <Text style={styles.accountRowDetail}>{detail}</Text>
      </View>
      <ChevronRight size={18} color="#94a3b8" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  accountContent: { paddingBottom: 40, paddingHorizontal: 22, paddingTop: 30 },
  accountEyebrow: { color: "#135bec", fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 12, marginTop: 30 },
  accountTitle: { color: "#111827", fontSize: 32, fontWeight: "800", letterSpacing: -0.8, marginBottom: 12 },
  accountDescription: { color: "#64748b", fontSize: 16, lineHeight: 24, marginBottom: 28 },
  accountCard: { backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  accountRow: { alignItems: "center", borderBottomColor: "#e5e7eb", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 17, paddingVertical: 16 },
  accountRowCopy: { flex: 1, paddingRight: 12 },
  accountRowLabel: { color: "#111827", fontSize: 15, fontWeight: "700", marginBottom: 4 },
  accountRowDetail: { color: "#64748b", fontSize: 12, lineHeight: 18 },
  accountRowArrow: { color: "#135bec", fontSize: 18, fontWeight: "700" },
  systemCard: { backgroundColor: "#eff6ff", borderRadius: 16, marginTop: 18, padding: 17 },
  systemCardHeader: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 8 },
  systemNormalDot: { backgroundColor: "#16a34a", borderRadius: 4, height: 8, width: 8 },
  systemNormalText: { color: "#135bec", fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  systemCardDetail: { color: "#64748b", fontSize: 12 },
  aboutCard: { alignItems: "center", paddingTop: 28 },
  aboutName: { color: "#111827", fontSize: 15, fontWeight: "800", letterSpacing: 1.2, marginBottom: 6 },
  aboutVersion: { color: "#94a3b8", fontFamily: "monospace", fontSize: 10 },
});
