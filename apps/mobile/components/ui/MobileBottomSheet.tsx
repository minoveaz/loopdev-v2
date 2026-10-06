import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { X } from "lucide-react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: DimensionValue;
  height?: DimensionValue;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export function MobileBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = 520,
  height,
  contentStyle,
  style,
}: MobileBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={[styles.sheet, { maxHeight, ...(height ? { height } : {}) }, style]}>
          {/* Drag Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal"
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={10}
            >
              <X size={18} color={mobileTheme.colors.textMuted} />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollFlex}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {/* Optional Footer */}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: mobileTheme.colors.surface,
    borderTopLeftRadius: mobileTheme.radii.sheet,
    borderTopRightRadius: mobileTheme.radii.sheet,
    paddingTop: 10,
    ...Platform.select({
      web: {
        boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
      },
      default: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 6,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: mobileTheme.colors.borderSubtle,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: mobileTheme.colors.borderLight,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: mobileTheme.colors.textHeading,
  },
  subtitle: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: mobileTheme.radii.sm,
    backgroundColor: mobileTheme.colors.surfaceMuted,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  scrollFlex: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
    backgroundColor: mobileTheme.colors.surface,
  },
});
