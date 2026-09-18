import { CheckSquare, ChevronRight, FileSearch, MessageCircle, Scan, TrendingUp, Users } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SuiteIllustration } from "./components/SuiteIllustration";
import { MobileBackLink } from "./components/ui/MobileBackLink";
import { mobileTheme } from "./theme/tokens";
import type { launchpadSuites } from "../../packages/contracts/src/launchpad";

type MobileWorkspaceScreenProps = {
  suite: (typeof launchpadSuites)[number];
  onBack: () => void;
  onNavigate?: (path: string) => void;
};

export function MobileWorkspaceScreen({ suite, onBack, onNavigate }: MobileWorkspaceScreenProps) {
  const isCrm = suite.id === "sales-crm";
  const isDocIntelligence = suite.id === "document-intelligence";

  const crmShortcuts = [
    {
      id: "crm-tasks",
      title: "Tareas y Calendario",
      subtitle: "Vistas Lista, Kanban y Calendario Semanal/Mensual",
      icon: CheckSquare,
      path: "/app/sales-crm/tasks",
      badge: "Full Parity",
    },
    {
      id: "crm-contacts",
      title: "Contactos y Cuentas",
      subtitle: "Gestión de directorio y relaciones",
      icon: Users,
      path: "/app/sales-crm/contacts",
      badge: "Full Parity",
    },
    {
      id: "crm-pipeline",
      title: "Pipeline Comercial",
      subtitle: "Gestión de deals y funnel comercial",
      icon: TrendingUp,
      path: "/app/sales-crm/pipeline",
    },
    {
      id: "crm-comms",
      title: "Comunicaciones",
      subtitle: "Mensajería, WhatsApp y correo sincronizado",
      icon: MessageCircle,
      path: "/app/sales-crm/communications",
    },
  ];

  const docIntelligenceShortcuts = [
    {
      id: "doc-ocr",
      title: "OCR y Extracción de Documentos",
      subtitle: "Escaneo y lectura de DNI, NIE y Pasaportes",
      icon: Scan,
      path: "/app/tools/document-intelligence",
      badge: "IA Vision",
    },
    {
      id: "doc-overview",
      title: "Visor y Extracciones",
      subtitle: "Inspección de campos y tipificación documental",
      icon: FileSearch,
      path: "/app/tools/document-intelligence",
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.workspaceContent}>
      <MobileBackLink label="Back to Launchpad" onPress={onBack} />
      <View style={styles.workspaceEyebrow}><Text style={styles.workspaceEyebrowText}>ACTIVE WORK CONTEXT</Text></View>
      <Text style={styles.workspaceTitle}>{suite.title}</Text>
      <Text style={styles.workspaceDescription}>{suite.description}</Text>

      {isCrm && onNavigate && (
        <View style={styles.shortcutsSection}>
          <Text style={styles.sectionHeading}>MÓDULOS DE TRABAJO</Text>
          <View style={styles.shortcutList}>
            {crmShortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.id}
                  style={styles.shortcutCard}
                  onPress={() => onNavigate(item.path)}
                >
                  <View style={styles.shortcutIconWrap}>
                    <Icon size={22} color="#135bec" />
                  </View>
                  <View style={styles.shortcutContent}>
                    <View style={styles.shortcutHeader}>
                      <Text style={styles.shortcutTitle}>{item.title}</Text>
                      {item.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.shortcutSubtitle}>{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={18} color="#94a3b8" />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {isDocIntelligence && onNavigate && (
        <View style={styles.shortcutsSection}>
          <Text style={styles.sectionHeading}>HERRAMIENTAS DE EXTRACCIÓN</Text>
          <View style={styles.shortcutList}>
            {docIntelligenceShortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.id}
                  style={styles.shortcutCard}
                  onPress={() => onNavigate(item.path)}
                >
                  <View style={styles.shortcutIconWrap}>
                    <Icon size={22} color="#135bec" />
                  </View>
                  <View style={styles.shortcutContent}>
                    <View style={styles.shortcutHeader}>
                      <Text style={styles.shortcutTitle}>{item.title}</Text>
                      {item.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.shortcutSubtitle}>{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={18} color="#94a3b8" />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.workspaceHero}><SuiteIllustration kind={suite.illustration} /></View>
      <View style={styles.domainCard}>
        <Text style={styles.domainCardLabel}>DOMAIN ROUTE</Text>
        <Text style={styles.domainCardValue}>{suite.entryPath ?? "Workspace pending"}</Text>
        <Text style={styles.domainCardDescription}>This workspace is connected to the shared LoopDev suite context.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backButtonText: { color: "#135bec", fontSize: 14, fontWeight: "700" },
  workspaceContent: { paddingBottom: 40, paddingHorizontal: 20, paddingTop: 28 },
  workspaceEyebrow: { alignSelf: "flex-start", backgroundColor: "#eff6ff", borderRadius: 6, marginBottom: 12, paddingHorizontal: 10, paddingVertical: 5 },
  workspaceEyebrowText: { color: "#135bec", fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  workspaceTitle: { color: "#111827", fontSize: 28, fontWeight: "800", letterSpacing: -0.8, marginBottom: 8 },
  workspaceDescription: { color: "#64748b", fontSize: 15, lineHeight: 22, maxWidth: 360 },
  shortcutsSection: { marginTop: 24 },
  sectionHeading: { color: "#64748b", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 12 },
  shortcutList: { gap: 10 },
  shortcutCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    ...mobileTheme.shadows.card,
  },
  shortcutIconWrap: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    height: 42,
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  shortcutContent: { flex: 1, marginRight: 8 },
  shortcutHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  shortcutTitle: { color: "#0f172a", fontSize: 15, fontWeight: "700" },
  shortcutSubtitle: { color: "#64748b", fontSize: 12, marginTop: 2 },
  badge: { backgroundColor: "#dbeafe", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: "#1d4ed8", fontSize: 10, fontWeight: "700" },
  workspaceHero: { alignItems: "center", backgroundColor: "#eff6ff", borderRadius: 18, height: 180, justifyContent: "center", marginTop: 24, overflow: "hidden" },
  domainCard: { backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: 16, borderWidth: 1, marginTop: 18, padding: 18 },
  domainCardLabel: { color: "#64748b", fontSize: 9, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 },
  domainCardValue: { color: "#135bec", fontFamily: "monospace", fontSize: 13, marginBottom: 10 },
  domainCardDescription: { color: "#64748b", fontSize: 13, lineHeight: 19 },
});
