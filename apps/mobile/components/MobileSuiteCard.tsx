import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SuiteIllustration } from "./SuiteIllustration";
import type { LaunchpadIllustrationKey, LaunchpadSuiteStatus } from "../../../packages/contracts/src/launchpad";

type MobileSuiteCardProps = {
  title: string;
  description: string;
  version: string;
  kind: LaunchpadIllustrationKey;
  status: LaunchpadSuiteStatus;
  onPress?: () => void;
};

export function MobileSuiteCard({ title, description, version, kind, status, onPress }: MobileSuiteCardProps) {
  const active = status === "ready";
  const statusLabel = status === "lab" ? "LABORATORIO" : active ? "DISPONIBLE" : "{ BLOQUEADO }";
  const systemStatus = active ? "SISTEMA_LISTO" : status === "lab" ? "ACCESO_LAB" : "REQUIERE_AUTH";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !active }}
      disabled={!active}
      onPress={onPress}
      style={({ pressed }) => [styles.card, active && styles.activeCard, pressed && styles.pressedCard]}
    >
      <View style={styles.cardInner}>
        <View style={styles.cardTopRow}>
          <View style={[styles.statusBadge, active && styles.activeBadge, status === "lab" && styles.labBadge]}>
            <Text style={[styles.statusBadgeText, active && styles.activeBadgeText, status === "lab" && styles.labBadgeText]}>{statusLabel}</Text>
          </View>
          <Text style={styles.version}>{version}</Text>
        </View>
        <View style={[styles.illustration, active && styles.activeIllustration]}>
          <SuiteIllustration kind={kind} />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, active && styles.activeCardTitle]}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.systemStatus}>
            <View style={[styles.statusDot, !active && styles.lockedDot]} />
            <Text style={styles.systemStatusText}>{systemStatus}</Text>
          </View>
          {active && <ChevronRight size={18} color="#135bec" />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "rgba(255,255,255,0.92)", borderColor: "#e5e7eb", borderRadius: 18, borderWidth: 1, marginBottom: 12, minHeight: 330, padding: 18 },
  activeCard: { borderColor: "rgba(19,91,236,0.4)" },
  pressedCard: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  cardInner: { flex: 1, width: "100%" },
  cardTopRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  illustration: { alignItems: "center", backgroundColor: "#f1f5f9", borderRadius: 12, height: 130, justifyContent: "center", marginBottom: 18, marginTop: 18, overflow: "hidden", width: "100%" },
  activeIllustration: { backgroundColor: "#eff6ff" },
  cardBody: { flex: 1 },
  cardTitle: { color: "#111827", flex: 1, fontSize: 17, fontWeight: "700" },
  activeCardTitle: { color: "#111827" },
  status: { color: "#64748b", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  activeStatus: { color: "#135bec" },
  cardDescription: { color: "#64748b", fontSize: 13, lineHeight: 18, marginBottom: 10 },
  version: { color: "#64748b", fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  activeArrow: { color: "#135bec", fontSize: 18, fontWeight: "700" },
  cardFooter: { alignItems: "center", borderTopColor: "#e5e7eb", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 18, paddingTop: 14 },
  systemStatus: { alignItems: "center", flexDirection: "row", gap: 7 },
  statusDot: { backgroundColor: "#135bec", borderRadius: 4, height: 7, width: 7 },
  lockedDot: { backgroundColor: "#94a3b8" },
  systemStatusText: { color: "#64748b", fontSize: 9, fontWeight: "700", letterSpacing: 1.4 },
});
