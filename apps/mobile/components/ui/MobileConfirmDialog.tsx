import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AlertTriangle, Info, Trash2 } from "lucide-react-native";
import { mobileTheme } from "../../theme/tokens";
import { MobileButton } from "./MobileButton";

export interface MobileConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function MobileConfirmDialog({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
}: MobileConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />
        <View style={styles.dialog}>
          <View
            style={[
              styles.iconWrap,
              destructive ? styles.iconWrapDestructive : styles.iconWrapPrimary,
            ]}
          >
            {destructive ? (
              <Trash2 size={22} color={mobileTheme.colors.danger} />
            ) : (
              <AlertTriangle size={22} color={mobileTheme.colors.primary} />
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <MobileButton
              label={cancelLabel}
              onPress={onClose}
              variant="outline"
              size="md"
              style={styles.actionBtn}
            />
            <MobileButton
              label={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? "destructive" : "primary"}
              size="md"
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dismissOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: mobileTheme.radii.card,
    padding: 20,
    alignItems: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
      },
      default: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconWrapPrimary: {
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  iconWrapDestructive: {
    backgroundColor: mobileTheme.colors.dangerBg,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: mobileTheme.colors.textHeading,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    color: mobileTheme.colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
  },
});
