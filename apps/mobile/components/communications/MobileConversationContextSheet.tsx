import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, ChevronRight, ExternalLink, Package, XCircle } from "lucide-react-native";
import { MobileBottomSheet } from "../ui/MobileBottomSheet";
import { MobileCard } from "../ui/MobileCard";
import { MobileAvatar } from "../ui/MobileAvatar";
import { MobileStatusBadge, type MobileStatusTone } from "../ui/MobileStatusBadge";
import { mobileTheme } from "../../theme/tokens";
import type { ConversationSummary } from "../../../../src/loopdev/domains/communications";

export interface ConversationCustomerInfo {
  contactId?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  openOpportunityCount?: number;
  openOpportunityValue?: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  customer?: ConversationCustomerInfo | null;
  summary: ConversationSummary;
  onNavigateToContact?: (contactId: string) => void;
  onScheduleTask?: () => void;
  onInsertCatalogItem?: () => void;
  onCloseConversation?: () => void;
  onReopenConversation?: () => void;
}

export function MobileConversationContextSheet({
  visible,
  onClose,
  customer,
  summary,
  onNavigateToContact,
  onScheduleTask,
  onInsertCatalogItem,
  onCloseConversation,
  onReopenConversation,
}: Props) {
  const contactName = customer?.name || summary.contact?.displayName || "Contacto Desconocido";
  const contactMeta = customer?.email || customer?.phone || summary.contact?.phone || summary.contact?.email || "Sin canal directo";
  const channelDisplay = summary.channel.toUpperCase();
  const isClosed = summary.status === "closed";

  const statusTone: MobileStatusTone = isClosed
    ? "neutral"
    : summary.status === "pending"
    ? "warning"
    : "success";

  return (
    <MobileBottomSheet
      visible={visible}
      onClose={onClose}
      title="Ficha de Cliente & Operaciones"
    >
      <View style={styles.container}>
        {/* Customer Header Card */}
        <MobileCard style={styles.customerCard}>
          <View style={styles.customerRow}>
            <MobileAvatar name={contactName} size="lg" />
            <View style={styles.customerCopy}>
              <Text style={styles.customerName} numberOfLines={1}>
                {contactName}
              </Text>
              <Text style={styles.customerMeta} numberOfLines={1}>
                {contactMeta}
              </Text>
              <View style={styles.badgeRow}>
                <MobileStatusBadge tone="info">
                  {channelDisplay}
                </MobileStatusBadge>
                <MobileStatusBadge tone={statusTone} dot>
                  {summary.status.toUpperCase()}
                </MobileStatusBadge>
              </View>
            </View>
          </View>

          {customer?.contactId && onNavigateToContact ? (
            <Pressable
              style={({ pressed }) => [styles.view360Btn, pressed && { opacity: 0.75 }]}
              onPress={() => {
                onClose();
                onNavigateToContact(customer.contactId!);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.view360Text}>Ver Ficha Completa 360</Text>
              <ExternalLink size={14} color={mobileTheme.colors.primary} />
            </Pressable>
          ) : null}
        </MobileCard>

        {/* Commercial Context / Active Opportunity */}
        {Boolean(customer?.openOpportunityCount) && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>OPORTUNIDADES COMERCIALES ACTIVAS</Text>
            <MobileCard style={styles.dealCard}>
              <Text style={styles.dealName}>
                {customer?.openOpportunityCount} deal(s) comercial(es) abierto(s)
              </Text>
              <Text style={styles.dealValue}>
                Total estimado: {customer?.openOpportunityValue ? `$${customer.openOpportunityValue.toLocaleString()}` : "En cualificación"}
              </Text>
            </MobileCard>
          </View>
        )}

        {/* Quick Operations Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>ACCIONES IN-SITU</Text>

          {onScheduleTask ? (
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() => {
                onClose();
                onScheduleTask();
              }}
              accessibilityRole="button"
            >
              <View style={styles.actionIconWrap}>
                <CheckCircle2 size={18} color={mobileTheme.colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Agendar Tarea de Seguimiento</Text>
              <ChevronRight size={18} color={mobileTheme.colors.textSubtle} />
            </Pressable>
          ) : null}

          {onInsertCatalogItem ? (
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() => {
                onClose();
                onInsertCatalogItem();
              }}
              accessibilityRole="button"
            >
              <View style={styles.actionIconWrap}>
                <Package size={18} color={mobileTheme.colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Insertar Producto del Catálogo ERP</Text>
              <ChevronRight size={18} color={mobileTheme.colors.textSubtle} />
            </Pressable>
          ) : null}

          {isClosed ? (
            onReopenConversation ? (
              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
                onPress={() => {
                  onClose();
                  onReopenConversation();
                }}
                accessibilityRole="button"
              >
                <View style={[styles.actionIconWrap, { backgroundColor: mobileTheme.colors.successBg }]}>
                  <CheckCircle2 size={18} color={mobileTheme.colors.success} />
                </View>
                <Text style={[styles.actionLabel, { color: mobileTheme.colors.success }]}>
                  Reabrir Conversación
                </Text>
              </Pressable>
            ) : null
          ) : (
            onCloseConversation ? (
              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
                onPress={() => {
                  onClose();
                  onCloseConversation();
                }}
                accessibilityRole="button"
              >
                <View style={[styles.actionIconWrap, { backgroundColor: mobileTheme.colors.dangerBg }]}>
                  <XCircle size={18} color={mobileTheme.colors.danger} />
                </View>
                <Text style={[styles.actionLabel, { color: mobileTheme.colors.danger }]}>
                  Cerrar Ticket / Conversación
                </Text>
              </Pressable>
            ) : null
          )}
        </View>
      </View>
    </MobileBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 24,
    gap: 16,
  },
  customerCard: {
    padding: 16,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customerCopy: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "800",
    color: mobileTheme.colors.textMain,
  },
  customerMeta: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  view360Btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
  },
  view360Text: {
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  section: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: mobileTheme.colors.textMuted,
    letterSpacing: 0.8,
  },
  dealCard: {
    padding: 14,
  },
  dealName: {
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.textMain,
  },
  dealValue: {
    fontSize: 12,
    color: mobileTheme.colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radii.card,
    padding: 12,
    gap: 12,
    minHeight: 48,
  },
  actionRowPressed: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: mobileTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.textMain,
  },
});
