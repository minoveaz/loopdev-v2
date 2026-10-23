import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "../theme/tokens";

type MobileModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  fullHeight?: boolean;
  scrollable?: boolean;
};

export function MobileModalSheet({
  visible,
  onClose,
  title,
  header,
  children,
  footer,
  fullHeight = false,
  scrollable = true,
}: MobileModalSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Cerrar modal" accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <View onStartShouldSetResponder={() => true} style={[styles.sheet, fullHeight && styles.fullHeight]}>
          <View style={styles.handle} />
          {header ?? (title ? <Text accessibilityRole="header" style={styles.title}>{title}</Text> : null)}
          {scrollable ? (
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollBodyContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

export function MobileConfirmDialog({ visible, title, description, cancelLabel = "Cancelar", confirmLabel = "Confirmar", destructive = false, onCancel, onConfirm }: {
  visible: boolean;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
    <View style={styles.confirmOverlay}>
      <Pressable accessibilityLabel="Close confirmation" accessibilityRole="button" onPress={onCancel} style={styles.backdrop} />
      <View onStartShouldSetResponder={() => true} style={styles.confirmCard}>
        <Text accessibilityRole="header" style={styles.confirmTitle}>{title}</Text>
        <Text style={styles.confirmDescription}>{description}</Text>
        <View style={styles.confirmActions}><Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>{cancelLabel}</Text></Pressable><Pressable accessibilityRole="button" onPress={onConfirm} style={[styles.confirmButton, destructive && styles.destructiveButton]}><Text style={styles.confirmText}>{confirmLabel}</Text></Pressable></View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: "rgba(15,23,42,0.42)", flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill },
  sheet: { backgroundColor: mobileTheme.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "90%", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, display: "flex", flexDirection: "column" },
  fullHeight: { height: "92%" },
  handle: { alignSelf: "center", backgroundColor: mobileTheme.colors.borderSubtle, borderRadius: 99, height: 4, marginBottom: 14, width: 38 },
  title: { color: mobileTheme.colors.textHeading, fontSize: 18, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  body: { minHeight: 0 },
  scrollBody: { flexShrink: 1 },
  scrollBodyContent: { paddingBottom: 20 },
  footer: { borderTopColor: mobileTheme.colors.border, borderTopWidth: 1, marginTop: 16, paddingTop: 14 },
  confirmOverlay: { alignItems: "center", backgroundColor: "rgba(15,23,42,0.5)", flex: 1, justifyContent: "center", padding: 22 },
  confirmCard: { backgroundColor: mobileTheme.colors.surface, borderRadius: 16, maxWidth: 440, padding: 22, width: "100%" },
  confirmTitle: { color: mobileTheme.colors.textHeading, fontSize: 19, fontWeight: "800" },
  confirmDescription: { color: mobileTheme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  confirmActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 22 },
  cancelButton: { backgroundColor: mobileTheme.colors.surfaceMuted, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 12 },
  cancelText: { color: mobileTheme.colors.textMain, fontSize: 14, fontWeight: "700" },
  confirmButton: { backgroundColor: mobileTheme.colors.primary, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 12 },
  destructiveButton: { backgroundColor: mobileTheme.colors.danger },
  confirmText: { color: mobileTheme.colors.textInverse, fontSize: 14, fontWeight: "800" },
});
