import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  tone?: string;
  labelPrefix?: string;
  style?: StyleProp<ViewStyle>;
}

export function MobileProgressBar({
  progress,
  color = mobileTheme.colors.primary,
  height = 6,
  showLabel = false,
  showPercentage = false,
  labelPrefix,
  style,
}: MobileProgressBarProps) {
  const bounded = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <View style={[styles.container, style]}>
      {showLabel || showPercentage ? (
        <View style={styles.labelRow}>
          {labelPrefix ? <Text style={styles.prefixText}>{labelPrefix}</Text> : <View />}
          <Text style={[styles.labelText, { color }]}>{bounded}%</Text>
        </View>
      ) : null}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${bounded}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  prefixText: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
  },
  labelText: {
    fontSize: 12,
    fontWeight: "700",
  },
  track: {
    width: "100%",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    borderRadius: 999,
  },
});
