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

export type MobileStatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "destructive";

export interface MobileStatusBadgeProps {
  children?: React.ReactNode;
  label?: string;
  status?: string;
  tone?: MobileStatusTone;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: "sm" | "md" | "lg";
}

export function MobileStatusBadge({
  children,
  label,
  status,
  tone = "neutral",
  dot = false,
  style,
  textStyle,
}: MobileStatusBadgeProps) {
  const config = toneStyles[tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        style,
      ]}
    >
      {dot ? (
        <View style={[styles.dot, { backgroundColor: config.text }]} />
      ) : null}
      <Text style={[styles.label, { color: config.text }, textStyle]}>
        {children ?? label ?? status}
      </Text>
    </View>
  );
}

const toneStyles: Record<
  MobileStatusTone,
  { bg: string; border: string; text: string }
> = {
  neutral: {
    bg: mobileTheme.colors.surfaceMuted,
    border: mobileTheme.colors.border,
    text: mobileTheme.colors.textMuted,
  },
  info: {
    bg: mobileTheme.colors.infoBg,
    border: mobileTheme.colors.infoBorder,
    text: mobileTheme.colors.info,
  },
  success: {
    bg: mobileTheme.colors.successBg,
    border: mobileTheme.colors.successBorder,
    text: mobileTheme.colors.success,
  },
  warning: {
    bg: mobileTheme.colors.warningBg,
    border: mobileTheme.colors.warningBorder,
    text: mobileTheme.colors.warning,
  },
  destructive: {
    bg: mobileTheme.colors.dangerBg,
    border: mobileTheme.colors.dangerBorder,
    text: mobileTheme.colors.danger,
  },
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: mobileTheme.radii.sm,
    borderWidth: 1,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
  },
});
