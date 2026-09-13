import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MobileBottomNav, type MobileTab } from "./MobileBottomNav";
import { MobileHeader } from "./MobileHeader";
import { MobileAppShell } from "./MobileAppShell";

type MobileAccountScreenProps = {
  onBack: () => void;
  onTabPress: (tab: MobileTab) => void;
};

export function MobileAccountScreen({ onBack, onTabPress }: MobileAccountScreenProps) {
  return (
    <MobileAppShell>
      <MobileHeader showActions={false} />
      <ScrollView contentContainerStyle={styles.accountContent}>
        <Pressable accessibilityLabel="Back to Launchpad" accessibilityRole="button" onPress={onBack} style={styles.accountBack}>
          <Text style={styles.accountBackText}>← Launchpad</Text>
        </Pressable>
        <Text style={styles.accountEyebrow}>ACCOUNT</Text>
        <Text style={styles.accountTitle}>Help & resources</Text>
        <Text style={styles.accountDescription}>Everything you need to get the most from LoopDev.</Text>
        <View style={styles.accountCard}>
          <AccountRow label="Profile" detail="Your personal information and account" />
          <AccountRow label="Preferences" detail="Language, theme, and appearance" />
          <AccountRow label="Documentation" detail="Product guides and platform reference" />
          <AccountRow label="Changelog" detail="What is new in LoopDev" />
          <AccountRow label="Support" detail="Get help from the LoopDev team" />
        </View>
        <View style={styles.systemCard}>
          <View style={styles.systemCardHeader}><View style={styles.systemNormalDot} /><Text style={styles.systemNormalText}>ALL SYSTEMS NORMAL</Text></View>
          <Text style={styles.systemCardDetail}>LoopDev services are operating normally.</Text>
        </View>
        <View style={styles.aboutCard}><Text style={styles.aboutName}>Loopdev</Text><Text style={styles.aboutVersion}>v0.0.1 · © 2026 LoopDev</Text></View>
      </ScrollView>
      <MobileBottomNav activeTab="account" onTabPress={onTabPress} />
    </MobileAppShell>
  );
}

function AccountRow({ label, detail }: { label: string; detail: string }) {
  return <Pressable accessibilityRole="button" style={styles.accountRow}><View style={styles.accountRowCopy}><Text style={styles.accountRowLabel}>{label}</Text><Text style={styles.accountRowDetail}>{detail}</Text></View><Text style={styles.accountRowArrow}>→</Text></Pressable>;
}

const styles = StyleSheet.create({
  accountContent: { paddingBottom: 40, paddingHorizontal: 22, paddingTop: 30 },
  accountBack: { alignSelf: "flex-start", marginBottom: 32 },
  accountBackText: { color: "#135bec", fontSize: 14, fontWeight: "700" },
  accountEyebrow: { color: "#135bec", fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 12 },
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
