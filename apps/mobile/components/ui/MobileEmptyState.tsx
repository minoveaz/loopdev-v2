import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { mobileTheme } from "../../theme/tokens";
import { MobileButton } from "./MobileButton";

export interface MobileEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
    icon?: React.ReactNode;
  };
  style?: StyleProp<ViewStyle>;
}

export function MobileEmptyState({
  icon,
  title,
  description,
  action,
  style,
}: MobileEmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? (
        <View style={styles.actionWrap}>
          <MobileButton
            label={action.label}
            onPress={action.onPress}
            iconLeft={action.icon}
            variant="outline"
            size="sm"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: mobileTheme.colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  actionWrap: {
    marginTop: 18,
  },
});
