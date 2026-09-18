import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMobileI18n } from "../i18n";

type MobileRouteScreenProps = {
  label: string;
  path: string;
};

export function MobileRouteScreen({ label, path }: MobileRouteScreenProps) {
  const { lang } = useMobileI18n();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>{lang === "es" ? "ESPACIO DE TRABAJO LOOPDEV" : "LOOPDEV WORKSPACE"}</Text>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.description}>
        {lang === "es"
          ? "Esta ruta móvil está conectada al contrato de navegación central de LoopDev."
          : "This mobile route is connected to LoopDev core navigation contract."}
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{lang === "es" ? "RUTA ACTUAL" : "CURRENT ROUTE"}</Text>
        <Text style={styles.path}>{path}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 22 },
  eyebrow: { color: "#135bec", fontSize: 10, fontWeight: "800", letterSpacing: 1.8, marginBottom: 14, marginTop: 24 },
  title: { color: "#111827", fontSize: 34, fontWeight: "800", marginBottom: 12 },
  description: { color: "#64748b", fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: 16, borderWidth: 1, marginTop: 28, padding: 18 },
  cardLabel: { color: "#64748b", fontSize: 9, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 },
  path: { color: "#135bec", fontFamily: "monospace", fontSize: 13 },
});
