import React, { ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RotateCcw, X } from "lucide-react-native";
import { mobileTheme } from "../../theme/tokens";

export interface ControlSheetPreset {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size: number; color: string }>;
  active?: boolean;
  onSelect: () => void;
}

export interface MobileControlSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  activeFilterCount?: number;
  presets?: ControlSheetPreset[];
  children: ReactNode;
  onReset?: () => void;
  onApply?: () => void;
  resultCount?: number;
  applyLabel?: string;
  resetLabel?: string;
}

export function MobileControlSheet({
  visible,
  onClose,
  title,
  eyebrow = "LOOPDEV CRM",
  activeFilterCount = 0,
  presets,
  children,
  onReset,
  onApply,
  resultCount,
  applyLabel,
  resetLabel = "Limpiar",
}: MobileControlSheetProps) {
  const handleApply = () => {
    if (onApply) {
      onApply();
    } else {
      onClose();
    }
  };

  const finalApplyLabel =
    applyLabel ||
    (typeof resultCount === "number"
      ? `Ver ${resultCount} ${resultCount === 1 ? "resultado" : "resultados"}`
      : "Aplicar filtros");

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Cerrar panel"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View
          onStartShouldSetResponder={() => true}
          style={styles.sheetContainer}
        >
          {/* 1. Drag Handle */}
          <View style={styles.handle} />

          {/* 2. Header Area */}
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
              <View style={styles.titleRow}>
                <Text accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>
                {activeFilterCount > 0 && (
                  <View style={styles.activeCountBadge}>
                    <Text style={styles.activeCountText}>{activeFilterCount}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.headerActions}>
              {onReset && activeFilterCount > 0 && (
                <Pressable
                  accessibilityLabel="Restablecer filtros"
                  accessibilityRole="button"
                  onPress={onReset}
                  style={styles.headerResetButton}
                  hitSlop={8}
                >
                  <RotateCcw size={14} color={mobileTheme.colors.primary} />
                  <Text style={styles.headerResetText}>Reset</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityLabel="Cerrar"
                accessibilityRole="button"
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={8}
              >
                <X size={18} color={mobileTheme.colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* 3. HubSpot 1-Tap Smart Presets Strip */}
          {presets && presets.length > 0 && (
            <View style={styles.presetsContainer}>
              <Text style={styles.presetsLabel}>VISTAS INTELIGENTES</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsScroll}
              >
                {presets.map((preset) => {
                  const PresetIcon = preset.icon;
                  const isActive = !!preset.active;
                  return (
                    <Pressable
                      key={preset.id}
                      onPress={preset.onSelect}
                      style={[
                        styles.presetChip,
                        isActive && styles.presetChipActive,
                      ]}
                    >
                      {PresetIcon && (
                        <PresetIcon
                          size={13}
                          color={
                            isActive
                              ? mobileTheme.colors.textInverse
                              : mobileTheme.colors.primary
                          }
                        />
                      )}
                      <Text
                        style={[
                          styles.presetChipText,
                          isActive && styles.presetChipTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 4. Scrollable Structured Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollBodyContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {children}
          </ScrollView>

          {/* 5. Sticky Footer Action Bar */}
          <View style={styles.footer}>
            {onReset && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpiar todos los filtros"
                onPress={onReset}
                style={styles.footerResetButton}
              >
                <Text style={styles.footerResetText}>{resetLabel}</Text>
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={finalApplyLabel}
              onPress={handleApply}
              style={[
                styles.footerApplyButton,
                !onReset && { flex: 1 },
              ]}
            >
              <Text style={styles.footerApplyText}>{finalApplyLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "92%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    ...mobileTheme.shadows.card,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#cbd5e1",
    borderRadius: 99,
    height: 4,
    marginTop: 10,
    marginBottom: 8,
    width: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: mobileTheme.colors.borderLight,
  },
  headerTitleCol: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.primary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: mobileTheme.colors.textHeading,
    fontSize: 19,
    fontWeight: "800",
  },
  activeCountBadge: {
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
  },
  activeCountText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerResetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: mobileTheme.radii.sm,
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  headerResetText: {
    color: mobileTheme.colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  presetsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: mobileTheme.colors.borderLight,
  },
  presetsLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: mobileTheme.colors.textSubtle,
    letterSpacing: 1,
    marginBottom: 6,
  },
  presetsScroll: {
    gap: 6,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  presetChipActive: {
    backgroundColor: mobileTheme.colors.primary,
    borderColor: mobileTheme.colors.primary,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  presetChipTextActive: {
    color: "#ffffff",
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollBodyContent: {
    paddingVertical: 16,
    gap: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
    backgroundColor: "#ffffff",
  },
  footerResetButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 13,
  },
  footerResetText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  footerApplyButton: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 13,
    ...mobileTheme.shadows.sm,
  },
  footerApplyText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});
