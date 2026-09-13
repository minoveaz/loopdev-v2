import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MobileAppShell } from "./MobileAppShell";
import { MobileHeader } from "./MobileHeader";
import { SuiteIllustration } from "./SuiteIllustration";
import type { launchpadSuites } from "../../../packages/contracts/src/launchpad";

type MobileWorkspaceScreenProps = {
  suite: (typeof launchpadSuites)[number];
  onBack: () => void;
};

export function MobileWorkspaceScreen({ suite, onBack }: MobileWorkspaceScreenProps) {
  return (
    <MobileAppShell>
      <MobileHeader
        showActions={false}
        leading={<Pressable accessibilityLabel="Back to Launchpad" accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backButtonText}>←</Text></Pressable>}
      />
      <ScrollView contentContainerStyle={styles.workspaceContent}>
        <View style={styles.workspaceEyebrow}><Text style={styles.workspaceEyebrowText}>ACTIVE WORK CONTEXT</Text></View>
        <Text style={styles.workspaceTitle}>{suite.title}</Text>
        <Text style={styles.workspaceDescription}>{suite.description}</Text>
        <View style={styles.workspaceHero}><SuiteIllustration kind={suite.illustration} /></View>
        <View style={styles.domainCard}>
          <Text style={styles.domainCardLabel}>DOMAIN ROUTE</Text>
          <Text style={styles.domainCardValue}>{suite.entryPath ?? "Workspace pending"}</Text>
          <Text style={styles.domainCardDescription}>This workspace is connected to the shared LoopDev suite context.</Text>
        </View>
      </ScrollView>
    </MobileAppShell>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: "center", borderColor: "#e5e7eb", borderRadius: 18, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  backButtonText: { color: "#135bec", fontSize: 22, lineHeight: 24 },
  workspaceContent: { paddingBottom: 40, paddingHorizontal: 22, paddingTop: 38 },
  workspaceEyebrow: { alignSelf: "flex-start", backgroundColor: "#eff6ff", borderRadius: 6, marginBottom: 18, paddingHorizontal: 10, paddingVertical: 7 },
  workspaceEyebrowText: { color: "#135bec", fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  workspaceTitle: { color: "#111827", fontSize: 34, fontWeight: "800", letterSpacing: -1, marginBottom: 12 },
  workspaceDescription: { color: "#64748b", fontSize: 16, lineHeight: 24, maxWidth: 340 },
  workspaceHero: { alignItems: "center", backgroundColor: "#eff6ff", borderRadius: 18, height: 220, justifyContent: "center", marginTop: 30, overflow: "hidden" },
  domainCard: { backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: 16, borderWidth: 1, marginTop: 18, padding: 18 },
  domainCardLabel: { color: "#64748b", fontSize: 9, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 },
  domainCardValue: { color: "#135bec", fontFamily: "monospace", fontSize: 13, marginBottom: 10 },
  domainCardDescription: { color: "#64748b", fontSize: 13, lineHeight: 19 },
});
