import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BrandMark } from "./components/BrandMark";
import { SuiteIllustration } from "./components/SuiteIllustration";
import {
  launchpadSuites,
  type LaunchpadIllustrationKey,
  type LaunchpadSuiteStatus,
} from "../../packages/contracts/src/launchpad";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <BrandMark />
        <View style={styles.topBarActions}>
          <Pressable accessibilityLabel="Notifications" style={styles.topBarButton}>
            <Text style={styles.topBarButtonText}>•••</Text>
          </Pressable>
          <Pressable accessibilityLabel="Account menu" style={styles.avatar}>
            <Text style={styles.avatarText}>MC</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.workspaceBar}>
        <View>
          <Text style={styles.workspaceLabel}>WORKSPACE</Text>
          <Text style={styles.workspaceName}>LoopDev</Text>
        </View>
        <Pressable accessibilityLabel="Change workspace" style={styles.contextButton}>
          <Text style={styles.contextButtonText}>⌄</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.eyebrow}>
          <View style={styles.liveDot} />
          <Text style={styles.eyebrowText}>WORKSPACE LAUNCHER</Text>
        </View>

        <Text style={styles.title}>
          Welcome, <Text style={styles.titleAccent}>Admin</Text>
          {`\n`}choose your next work context.
        </Text>
        <Text style={styles.subtitle}>
          Your suites, organized for the work that matters.
        </Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>AVAILABLE SUITES</Text>
          <Text style={styles.sectionCount}>
            {launchpadSuites.filter((suite) => suite.status === "ready").length} ACTIVE
          </Text>
        </View>
        {launchpadSuites.map((suite) => (
          <SuiteCard
            key={suite.id}
            title={suite.title}
            description={suite.description}
            version={suite.version}
            kind={suite.illustration}
            status={suite.status}
          />
        ))}
      </ScrollView>
      <View style={styles.bottomNav}>
        <MobileNavItem label="Launchpad" icon="⌂" active />
        <MobileNavItem label="Activity" icon="◷" />
        <MobileNavItem label="Suites" icon="▦" />
        <MobileNavItem label="Account" icon="○" />
      </View>
    </SafeAreaView>
  );
}

type MobileNavItemProps = {
  label: string;
  icon: string;
  active?: boolean;
};

function MobileNavItem({ label, icon, active = false }: MobileNavItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={styles.navItem}
    >
      <Text style={[styles.navIcon, active && styles.activeNavIcon]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.activeNavLabel]}>{label}</Text>
    </Pressable>
  );
}

type SuiteCardProps = {
  title: string;
  description: string;
  version: string;
  kind: LaunchpadIllustrationKey;
  status: LaunchpadSuiteStatus;
};

function SuiteCard({ title, description, version, kind, status }: SuiteCardProps) {
  const active = status === "ready";
  const statusLabel = status === "lab" ? "LAB" : active ? "READY" : "{ LOCKED }";
  const systemStatus = active ? "SYSTEM_READY" : status === "lab" ? "LAB_ACCESS" : "AUTH_REQUIRED";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !active }}
      disabled={!active}
      style={({ pressed }) => [
        styles.card,
        active && styles.activeCard,
        pressed && styles.pressedCard,
      ]}
    >
      <View style={styles.cardInner}>
        <View style={styles.cardTopRow}>
          <Text style={styles.version}>V{version}</Text>
          <Text style={[styles.status, active && styles.activeStatus]}>
            {statusLabel}
          </Text>
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
            <Text style={styles.systemStatusText}>
              {systemStatus}
            </Text>
          </View>
          {active && <Text style={styles.activeArrow}>→</Text>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: 22,
  },
  brandMark: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  brandDot: {
    backgroundColor: "#135bec",
    borderRadius: 7,
    height: 13,
    width: 13,
  },
  brandName: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  topBarActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  topBarButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  topBarButtonText: {
    color: "#64748b",
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 8,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#135bec",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  workspaceBar: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  workspaceLabel: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 3,
  },
  workspaceName: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  contextButton: {
    alignItems: "center",
    borderColor: "#dbe2ec",
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  contextButtonText: {
    color: "#135bec",
    fontSize: 20,
    lineHeight: 20,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 32,
  },
  eyebrow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  liveDot: {
    backgroundColor: "#135bec",
    borderRadius: 5,
    height: 8,
    width: 8,
  },
  eyebrowText: {
    color: "#135bec",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    color: "#111827",
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1,
    lineHeight: 43,
    marginBottom: 14,
  },
  titleAccent: {
    color: "#135bec",
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 42,
    maxWidth: 300,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  sectionCount: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "#e5e7eb",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "column",
    marginBottom: 12,
    minHeight: 330,
    padding: 18,
  },
  activeCard: {
    borderColor: "rgba(19,91,236,0.4)",
  },
  pressedCard: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  cardInner: {
    flex: 1,
    width: "100%",
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  illustration: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    height: 130,
    justifyContent: "center",
    marginBottom: 18,
    marginTop: 18,
    overflow: "hidden",
    width: "100%",
  },
  activeIllustration: {
    backgroundColor: "#eff6ff",
  },
  illustrationText: {
    color: "#94a3b8",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 4,
  },
  activeIllustrationText: {
    color: "#135bec",
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: "#111827",
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  activeCardTitle: {
    color: "#111827",
  },
  status: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  activeStatus: {
    color: "#135bec",
  },
  cardDescription: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  version: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  activeArrow: {
    color: "#135bec",
    fontSize: 18,
    fontWeight: "700",
  },
  cardFooter: {
    alignItems: "center",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    paddingTop: 14,
  },
  systemStatus: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  statusDot: {
    backgroundColor: "#135bec",
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  lockedDot: {
    backgroundColor: "#94a3b8",
  },
  systemStatusText: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  bottomNav: {
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    minHeight: 72,
    paddingHorizontal: 8,
    paddingTop: 9,
  },
  navItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 68,
    paddingHorizontal: 8,
  },
  navIcon: {
    color: "#94a3b8",
    fontSize: 21,
    height: 24,
    lineHeight: 22,
  },
  activeNavIcon: {
    color: "#135bec",
  },
  navLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "600",
  },
  activeNavLabel: {
    color: "#135bec",
    fontWeight: "800",
  },
});
