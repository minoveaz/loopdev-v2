import { Boxes, House, MessageCircle, MoreHorizontal, Plus, Users } from "lucide-react-native";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getBottomNavigationItems, type BottomNavigationContext } from "../../../packages/contracts/src/navigation";
import { BrandInfinityIcon } from "./BrandMark";

export type MobileTab = "launchpad" | "conversations" | "copilot" | "crm" | "erp" | "more";

type MobileBottomNavProps = {
  context: BottomNavigationContext;
  activeTab: MobileTab;
  onTabPress: (tab: MobileTab) => void;
  onActionPress: () => void;
};

type BottomNavIcon = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

const icons: Record<string, BottomNavIcon> = {
  conversations: MessageCircle,
  crm: Users,
  erp: Boxes,
  launchpad: House,
  more: MoreHorizontal,
  copilot: BrandInfinityIcon,
};

export function MobileBottomNav({ context, activeTab, onTabPress, onActionPress }: MobileBottomNavProps) {
  const tabs: { label: string; tab: MobileTab; icon: BottomNavIcon }[] = getBottomNavigationItems().map((item) => ({
    label: item.label,
    tab: item.slot === "copilot" ? "copilot" : item.slot,
    icon: icons[item.iconKey],
  }));

  return (
    <View style={styles.bottomNav}>
      {tabs.map(({ label, tab, icon: Icon }) => {
        const active = activeTab === tab;
        const isCopilot = tab === "copilot";
        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onTabPress(tab)}
            style={styles.navItem}
          >
            <Icon
              color={active ? "#135bec" : "#94a3b8"}
              size={21}
              strokeWidth={isCopilot ? 10 : active ? 2.5 : 2}
            />
            <Text style={[styles.navLabel, active && styles.activeNavLabel]}>{label}</Text>
          </Pressable>
        );
      })}
      <Pressable
        accessibilityLabel="Open contextual actions"
        accessibilityRole="button"
        onPress={onActionPress}
        style={styles.actionButton}
      >
        <Plus color="#ffffff" size={26} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
    position: "relative",
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#135bec",
    borderColor: "#ffffff",
    borderRadius: 28,
    borderWidth: 4,
    elevation: 8,
    height: 56,
    justifyContent: "center",
    left: "50%",
    marginLeft: -28,
    position: "absolute",
    boxShadow: "0px 4px 8px rgba(19,91,236,0.28)",
    top: -28,
    width: 56,
  },
  navItem: { alignItems: "center", gap: 4, minWidth: 68, paddingHorizontal: 8 },
  navLabel: { color: "#64748b", fontSize: 10, fontWeight: "600" },
  activeNavLabel: { color: "#135bec", fontWeight: "800" },
});
