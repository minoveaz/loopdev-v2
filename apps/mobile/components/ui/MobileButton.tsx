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
  label?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: MobileButtonVariant;
  size?: MobileButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: any;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
  minHeight?: number;
}

export function MobileButton({
  label,
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconLeft,
  iconRight,
  style,
  labelStyle,
  fullWidth = false,
  minHeight,
}: MobileButtonProps) {
  const isDisabled = disabled || loading;

  const displayLabel = label || (typeof children === "string" ? children : "");
  const effectiveIconLeft =
    iconLeft ??
    (icon
      ? React.isValidElement(icon)
        ? icon
        : React.createElement(icon, {
            size: size === "sm" ? 14 : size === "lg" ? 18 : 16,
            color:
              variant === "outline" || variant === "ghost"
                ? mobileTheme.colors.primary
                : variant === "destructive"
                ? mobileTheme.colors.danger
                : variant === "secondary"
                ? mobileTheme.colors.textHeading
                : mobileTheme.colors.textInverse,
          })
      : null);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={displayLabel || "Acción"}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        minHeight ? { minHeight } : null,
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
              : mobileTheme.colors.textInverse
          }
        />
      ) : (
        <View style={styles.contentRow}>
          {effectiveIconLeft ? <View style={styles.iconLeft}>{effectiveIconLeft}</View> : null}
          {displayLabel ? (
            <Text
              style={[
                styles.label,
                styles[`${variant}Label` as keyof typeof styles],
                styles[`${size}Label` as keyof typeof styles],
                labelStyle,
              ]}
            >
              {displayLabel}
            </Text>
          ) : typeof children !== "string" ? (
            children
          ) : null}
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
    borderRadius: mobileTheme.radii.sm,
    paddingHorizontal: 16,
    minHeight: 44, // Rivera minimum touch target standard
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },

  // Variants
  primary: {
    backgroundColor: mobileTheme.colors.primary,
  },
  secondary: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: mobileTheme.colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  destructive: {
    backgroundColor: mobileTheme.colors.dangerBg,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dangerBorder,
  },

  // Sizes
  sm: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 36,
  },
  md: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 52,
  },

  // Labels
  label: {
    fontWeight: "700",
    textAlign: "center",
  },
  primaryLabel: {
    color: mobileTheme.colors.textInverse,
  },
  secondaryLabel: {
    color: mobileTheme.colors.textHeading,
  },
  outlineLabel: {
    color: mobileTheme.colors.primary,
  },
  ghostLabel: {
    color: mobileTheme.colors.primary,
  },
  destructiveLabel: {
    color: mobileTheme.colors.danger,
  },

  smLabel: {
    fontSize: 12,
  },
  mdLabel: {
    fontSize: 14,
  },
  lgLabel: {
    fontSize: 16,
  },
});
