import React from "react";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileBackLinkProps {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * MobileBackLink
 * --------------
 * Canonical back navigation link for Rivera Mobile.
 * Renders an accessible 44px touch target with ArrowLeft icon and 700-weight blue text.
 * Used at the top of detail screens (Customer 360, Lead Detail, Opportunity Detail, etc.).
 */
export function MobileBackLink({ label, onPress, style }: MobileBackLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}
    >
      <ArrowLeft size={16} color={mobileTheme.colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    color: mobileTheme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
