import { ScrollView, StyleSheet, Text, View } from "react-native";

type MobileRouteScreenProps = {
  label: string;
  path: string;
};

export function MobileRouteScreen({ label, path }: MobileRouteScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>ESPACIO DE TRABAJO LOOPDEV</Text>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.description}>Esta ruta móvil está conectada al contrato de navegación central de LoopDev.</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>RUTA ACTUAL</Text>
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
