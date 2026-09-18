import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileMetricItemProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  valueColor?: string;
  style?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

export function MobileMetricItem({
  label,
  value,
  hint,
  valueColor = mobileTheme.colors.textHeading,
  style,
  valueStyle,
}: MobileMetricItemProps) {
  return (
    <View style={[styles.item, style]}>
      <Text style={styles.label}>{label}</Text>
      {typeof value === "string" || typeof value === "number" ? (
        <Text
          style={[styles.value, { color: valueColor }, valueStyle]}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : (
        <View style={styles.customValueWrap}>{value}</View>
      )}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export interface MobileMetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function MobileMetricGrid({
  children,
  columns = 2,
  bordered = true,
  style,
}: MobileMetricGridProps) {
  return (
    <View
      style={[
        styles.grid,
        bordered && styles.bordered,
        columns === 3 && styles.gridCols3,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    borderRadius: mobileTheme.radii.md,
    gap: 12,
  },
  bordered: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  gridCols3: {
    gap: 8,
  },
  item: {
    flex: 1,
    minWidth: "45%",
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
  },
  customValueWrap: {
    marginTop: 2,
  },
  hint: {
    fontSize: 11,
    color: mobileTheme.colors.textSubtle,
    marginTop: 2,
  },
});
