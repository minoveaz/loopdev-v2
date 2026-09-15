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
}

export function MobilePageHeader({
  eyebrow = "SALES CRM",
  title,
  subtitle,
  actionButton,
}: MobilePageHeaderProps) {
  return (
    <View style={styles.heading}>
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
      {actionButton ? (
        <Pressable
          accessibilityRole="button"
          onPress={actionButton.onPress}
          style={styles.button}
        >
          {actionButton.icon}
          <Text style={styles.buttonText}>{actionButton.label}</Text>
        </Pressable>
      ) : null}
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
});
