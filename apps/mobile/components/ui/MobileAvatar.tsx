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

export type MobileAvatarSize = "xs" | "sm" | "md" | "lg";

export interface MobileAvatarProps {
  name: string;
  size?: MobileAvatarSize;
  badge?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const PALETTE = [
  { bg: "#eff6ff", text: "#1d4ed8" },
  { bg: "#f0fdf4", text: "#15803d" },
  { bg: "#fefce8", text: "#a16207" },
  { bg: "#fdf2f8", text: "#be185d" },
  { bg: "#faf5ff", text: "#7e22ce" },
  { bg: "#f0f9ff", text: "#0369a1" },
  { bg: "#f8fafc", text: "#475569" },
];

function getInitials(name: string): string {
  if (!name.trim()) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

export function MobileAvatar({
  name,
  size = "md",
  badge,
  style,
  textStyle,
}: MobileAvatarProps) {
  const initials = getInitials(name);
  const color = getColor(name);

  return (
    <View style={[styles.container, styles[size], { backgroundColor: color.bg }, style]}>
      <Text style={[styles.initials, styles[`${size}Text` as keyof typeof styles], { color: color.text }, textStyle]}>
        {initials}
      </Text>
      {badge ? <View style={styles.badgeWrap}>{badge}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    position: "relative",
  },
  initials: {
    fontWeight: "700",
  },
  xs: {
    width: 24,
    height: 24,
  },
  xsText: {
    fontSize: 10,
  },
  sm: {
    width: 32,
    height: 32,
  },
  smText: {
    fontSize: 12,
  },
  md: {
    width: 40,
    height: 40,
  },
  mdText: {
    fontSize: 14,
  },
  lg: {
    width: 50,
    height: 50,
  },
  lgText: {
    fontSize: 18,
  },
  badgeWrap: {
    position: "absolute",
    bottom: -2,
    right: -2,
  },
});
