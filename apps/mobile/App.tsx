import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { launchpadSuites } from "../../packages/contracts/src/launchpad";
import { MobileAccountScreen } from "./components/MobileAccountScreen";
import { MobileAppShell } from "./components/MobileAppShell";
import { MobileBottomNav, type MobileTab } from "./components/MobileBottomNav";
import { MobileHeader } from "./components/MobileHeader";
import { MobileSuiteCard } from "./components/MobileSuiteCard";
import { MobileWorkspaceScreen } from "./components/MobileWorkspaceScreen";

export default function App() {
  const [activeSuiteId, setActiveSuiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MobileTab>("launchpad");
  const activeSuite = launchpadSuites.find((suite) => suite.id === activeSuiteId);

  if (activeSuite) {
    return <MobileWorkspaceScreen suite={activeSuite} onBack={() => setActiveSuiteId(null)} />;
  }
  if (activeTab === "account") {
    return <MobileAccountScreen onBack={() => setActiveTab("launchpad")} onTabPress={handleTabPress} />;
  }

  function handleTabPress(tab: MobileTab) {
    if (tab === "account" || tab === "launchpad") setActiveTab(tab);
  }

  return (
    <MobileAppShell>
      <MobileHeader onAccountPress={() => setActiveTab("account")} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.eyebrow}><View style={styles.liveDot} /><Text style={styles.eyebrowText}>WORKSPACE LAUNCHER</Text></View>
        <Text style={styles.title}>Welcome, <Text style={styles.titleAccent}>Admin</Text>{`\n`}choose your next work context.</Text>
        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>AVAILABLE SUITES</Text><Text style={styles.sectionCount}>{launchpadSuites.filter((suite) => suite.status === "ready").length} ACTIVE</Text></View>
        {launchpadSuites.map((suite) => (
          <MobileSuiteCard
            key={suite.id}
            title={suite.title}
            description={suite.description}
            version={suite.version}
            kind={suite.illustration}
            status={suite.status}
            onPress={suite.status === "ready" ? () => setActiveSuiteId(suite.id) : undefined}
          />
        ))}
      </ScrollView>
      <MobileBottomNav activeTab="launchpad" onTabPress={handleTabPress} />
    </MobileAppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32, paddingHorizontal: 22, paddingTop: 32 },
  eyebrow: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 24 },
  liveDot: { backgroundColor: "#135bec", borderRadius: 5, height: 8, width: 8 },
  eyebrowText: { color: "#135bec", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  title: { color: "#111827", fontSize: 34, fontWeight: "700", letterSpacing: -1, lineHeight: 43, marginBottom: 14 },
  titleAccent: { color: "#135bec", fontWeight: "900" },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  sectionLabel: { color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  sectionCount: { color: "#64748b", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
});
