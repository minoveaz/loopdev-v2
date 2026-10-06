import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileInputProps extends TextInputProps {
  rows?: number;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function MobileInput({
  label,
  required,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: MobileInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.requiredStar}> *</Text> : null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputWrap,
          isFocused && styles.inputWrapFocused,
          Boolean(error) && styles.inputWrapError,
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor={mobileTheme.colors.textSubtle}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, style]}
          {...rest}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

export function MobileTextArea({
  numberOfLines = 3,
  ...props
}: MobileInputProps) {
  return (
    <MobileInput
      multiline
      numberOfLines={numberOfLines}
      style={[styles.textArea, props.style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
  },
  requiredStar: {
    color: mobileTheme.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  inputWrapFocused: {
    borderColor: mobileTheme.colors.primary,
    backgroundColor: "#ffffff",
  },
  inputWrapError: {
    borderColor: mobileTheme.colors.danger,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: mobileTheme.colors.textHeading,
    minHeight: 40,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 8,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 11,
    color: mobileTheme.colors.danger,
    marginTop: 4,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 11,
    color: mobileTheme.colors.textSubtle,
    marginTop: 4,
  },
});
