import React from "react";
import {
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileTabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  dotColor?: string;
  icon?: React.ReactNode;
}

export interface MobilePageTabsProps<T extends string = string> {
  tabs: MobileTabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * MobilePageTabs
 * ---------------
 * Canonical horizontal tabs strip for Rivera Mobile.
 * Strictly adheres to clean tab styling (NO rounded pills),
 * featuring a 2.5px bottom active indicator, active count badges,
 * and accessible touch targets (>= 44px).
 */
export function MobilePageTabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  containerStyle,
  contentContainerStyle,
}: MobilePageTabsProps<T>) {
  return (
    <View style={[styles.container, containerStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label}${tab.count !== undefined ? `, ${tab.count}` : ""}`}
              onPress={() => onTabChange(tab.id)}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
            >
              {tab.dotColor ? (
                <View style={[styles.dot, { backgroundColor: tab.dotColor }]} />
              ) : null}
              {tab.icon ? <View style={styles.iconWrap}>{tab.icon}</View> : null}
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.count !== undefined ? (
                <View style={[styles.badge, isActive && styles.badgeActive]}>
                  <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: mobileTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: mobileTheme.colors.border,
  },
  scrollContent: {
    paddingHorizontal: mobileTheme.spacing.pageHorizontal,
    gap: 20,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 12,
    minHeight: 44,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: mobileTheme.colors.primary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconWrap: {
    marginRight: -2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: mobileTheme.colors.textMuted,
  },
  tabLabelActive: {
    color: mobileTheme.colors.textHeading,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeActive: {
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
  },
  badgeTextActive: {
    color: mobileTheme.colors.primary,
  },
});
