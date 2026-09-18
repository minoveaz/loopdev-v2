import {
  Boxes,
  ChevronDown,
  ChevronRight,
  FileSearch,
  House,
  Layers,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react-native";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { loopdevNavigationContract } from "../../../packages/contracts/src/navigation";
import { useMobileI18n } from "../i18n";

type MobileNavigationDrawerProps = {
  visible: boolean;
  onClose: () => void;
  activePath?: string;
  onNavigate: (path: string) => void;
};

type DrawerItem = {
  id: string;
  label: string;
  path: string;
};

const groupIcons: Record<string, LucideIcon> = {
  crm: Users,
  erp: Boxes,
  tools: FileSearch,
  settings: Settings,
};

const suiteThemes: Record<
  string,
  {
    bgActive: string;
    textActive: string;
    borderActive: string;
    iconActive: string;
  }
> = {
  crm: {
    bgActive: "#eff6ff",
    textActive: "#1d4ed8",
    borderActive: "#bfdbfe",
    iconActive: "#135bec",
  },
  erp: {
    bgActive: "#f0fdf4",
    textActive: "#15803d",
    borderActive: "#bbf7d0",
    iconActive: "#16a34a",
  },
  tools: {
    bgActive: "#fef3c7",
    textActive: "#b45309",
    borderActive: "#fde68a",
    iconActive: "#d97706",
  },
  settings: {
    bgActive: "#f8fafc",
    textActive: "#334155",
    borderActive: "#e2e8f0",
    iconActive: "#64748b",
  },
};

const sections = loopdevNavigationContract.groups.map((group) => ({
  ...group,
  icon: groupIcons[group.iconKey] || Layers,
  theme: suiteThemes[group.id] || suiteThemes.settings,
}));

const DRAWER_LABELS: Record<"es" | "en", Record<string, string>> = {
  es: {
    CRM: "CRM",
    ERP: "ERP",
    Tools: "Herramientas",
    Settings: "Configuración",
    Launchpad: "Inicio",
    Overview: "Resumen General",
    Contacts: "Contactos",
    Leads: "Leads",
    Pipeline: "Pipeline",
    Opportunities: "Oportunidades",
    Tasks: "Tareas",
    Communications: "Comunicaciones",
    "Product Catalog": "Catálogo de Productos",
    "Document Intelligence": "Inteligencia Documental",
    Owner: "Propietario",
    WORKSPACE: "ESPACIO DE TRABAJO",
    "Active Work Context": "Contexto de trabajo activo",
    MAIN: "PRINCIPAL",
    SUITES: "MÓDULOS",
    TOOLS: "HERRAMIENTAS",
    SETTINGS: "CONFIGURACIÓN",
    "Close navigation": "Cerrar navegación",
    "Sales & CRM": "Ventas y CRM",
  },
  en: {
    CRM: "CRM",
    ERP: "ERP",
    Tools: "Tools",
    Settings: "Settings",
    Launchpad: "Launchpad",
    Overview: "Overview",
    Contacts: "Contacts",
    Leads: "Leads",
    Pipeline: "Pipeline",
    Opportunities: "Opportunities",
    Tasks: "Tasks",
    Communications: "Communications",
    "Product Catalog": "Product Catalog",
    "Document Intelligence": "Document Intelligence",
    Owner: "Owner",
    WORKSPACE: "WORKSPACE",
    "Active Work Context": "Active Work Context",
    MAIN: "MAIN",
    SUITES: "SUITES",
    TOOLS: "TOOLS",
    SETTINGS: "SETTINGS",
    "Close navigation": "Close navigation",
    "Sales & CRM": "Sales & CRM",
  },
};

export function MobileNavigationDrawer({
  visible,
  onClose,
  activePath,
  onNavigate,
}: MobileNavigationDrawerProps) {
  const { lang } = useMobileI18n();
  const [expandedSection, setExpandedSection] = useState<string | null>(() => {
    if (activePath?.startsWith("/app/sales-crm")) return "CRM";
    if (activePath?.startsWith("/app/erp")) return "ERP";
    if (activePath?.startsWith("/app/tools")) return "Tools";
    if (activePath?.startsWith("/app/settings")) return "Settings";
    return null;
  });

  const translateX = useRef(new Animated.Value(-500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 16,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -500,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const activeSuiteName = (() => {
    if (activePath?.startsWith("/app/sales-crm")) return lang === "es" ? "Ventas y CRM" : "Sales & CRM";
    if (activePath?.startsWith("/app/erp")) return "ERP";
    if (activePath?.startsWith("/app/tools")) return lang === "es" ? "Herramientas" : "Tools";
    if (activePath?.startsWith("/app/settings")) return lang === "es" ? "Configuración" : "Settings";
    return lang === "es" ? "Inicio" : "Launchpad";
  })();

  const isLaunchpadActive = activePath === loopdevNavigationContract.launchpad.path || !activePath || activePath === "/";

  const suiteSections = sections.filter((s) => s.id === "crm" || s.id === "erp");
  const toolSections = sections.filter((s) => s.id === "tools");
  const settingSections = sections.filter((s) => s.id === "settings");

  const renderSection = (section: (typeof sections)[number]) => {
    const expanded = expandedSection === section.label;
    const SectionIcon = expanded ? ChevronDown : ChevronRight;
    const GroupIcon = section.icon;
    const theme = section.theme;
    const isSectionActive = section.items.some((item) => activePath === item.path);

    return (
      <View key={section.label} style={styles.sectionContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpandedSection(expanded ? null : section.label)}
          style={[
            styles.sectionTrigger,
            expanded && styles.sectionTriggerExpanded,
          ]}
        >
          <View style={styles.sectionTitle}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: isSectionActive ? theme.bg : "#f8fafc" },
              ]}
            >
              <GroupIcon
                color={isSectionActive ? theme.color : "#64748b"}
                size={17}
                strokeWidth={2.2}
              />
            </View>
            <Text
              style={[
                styles.sectionLabel,
                isSectionActive && styles.sectionLabelActive,
              ]}
            >
              {DRAWER_LABELS[lang]?.[section.label] || section.label}
            </Text>
          </View>
          <SectionIcon color="#94a3b8" size={16} strokeWidth={2.2} />
        </Pressable>

        {/* Child Items */}
        {expanded && (
          <View style={styles.subItemsList}>
            <View style={styles.subTreeLine} />
            <View style={styles.subItemsColumn}>
              {section.items.map((item: DrawerItem) => {
                const isItemActive = activePath === item.path;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isItemActive }}
                    onPress={() => {
                      onNavigate(item.path);
                      onClose();
                    }}
                    style={[
                      styles.subItem,
                      isItemActive && styles.subItemActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.subDot,
                        isItemActive && styles.subDotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.subItemLabel,
                        isItemActive && styles.subItemLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {DRAWER_LABELS[lang]?.[item.label] || item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.drawer, { transform: [{ translateX }] }]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollFlex}
            contentContainerStyle={styles.content}
          >
            {/* User Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profile}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>MC</Text>
                  <View style={styles.avatarOnlineDot} />
                </View>
                <View style={styles.profileInfo}>
                  <View style={styles.nameBadgeRow}>
                    <Text style={styles.profileName}>Admin</Text>
                    <View style={styles.rolePill}>
                      <Text style={styles.rolePillText}>{DRAWER_LABELS[lang]?.["Owner"] || "Propietario"}</Text>
                    </View>
                  </View>
                  <Text style={styles.profileEmail} numberOfLines={1}>admin@loopdev.app</Text>
                </View>
              </View>
              <Pressable
                accessibilityLabel={DRAWER_LABELS[lang]?.["Close navigation"] || "Cerrar navegación"}
                accessibilityRole="button"
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={8}
              >
                <X size={16} color="#64748b" />
              </Pressable>
            </View>

            {/* Active Context Card */}
            <View style={styles.contextCard}>
              <View style={styles.contextHeader}>
                <View style={styles.contextTag}>
                  <View style={styles.contextLiveDot} />
                  <Text style={styles.contextLabel}>{DRAWER_LABELS[lang]?.["WORKSPACE"] || "ESPACIO DE TRABAJO"}</Text>
                </View>
                <Text style={styles.contextSub}>LoopDev Cloud</Text>
              </View>
              <View style={styles.contextBody}>
                <View style={styles.contextIconWrap}>
                  <Sparkles size={16} color="#135bec" />
                </View>
                <View style={styles.contextTitleWrap}>
                  <Text style={styles.contextName}>{activeSuiteName}</Text>
                  <Text style={styles.contextHint}>{DRAWER_LABELS[lang]?.["Active Work Context"] || "Contexto de trabajo activo"}</Text>
                </View>
                <ChevronRight size={16} color="#94a3b8" />
              </View>
            </View>

            {/* Category: MAIN */}
            <Text style={styles.categoryTitle}>{DRAWER_LABELS[lang]?.["MAIN"] || "PRINCIPAL"}</Text>

            {/* Launchpad Item */}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isLaunchpadActive }}
              onPress={() => {
                onNavigate(loopdevNavigationContract.launchpad.path);
                onClose();
              }}
              style={[
                styles.navPill,
                isLaunchpadActive && styles.navPillActive,
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  isLaunchpadActive ? styles.iconBoxActive : styles.iconBoxDefault,
                ]}
              >
                <House
                  color={isLaunchpadActive ? "#ffffff" : "#475569"}
                  size={17}
                  strokeWidth={2.2}
                />
              </View>
              <Text
                style={[
                  styles.navPillLabel,
                  isLaunchpadActive && styles.navPillLabelActive,
                ]}
              >
                {DRAWER_LABELS[lang]?.[loopdevNavigationContract.launchpad.label] || loopdevNavigationContract.launchpad.label}
              </Text>
              {isLaunchpadActive && <View style={styles.activeIndicator} />}
            </Pressable>

            {/* Category: SUITES */}
            <Text style={[styles.categoryTitle, { marginTop: 16 }]}>{DRAWER_LABELS[lang]?.["SUITES"] || "MÓDULOS"}</Text>
            {suiteSections.map(renderSection)}

            {/* Category: TOOLS */}
            <Text style={[styles.categoryTitle, { marginTop: 16 }]}>{DRAWER_LABELS[lang]?.["TOOLS"] || "HERRAMIENTAS"}</Text>
            {toolSections.map(renderSection)}

            {/* Category: SETTINGS */}
            <Text style={[styles.categoryTitle, { marginTop: 16 }]}>{DRAWER_LABELS[lang]?.["SETTINGS"] || "CONFIGURACIÓN"}</Text>
            {settingSections.map(renderSection)}
          </ScrollView>

          {/* Pinned Footer at bottom of Sidebar */}
          <View style={styles.pinnedFooter}>
            <View style={styles.footerPill}>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>LoopDev OS · v2.4.0</Text>
            </View>
          </View>
        </Animated.View>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            accessibilityLabel={DRAWER_LABELS[lang]?.["Close navigation"] || "Cerrar navegación"}
            accessibilityRole="button"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: "relative",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15,23,42,0.45)",
    zIndex: 1,
  },
  drawer: {
    backgroundColor: "#ffffff",
    elevation: 16,
    height: "100%",
    maxWidth: 340,
    position: "absolute",
    boxShadow: "10px 0px 30px rgba(15,23,42,0.2)",
    width: "86%",
    zIndex: 2,
    borderRightWidth: 1,
    borderRightColor: "#f1f5f9",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  scrollFlex: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  profile: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#135bec",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
    position: "relative",
    boxShadow: "0px 3px 5px rgba(19, 91, 236, 0.25)",
  },
  avatarOnlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#ffffff",
    position: "absolute",
    bottom: -1,
    right: -1,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  profileInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileName: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  rolePill: {
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  rolePillText: {
    color: "#135bec",
    fontSize: 10,
    fontWeight: "700",
  },
  profileEmail: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  contextCard: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 22,
    padding: 12,
    gap: 8,
  },
  contextHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contextTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  contextLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#135bec",
  },
  contextLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  contextSub: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  contextBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 9,
  },
  contextIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  contextTitleWrap: {
    flex: 1,
  },
  contextName: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
  },
  contextHint: {
    color: "#64748b",
    fontSize: 11,
  },
  categoryTitle: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  navPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 8,
    gap: 10,
    position: "relative",
  },
  navPillActive: {
    backgroundColor: "#eff6ff",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxDefault: {
    backgroundColor: "#f1f5f9",
  },
  iconBoxActive: {
    backgroundColor: "#135bec",
  },
  navPillLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  navPillLabelActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  activeIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#135bec",
  },
  sectionContainer: {
    marginBottom: 4,
  },
  sectionTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  sectionTriggerExpanded: {
    backgroundColor: "#f8fafc",
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sectionLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionLabelActive: {
    color: "#0f172a",
    fontWeight: "700",
  },
  subItemsList: {
    position: "relative",
    paddingTop: 4,
    paddingBottom: 6,
    paddingLeft: 22,
  },
  subTreeLine: {
    position: "absolute",
    left: 23,
    top: 4,
    bottom: 12,
    width: 1.5,
    backgroundColor: "#e2e8f0",
  },
  subItemsColumn: {
    gap: 2,
    paddingLeft: 14,
  },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 8,
  },
  subItemActive: {
    backgroundColor: "#eff6ff",
  },
  subDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#cbd5e1",
  },
  subDotActive: {
    backgroundColor: "#135bec",
  },
  subItemLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  subItemLabelActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  pinnedFooter: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  footerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  footerText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
  },
});
