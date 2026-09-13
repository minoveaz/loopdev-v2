import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Settings,
  Users,
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

type MobileNavigationDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

type DrawerItem = {
  id: string;
  label: string;
  path: string;
};

const groupIcons: Record<string, LucideIcon> = {
  crm: Users,
  erp: Boxes,
  settings: Settings,
};

const sections = loopdevNavigationContract.groups.map((group) => ({
  ...group,
  icon: groupIcons[group.iconKey],
}));

export function MobileNavigationDrawer({
  visible,
  onClose,
}: MobileNavigationDrawerProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const translateX = useRef(new Animated.Value(-500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    translateX.setValue(-500);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateX, {
        duration: 240,
        toValue: 0,
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        duration: 180,
        toValue: 1,
        useNativeDriver: false,
      }),
    ]).start();
  }, [backdropOpacity, translateX, visible]);

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
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.profileHeader}>
              <View style={styles.profile}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>MC</Text>
                </View>
                <View>
                  <Text style={styles.profileName}>Admin</Text>
                  <Text style={styles.profileEmail}>admin@loopdev.app</Text>
                </View>
              </View>
            <Pressable
              accessibilityLabel="Close navigation"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
            </View>

            <View style={styles.contextCard}>
              <Text style={styles.contextLabel}>ACTIVE SUITE</Text>
              <Text style={styles.contextName}>Launchpad</Text>
              <Text style={styles.contextHint}>Select a work context</Text>
              <Text style={styles.contextArrow}>›</Text>
            </View>

            {sections.map((section) => {
              const expanded = expandedSection === section.label;
              const SectionIcon = expanded ? ChevronDown : ChevronRight;
              const GroupIcon = section.icon;

              return (
                <View key={section.label} style={styles.section}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    onPress={() =>
                      setExpandedSection(expanded ? null : section.label)
                    }
                    style={styles.sectionTrigger}
                  >
                    <View style={styles.sectionTitle}>
                      <GroupIcon color="#64748b" size={20} strokeWidth={2} />
                      <Text style={styles.sectionLabel}>{section.label}</Text>
                    </View>
                    <SectionIcon color="#64748b" size={19} strokeWidth={2.2} />
                  </Pressable>
                  {expanded &&
                    section.items.map((item: DrawerItem) => (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        onPress={onClose}
                        style={styles.item}
                      >
                        <Text style={styles.itemLabel}>{item.label}</Text>
                      </Pressable>
                    ))}
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            accessibilityLabel="Close navigation"
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
  overlay: { flex: 1, position: "relative" },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15,23,42,0.3)",
    zIndex: 1,
  },
  drawer: {
    backgroundColor: "#ffffff",
    elevation: 14,
    height: "100%",
    maxWidth: 380,
    position: "absolute",
    shadowColor: "#0f172a",
    shadowOffset: { height: 0, width: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    width: "86%",
    zIndex: 2,
  },
  closeButton: {
    alignItems: "center",
    borderColor: "#e5e7eb",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  closeText: { color: "#64748b", fontSize: 28, fontWeight: "300", lineHeight: 28 },
  content: { paddingBottom: 30, paddingHorizontal: 22, paddingTop: 28 },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  profile: { alignItems: "center", flexDirection: "row", gap: 12, flex: 1 },
  avatar: {
    alignItems: "center",
    backgroundColor: "#135bec",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  avatarText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  profileName: { color: "#111827", fontSize: 17, fontWeight: "800", marginBottom: 3 },
  profileEmail: { color: "#64748b", fontSize: 12 },
  contextCard: {
    borderColor: "#e5e7eb",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 30,
    padding: 16,
    position: "relative",
  },
  contextLabel: { color: "#64748b", fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  contextName: { color: "#111827", fontSize: 16, fontWeight: "700", marginTop: 7 },
  contextHint: { color: "#64748b", fontSize: 12, marginTop: 5 },
  contextArrow: { color: "#135bec", fontSize: 30, position: "absolute", right: 16, top: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { alignItems: "center", flexDirection: "row", gap: 12 },
  sectionTrigger: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
  },
  sectionLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 8,
  },
  item: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 48,
    paddingLeft: 32,
    paddingVertical: 5,
  },
  itemLabel: { color: "#111827", fontSize: 16, fontWeight: "600", marginLeft: 16 },
});
