import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityRole?: "button" | "none";
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
  selected?: boolean;
}

export function MobileCard({
  children,
  onPress,
  accessibilityRole,
  style,
  accentColor,
  selected = false,
}: MobileCardProps) {
  const containerStyle = [
    styles.card,
    accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null,
    selected && styles.selected,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole}
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

export function MobileCardHeader({
  title,
  subtitle,
  rightAction,
  style,
}: {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerTextWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
}

export function MobileCardBody({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.body, style]}>{children}</View>;
}

export function MobileCardFooter({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: mobileTheme.radii.card,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    padding: 14,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      },
      default: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  selected: {
    borderColor: mobileTheme.colors.primary,
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
  },
  subtitle: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
    marginTop: 2,
  },
  rightAction: {
    alignItems: "flex-end",
  },
  body: {
    marginVertical: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
  },
});
