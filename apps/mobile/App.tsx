import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.eyebrow}>
          <View style={styles.liveDot} />
          <Text style={styles.eyebrowText}>LOOPDEV / WORKSPACE</Text>
        </View>

        <Text style={styles.title}>Choose your{`\n`}next work context.</Text>
        <Text style={styles.subtitle}>
          Your suites, organized for the work that matters.
        </Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>AVAILABLE SUITES</Text>
          <Text style={styles.sectionCount}>01 ACTIVE</Text>
        </View>

        <SuiteCard
          title="Sales & CRM"
          description="Pipeline intelligence and relationship management for modern teams."
          version="0.8.2"
          active
        />
        <SuiteCard
          title="Marketing Studio"
          description="Identity governance and generative content tools for your team."
          version="1.0.4"
        />
        <SuiteCard
          title="Financial Ops"
          description="Billing, payroll and fiscal compliance orchestration."
          version="0.5.0"
        />
      </ScrollView>
    </View>
  );
}

type SuiteCardProps = {
  title: string;
  description: string;
  version: string;
  active?: boolean;
};

function SuiteCard({ title, description, version, active = false }: SuiteCardProps) {
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
      <View style={[styles.cardIcon, active && styles.activeCardIcon]}>
        <Text style={[styles.cardIconText, active && styles.activeCardIconText]}>
          {active ? "CRM" : "•••"}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, active && styles.activeCardTitle]}>{title}</Text>
          <Text style={[styles.status, active && styles.activeStatus]}>
            {active ? "OPEN" : "SOON"}
          </Text>
        </View>
        <Text style={styles.cardDescription}>{description}</Text>
        <Text style={styles.version}>VERSION {version}</Text>
      </View>
      <Text style={[styles.arrow, active && styles.activeArrow]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d111c",
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 72,
    paddingBottom: 40,
  },
  eyebrow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  liveDot: {
    backgroundColor: "#8da9ff",
    borderRadius: 5,
    height: 8,
    width: 8,
  },
  eyebrowText: {
    color: "#8da9ff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    color: "#f5f7ff",
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: -1,
    lineHeight: 43,
    marginBottom: 14,
  },
  subtitle: {
    color: "#9299ad",
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
    color: "#697187",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  sectionCount: {
    color: "#697187",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  card: {
    alignItems: "center",
    backgroundColor: "#151b2a",
    borderColor: "#232b3d",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    minHeight: 128,
    padding: 18,
  },
  activeCard: {
    backgroundColor: "#1a2642",
    borderColor: "#5577d9",
  },
  pressedCard: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: "#20283a",
    borderRadius: 13,
    height: 48,
    justifyContent: "center",
    marginRight: 14,
    width: 48,
  },
  activeCardIcon: {
    backgroundColor: "#7897ff",
  },
  cardIconText: {
    color: "#7d879d",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  activeCardIconText: {
    color: "#0d111c",
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 7,
  },
  cardTitle: {
    color: "#dce1ee",
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  activeCardTitle: {
    color: "#ffffff",
  },
  status: {
    color: "#697187",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  activeStatus: {
    color: "#94b0ff",
  },
  cardDescription: {
    color: "#8c94a8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  version: {
    color: "#596278",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  arrow: {
    color: "#4b556d",
    fontSize: 28,
    marginLeft: 8,
  },
  activeArrow: {
    color: "#9bb3ff",
  },
});
