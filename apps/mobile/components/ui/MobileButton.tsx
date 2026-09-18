import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { mobileTheme } from "../../theme/tokens";

export type MobileButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "destructive"
  | "secondary";

export type MobileButtonSize = "sm" | "md" | "lg";

export interface MobileButtonProps {
  label: string;
  onPress: () => void;
  variant?: MobileButtonVariant;
  size?: MobileButtonSize;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export function MobileButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  style,
  labelStyle,
  fullWidth = false,
}: MobileButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline" || variant === "ghost"
              ? mobileTheme.colors.primary
              : "#ffffff"
          }
        />
      ) : (
        <View style={styles.contentRow}>
          {iconLeft ? <View style={styles.iconLeft}>{iconLeft}</View> : null}
          <Text
            style={[
              styles.label,
              styles[`${variant}Label` as keyof typeof styles],
              styles[`${size}Label` as keyof typeof styles],
              labelStyle,
            ]}
          >
            {label}
          </Text>
          {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: mobileTheme.radii.md,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  // Variants
  primary: {
    backgroundColor: mobileTheme.colors.primary,
  },
  primaryLabel: {
    color: "#ffffff",
    fontWeight: "700",
  },

  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  outlineLabel: {
    color: mobileTheme.colors.textHeading,
    fontWeight: "600",
  },

  ghost: {
    backgroundColor: "transparent",
  },
  ghostLabel: {
    color: mobileTheme.colors.primary,
    fontWeight: "600",
  },

  destructive: {
    backgroundColor: mobileTheme.colors.danger,
  },
  destructiveLabel: {
    color: "#ffffff",
    fontWeight: "700",
  },

  secondary: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
  },
  secondaryLabel: {
    color: mobileTheme.colors.textHeading,
    fontWeight: "600",
  },

  // Sizes
  sm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 36,
  },
  smLabel: {
    fontSize: 12,
  },

  md: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
  },
  mdLabel: {
    fontSize: 13,
  },

  lg: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 50,
  },
  lgLabel: {
    fontSize: 15,
  },

  label: {
    textAlign: "center",
  },
  iconLeft: {
    marginRight: 2,
  },
  iconRight: {
    marginLeft: 2,
  },
});
