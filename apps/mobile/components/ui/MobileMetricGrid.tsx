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
  icon?: any;
}

export function MobileMetricItem({
  label,
  value,
  hint,
  valueColor = mobileTheme.colors.textHeading,
  style,
  valueStyle,
  icon: Icon,
}: MobileMetricItemProps) {
  return (
    <View style={[styles.item, style]}>
      <View style={styles.labelRow}>
        {Icon ? (
          <View style={styles.iconWrap}>
            <Icon size={12} color={mobileTheme.colors.textMuted} />
          </View>
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
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

export interface MobileMetricDef {
  id?: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  subtext?: string;
  status?: "info" | "success" | "warning" | "destructive" | "neutral";
  valueColor?: string;
  icon?: any;
}

export interface MobileMetricGridProps {
  children?: React.ReactNode;
  metrics?: MobileMetricDef[];
  columns?: 2 | 3;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function MobileMetricGrid({
  children,
  metrics,
  columns = 2,
  bordered = true,
  style,
}: MobileMetricGridProps) {
  const statusColorMap = {
    info: mobileTheme.colors.primary,
    success: "#15803d",
    warning: "#ca8a04",
    destructive: "#dc2626",
    neutral: mobileTheme.colors.textHeading,
  };

  return (
    <View
      style={[
        styles.grid,
        bordered && styles.bordered,
        columns === 3 && styles.gridCols3,
        style,
      ]}
    >
      {metrics
        ? metrics.map((m, idx) => (
            <MobileMetricItem
              key={m.id || idx}
              label={m.label}
              value={m.value}
              hint={m.subtext || m.hint}
              valueColor={
                m.valueColor ||
                (m.status ? statusColorMap[m.status] : mobileTheme.colors.textHeading)
              }
              icon={m.icon}
            />
          ))
        : children}
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  iconWrap: {
    marginRight: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  customValueWrap: {
    marginTop: 2,
  },
  hint: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
    marginTop: 2,
  },
});
