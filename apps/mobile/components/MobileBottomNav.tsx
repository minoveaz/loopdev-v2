import { Clock3, Grid2X2, House, UserCircle, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type MobileTab = "launchpad" | "activity" | "suites" | "account";

type MobileBottomNavProps = {
  activeTab: MobileTab;
  onTabPress: (tab: MobileTab) => void;
};

const tabs: { label: string; tab: MobileTab; icon: LucideIcon }[] = [
  { label: "Launchpad", tab: "launchpad", icon: House },
  { label: "Activity", tab: "activity", icon: Clock3 },
  { label: "Suites", tab: "suites", icon: Grid2X2 },
  { label: "Account", tab: "account", icon: UserCircle },
];

export function MobileBottomNav({ activeTab, onTabPress }: MobileBottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map(({ label, tab, icon: Icon }) => {
        const active = activeTab === tab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onTabPress(tab)}
            style={styles.navItem}
          >
            <Icon color={active ? "#135bec" : "#94a3b8"} size={21} strokeWidth={active ? 2.5 : 2} />
            <Text style={[styles.navLabel, active && styles.activeNavLabel]}>{label}</Text>
          </Pressable>
        );
      })}
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
  },
  navItem: { alignItems: "center", gap: 4, minWidth: 68, paddingHorizontal: 8 },
  navLabel: { color: "#64748b", fontSize: 10, fontWeight: "600" },
  activeNavLabel: { color: "#135bec", fontWeight: "800" },
});
