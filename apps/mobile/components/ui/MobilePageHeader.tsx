import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "../../theme/tokens";

interface MobilePageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionButton?: {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
  };
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
  };
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export function MobilePageHeader({
  eyebrow = "SALES CRM",
  title,
  subtitle,
  actionButton,
  primaryAction,
  onBack,
  rightAction,
}: MobilePageHeaderProps) {
  const action = actionButton ?? primaryAction;
  return (
    <View style={styles.heading}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack}><Text style={styles.back}>‹</Text></Pressable> : null}
      <View style={styles.textColumn}>
        {eyebrow ? (
          <View style={styles.eyebrowRow}>
            <View style={styles.liveDot} />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ?? (action ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          style={styles.button}
        >
          {action.icon}
          <Text style={styles.buttonText}>{action.label}</Text>
        </Pressable>
      ) : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 16,
  },
  textColumn: {
    flex: 1,
    paddingRight: 10,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: mobileTheme.colors.primary,
  },
  eyebrow: {
    ...mobileTheme.typography.eyebrow,
  },
  title: {
    ...mobileTheme.typography.title,
    marginTop: 4,
  },
  subtitle: {
    ...mobileTheme.typography.subtitle,
  },
  button: {
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  buttonText: {
    color: mobileTheme.colors.textInverse,
    fontWeight: "800",
    fontSize: 13,
  },
  back: { fontSize: 30, color: mobileTheme.colors.textMuted, marginRight: 8 },
});
