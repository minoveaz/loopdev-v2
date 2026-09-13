import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type MobileModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  fullHeight?: boolean;
};

export function MobileModalSheet({ visible, onClose, title, header, children, footer, fullHeight = false }: MobileModalSheetProps) {
  return <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
    <View style={styles.overlay}>
      <Pressable accessibilityLabel="Close modal" accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
      <View onStartShouldSetResponder={() => true} style={[styles.sheet, fullHeight && styles.fullHeight]}>
        <View style={styles.handle} />
        {header ?? (title ? <Text accessibilityRole="header" style={styles.title}>{title}</Text> : null)}
        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </View>
  </Modal>;
}

export function MobileConfirmDialog({ visible, title, description, cancelLabel = "Cancel", confirmLabel = "Confirm", destructive = false, onCancel, onConfirm }: {
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
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "85%", padding: 20 },
  fullHeight: { height: "92%" },
  handle: { alignSelf: "center", backgroundColor: "#cbd5e1", borderRadius: 99, height: 4, marginBottom: 16, width: 38 },
  title: { color: "#111827", fontSize: 20, fontWeight: "800", marginBottom: 14, textAlign: "center" },
  body: { minHeight: 0 },
  footer: { borderTopColor: "#e2e8f0", borderTopWidth: 1, marginTop: 16, paddingTop: 14 },
  confirmOverlay: { alignItems: "center", backgroundColor: "rgba(15,23,42,0.5)", flex: 1, justifyContent: "center", padding: 22 },
  confirmCard: { backgroundColor: "#fff", borderRadius: 16, maxWidth: 440, padding: 22, width: "100%" },
  confirmTitle: { color: "#111827", fontSize: 19, fontWeight: "800" },
  confirmDescription: { color: "#64748b", fontSize: 14, lineHeight: 21, marginTop: 8 },
  confirmActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 22 },
  cancelButton: { backgroundColor: "#e2e8f0", borderRadius: 9, paddingHorizontal: 16, paddingVertical: 12 },
  cancelText: { color: "#334155", fontSize: 14, fontWeight: "700" },
  confirmButton: { backgroundColor: "#135bec", borderRadius: 9, paddingHorizontal: 16, paddingVertical: 12 },
  destructiveButton: { backgroundColor: "#dc2626" },
  confirmText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
