import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "../../theme/tokens";

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ size: number; color: string }>;
  count?: number;
}

interface MobileSegmentedControlProps<T extends string> {
  options?: SegmentOption<T>[];
  segments?: SegmentOption<T>[];
  selected?: T;
  activeId?: T;
  onChange?: (id: T) => void;
  onSelect?: (id: T) => void;
  style?: object;
}

export function MobileSegmentedControl<T extends string>({
  options,
  segments,
  selected,
  activeId,
  onChange,
  onSelect,
  style,
}: MobileSegmentedControlProps<T>) {
  const items = options || segments || [];
  const currentSelected = selected ?? activeId;
  const handleSelect = onChange || onSelect || (() => {});

  return (
    <View style={[styles.container, style]}>
      {items.map((opt) => {
        const isActive = opt.id === currentSelected;
        const IconComponent = opt.icon;
        return (
          <Pressable
            key={opt.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => handleSelect(opt.id)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            {IconComponent && (
              <IconComponent
                size={14}
                color={isActive ? mobileTheme.colors.primary : mobileTheme.colors.textMuted}
              />
            )}
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {opt.label}
            </Text>
            {typeof opt.count === "number" && (
              <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                <Text style={[styles.countText, isActive && styles.countTextActive]}>
                  {opt.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderRadius: mobileTheme.radii.md,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: mobileTheme.radii.sm + 1,
  },
  tabActive: {
    backgroundColor: mobileTheme.colors.surface,
    ...mobileTheme.shadows.card,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: mobileTheme.colors.textMuted,
  },
  tabTextActive: {
    color: mobileTheme.colors.primary,
    fontWeight: "800",
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: mobileTheme.radii.pill,
    backgroundColor: mobileTheme.colors.surfaceHighlight,
  },
  countBadgeActive: {
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  countText: {
    fontSize: 10,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
  },
  countTextActive: {
    color: mobileTheme.colors.primary,
  },
});
