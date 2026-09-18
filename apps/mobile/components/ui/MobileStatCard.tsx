import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileStatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  valueColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function MobileStatCard({
  label,
  value,
  subtitle,
  icon,
  iconBgColor = mobileTheme.colors.primarySoft,
  valueColor = mobileTheme.colors.textHeading,
  style,
}: MobileStatCardProps) {
  return (
    <View style={[styles.card, style]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
          {icon}
        </View>
      ) : null}
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: mobileTheme.radii.card,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    padding: 12,
    minWidth: 130,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 11,
    color: mobileTheme.colors.textSubtle,
    marginTop: 2,
  },
});
