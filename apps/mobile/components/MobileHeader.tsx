import { Bell, Menu, Search } from "lucide-react-native";
import type { ReactNode } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { BrandMark } from "./BrandMark";

type MobileHeaderProps = {
  onAccountPress?: () => void;
  onMenuPress?: () => void;
  leading?: ReactNode;
  showActions?: boolean;
};

export function MobileHeader({
  onAccountPress,
  onMenuPress,
  leading,
  showActions = true,
}: MobileHeaderProps) {
  return (
    <View style={styles.topBar}>
      <View style={styles.leadingGroup}>
        <Pressable
          accessibilityLabel="Open navigation"
          accessibilityRole="button"
          onPress={onMenuPress}
          style={styles.topBarButton}
        >
          <Menu color="#64748b" size={20} strokeWidth={2.2} />
        </Pressable>
        {leading}
        <BrandMark />
      </View>
      <View style={styles.topBarActions}>
        {showActions && (
          <>
            <Pressable
              accessibilityLabel="Search"
              accessibilityRole="button"
              onPress={() => Alert.alert("Search", "Global search will be available here.")}
              style={styles.topBarButton}
            >
              <Search color="#64748b" size={18} strokeWidth={2.2} />
            </Pressable>
            <Pressable
              accessibilityLabel="Notifications"
              accessibilityRole="button"
              onPress={() => Alert.alert("Notifications", "You are all caught up.")}
              style={styles.topBarButton}
            >
              <Bell color="#64748b" size={18} strokeWidth={2.2} />
            </Pressable>
          </>
        )}
        <Pressable
          accessibilityLabel="Account menu"
          accessibilityRole="button"
          onPress={onAccountPress}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>MC</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  leadingGroup: { alignItems: "center", flexDirection: "row", gap: 12 },
  topBarActions: { alignItems: "center", flexDirection: "row", gap: 10 },
  topBarButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#135bec",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  avatarText: { color: "#ffffff", fontSize: 11, fontWeight: "800" },
});
