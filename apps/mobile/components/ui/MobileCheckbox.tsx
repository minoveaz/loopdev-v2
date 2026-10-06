import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Check } from "lucide-react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function MobileCheckbox({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  style,
}: MobileCheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      style={({ pressed }) => [
        styles.container,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      hitSlop={8}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Check size={13} color="#ffffff" strokeWidth={3} /> : null}
      </View>
      {label || description ? (
        <View style={styles.textWrap}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 44,
    paddingVertical: 8,
    gap: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: mobileTheme.radii.xs,
    borderWidth: 1.5,
    borderColor: mobileTheme.colors.borderSubtle,
    backgroundColor: mobileTheme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  boxChecked: {
    backgroundColor: mobileTheme.colors.primary,
    borderColor: mobileTheme.colors.primary,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: mobileTheme.colors.textHeading,
  },
  description: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
});
