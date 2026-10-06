import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileLoadingStateProps {
  message?: string;
  style?: StyleProp<ViewStyle>;
}

export function MobileLoadingState({
  message = "Cargando datos...",
  style,
}: MobileLoadingStateProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={mobileTheme.colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    paddingHorizontal: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "500",
    color: mobileTheme.colors.textMuted,
    textAlign: "center",
  },
});
