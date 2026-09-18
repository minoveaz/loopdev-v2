import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Lock,
  Package,
  Phone,
  Play,
  Plus,
  Send,
  User,
  X,
} from "lucide-react-native";
import {
  MobilePageContainer,
  MobileBackLink,
  MobileAvatar,
  MobileLoadingState,
  MobileEmptyState,
} from "../ui";
import { mobileTheme } from "../../theme/tokens";
import { useT } from "../../i18n";
import { useCommunicationConversation } from "../../hooks/useMobileCommunications";
import { MobileConversationContextSheet, type ConversationCustomerInfo } from "./MobileConversationContextSheet";
import { MobileCatalogItemPickerSheet } from "./MobileCatalogItemPickerSheet";
import { mobileContactAdapter } from "../../adapters/contact";
import type { CatalogItem } from "../../adapters/catalog";
import {
  localCommunicationsAdapter,
  COMMUNICATIONS_LOCAL_CONTEXT,
  type CommunicationMessage,
  type ConversationStatus,
} from "../../../../src/loopdev/domains/communications";

interface Props {
  conversationId: string;
  onBack: () => void;
  onNavigateToContact?: (contactId: string) => void;
}

export function MobileConversationScreen({
  conversationId,
  onBack,
  onNavigateToContact,
}: Props) {
  const t = useT();
  const {
    conversation,
    loading,
    error,
    sendReply,
    addInternalNote,
    reload,
  } = useCommunicationConversation(conversationId);

  const [customerInfo, setCustomerInfo] = useState<ConversationCustomerInfo | null>(null);
  const [messageText, setMessageText] = useState("");
  const [composerMode, setComposerMode] = useState<"reply" | "internal">("reply");
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (conversation?.summary.contact?.id) {
      void mobileContactAdapter.getCustomer360(conversation.summary.contact.id).then((c360) => {
        if (c360) {
          const openOpps = (c360.opportunities || []).filter(
            (o) => o.stageKey !== "lost" && o.stageKey !== "won",
          );
          const totalValue = openOpps.reduce((sum, o) => sum + (o.amount || 0), 0);
          setCustomerInfo({
            contactId: c360.contact.id,
            name: `${c360.contact.firstName} ${c360.contact.lastName ?? ""}`.trim(),
            email: c360.contact.email,
            phone: c360.contact.phone,
            openOpportunityCount: openOpps.length,
            openOpportunityValue: totalValue,
          });
        }
      });
    }
  }, [conversation?.summary.contact?.id]);

  useEffect(() => {
    if (conversation?.messages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation?.messages.length]);

  if (loading) {
    return (
      <MobilePageContainer>
        <MobileBackLink
          label={t("crm.communications.back", "Volver a mensajes")}
          onPress={onBack}
        />
        <MobileLoadingState message="Cargando conversación..." />
      </MobilePageContainer>
    );
  }

  if (error || !conversation) {
    return (
      <MobilePageContainer>
        <MobileBackLink
          label={t("crm.communications.back", "Volver a mensajes")}
          onPress={onBack}
        />
        <MobileEmptyState
          title="Conversación no encontrada"
          description={error || "No pudimos cargar el hilo de mensajes."}
          action={{
            label: t("crm.communications.back", "Volver a mensajes"),
            onPress: onBack,
          }}
        />
      </MobilePageContainer>
    );
  }

  const { summary, messages } = conversation;
  const contactName = customerInfo?.name || summary.contact?.displayName || "Contacto";
  const channelDisplay = summary.channel.toUpperCase();

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text && !selectedCatalogItem) return;

    setSending(true);
    try {
      if (composerMode === "internal") {
        await addInternalNote(text);
      } else {
        if (selectedCatalogItem) {
          await sendReply(text || `Te comparto información sobre ${selectedCatalogItem.name}`, undefined, {
            contentType: "catalog_item",
            contentMetadata: {
              catalogItemId: selectedCatalogItem.id,
              catalogItemKey: selectedCatalogItem.key,
              catalogItemType: "Servicio Cloud ERP",
              catalogPrice: "$1,200",
              catalogCurrency: "USD",
            },
          });
          setSelectedCatalogItem(null);
        } else {
          await sendReply(text);
        }
      }
      setMessageText("");
    } catch {
      // Handled in hook
    } finally {
      setSending(false);
    }
  };

  const handleCall = () => {
    const phone = customerInfo?.phone || summary.contact?.phone;
    if (phone) {
      void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`);
    }
  };

  const handleStatusChange = async (status: ConversationStatus) => {
    if (!conversation) return;
    try {
      await localCommunicationsAdapter.updateConversationStatus(
        COMMUNICATIONS_LOCAL_CONTEXT,
        conversation.summary.id,
        status,
        conversation.summary.version,
      );
      reload();
    } catch {
      // ignore
    }
  };

  const renderMessageItem = ({ item }: { item: CommunicationMessage }) => {
    const isInbound = item.direction === "inbound";
    const isInternal = item.direction === "internal";
    const timeStr = item.occurredAt
      ? new Date(item.occurredAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    if (isInternal) {
      return (
        <View style={styles.internalBubble}>
          <View style={styles.internalHeader}>
            <View style={styles.internalHeaderLeft}>
              <Lock size={12} color="#b45309" />
              <Text style={styles.internalAuthor}>
                NOTA INTERNA · {item.authorName || "Equipo Comercial"}
              </Text>
            </View>
            <Text style={styles.internalTime}>{timeStr}</Text>
          </View>
          <Text style={styles.internalBody}>{item.body}</Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageRow,
          isInbound ? styles.messageRowInbound : styles.messageRowOutbound,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isInbound ? styles.bubbleInbound : styles.bubbleOutbound,
          ]}
        >
          {/* Audio Waveform Item */}
          {item.contentType === "audio" && (
            <View style={styles.audioContainer}>
              <View style={[styles.audioPlayBtn, isInbound ? styles.audioPlayInbound : styles.audioPlayOutbound]}>
                <Play size={14} color={isInbound ? "#ffffff" : mobileTheme.colors.primary} />
              </View>
              <View style={styles.waveform}>
                {[14, 22, 10, 18, 24, 12, 16, 20, 8, 14, 22, 12].map((h, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.waveBar,
                      { height: h },
                      isInbound ? styles.waveBarInbound : styles.waveBarOutbound,
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.audioDuration, isInbound ? styles.textInboundSec : styles.textOutboundSec]}>
                0:{item.contentMetadata?.durationSeconds ? String(item.contentMetadata.durationSeconds).padStart(2, "0") : "24"}
              </Text>
            </View>
          )}

          {/* Document Item */}
          {item.contentType === "document" && (
            <View style={[styles.docCard, isInbound ? styles.docCardInbound : styles.docCardOutbound]}>
              <FileText size={22} color={isInbound ? mobileTheme.colors.primary : "#ffffff"} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.docName, isInbound ? styles.textInbound : styles.textOutbound]}
                  numberOfLines={1}
                >
                  {item.contentMetadata?.name || item.body}
                </Text>
                <Text style={[styles.docMeta, isInbound ? styles.textInboundSec : styles.textOutboundSec]}>
                  {item.contentMetadata?.size || "Documento PDF"}
                </Text>
              </View>
            </View>
          )}

          {/* Catalog Product Card */}
          {item.contentType === "catalog_item" && (
            <View style={styles.catalogCard}>
              <View style={styles.catalogHeader}>
                <View style={styles.catalogIcon}>
                  <Package size={16} color={mobileTheme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catalogTitle} numberOfLines={1}>
                    {item.contentMetadata?.name || item.body}
                  </Text>
                  <Text style={styles.catalogKey}>
                    {item.contentMetadata?.catalogItemKey || "REF-CATALOG"}
                  </Text>
                </View>
              </View>
              {item.contentMetadata?.catalogPrice && (
                <Text style={styles.catalogPrice}>
                  {item.contentMetadata.catalogPrice} {item.contentMetadata.catalogCurrency || "USD"}
                </Text>
              )}
            </View>
          )}

          {/* Regular Text Body */}
          {item.contentType !== "audio" && (
            <Text
              style={[
                styles.messageBody,
                isInbound ? styles.textInbound : styles.textOutbound,
              ]}
            >
              {item.body}
            </Text>
          )}

          {/* Footer: Time & Delivery Status */}
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.timeText,
                isInbound ? styles.textInboundSec : styles.textOutboundSec,
              ]}
            >
              {timeStr}
            </Text>
            {!isInbound && (
              <View style={styles.deliveryCheck}>
                {item.deliveryStatus === "read" ? (
                  <CheckCheck size={14} color="#93c5fd" />
                ) : (
                  <Check size={14} color="#cbd5e1" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.pageContainer}>
        {/* 1. Integrated Native Top App Bar (Single compact 56px header) */}
        <View style={styles.topAppBar}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={t("crm.communications.back", "Volver a mensajes")}
          >
            <ArrowLeft size={22} color="#0f172a" />
          </Pressable>

          <Pressable
            onPress={() => setContextSheetOpen(true)}
            style={styles.topContactInfo}
            accessibilityRole="button"
            accessibilityLabel={`Ver ficha de ${contactName}`}
          >
            <View style={styles.topAvatarWrap}>
              <MobileAvatar name={contactName} size="sm" />
              <View
                style={[
                  styles.channelStatusDot,
                  summary.channel === "whatsapp" && { backgroundColor: "#22c55e" },
                  summary.channel === "email" && { backgroundColor: "#135bec" },
                ]}
              />
            </View>

            <View style={styles.topTitleCol}>
              <Text style={styles.topContactName} numberOfLines={1}>
                {contactName}
              </Text>
              <Text style={styles.topSubtitle} numberOfLines={1}>
                {summary.channel === "whatsapp" ? "WhatsApp · En línea" : `${channelDisplay} · Conectado`}
              </Text>
            </View>
          </Pressable>

          <View style={styles.topActions}>
            {summary.contact?.phone ? (
              <Pressable
                onPress={handleCall}
                style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Llamar al contacto"
              >
                <Phone size={17} color="#334155" />
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => setContextSheetOpen(true)}
              style={({ pressed }) => [styles.ficha360Pill, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel="Abrir Ficha 360"
            >
              <User size={12} color={mobileTheme.colors.primary} />
              <Text style={styles.ficha360Text}>Ficha 360</Text>
            </Pressable>
          </View>
        </View>

        {/* 2. Active WhatsApp 24h Window Notice (Slim banner) */}
        {summary.channel === "whatsapp" && summary.windowExpiresAt && (
          <View style={styles.windowNotice}>
            <Clock size={11} color="#166534" />
            <Text style={styles.windowNoticeText}>
              Ventana de respuesta 24h activa (restan 18h)
            </Text>
          </View>
        )}

        {/* 3. Messages Feed */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        />

        {/* 4. Selected Catalog Item Attachment Preview */}
        {selectedCatalogItem && (
          <View style={styles.selectedCatalogPreview}>
            <View style={styles.selectedCatalogIcon}>
              <Package size={15} color={mobileTheme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedCatalogTitle} numberOfLines={1}>
                {selectedCatalogItem.name}
              </Text>
              <Text style={styles.selectedCatalogSub}>Adjunto para enviar al cliente</Text>
            </View>
            <Pressable
              onPress={() => setSelectedCatalogItem(null)}
              style={styles.removeCatalogBtn}
              accessibilityRole="button"
              accessibilityLabel="Quitar adjunto"
            >
              <X size={16} color="#64748b" />
            </Pressable>
          </View>
        )}

        {/* 5. Sticky Chat Composer */}
        <View style={styles.composerWrapper}>
          {/* Mode Switcher: Reply vs Internal Note & Catalog Shortcut */}
          <View style={styles.composerModeRow}>
            <View style={styles.modeTabsWrap}>
              <Pressable
                onPress={() => setComposerMode("reply")}
                style={[
                  styles.modeTab,
                  composerMode === "reply" && styles.modeTabActive,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.modeTabText,
                    composerMode === "reply" && styles.modeTabTextActive,
                  ]}
                >
                  💬 Mensaje
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setComposerMode("internal")}
                style={[
                  styles.modeTab,
                  composerMode === "internal" && styles.modeTabInternalActive,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.modeTabText,
                    composerMode === "internal" && styles.modeTabTextInternalActive,
                  ]}
                >
                  🔒 Nota interna
                </Text>
              </Pressable>
            </View>

            {composerMode === "reply" && (
              <Pressable
                onPress={() => setCatalogPickerOpen(true)}
                style={({ pressed }) => [styles.catalogShortcutBtn, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Ver catálogo ERP"
              >
                <Package size={12} color={mobileTheme.colors.primary} />
                <Text style={styles.catalogShortcutText}>Catálogo ERP</Text>
              </Pressable>
            )}
          </View>

          {/* Composer Input Row */}
          <View style={styles.composerInputRow}>
            {composerMode === "reply" && (
              <Pressable
                onPress={() => setCatalogPickerOpen(true)}
                style={({ pressed }) => [styles.attachBtn, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Adjuntar producto del catálogo"
              >
                <Plus size={20} color="#475569" />
              </Pressable>
            )}

            <TextInput
              style={[
                styles.composerInput,
                composerMode === "internal" && styles.composerInputInternal,
              ]}
              placeholder={
                composerMode === "internal"
                  ? "Escribe una nota interna para el equipo..."
                  : "Escribe una respuesta..."
              }
              placeholderTextColor="#94a3b8"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />

            <Pressable
              onPress={handleSend}
              disabled={sending || (!messageText.trim() && !selectedCatalogItem)}
              style={({ pressed }) => [
                styles.sendBtn,
                composerMode === "internal" && styles.sendBtnInternal,
                (!messageText.trim() && !selectedCatalogItem) && styles.sendBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
            >
              <Send size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* Customer Context & Operations Sheet */}
        <MobileConversationContextSheet
          visible={contextSheetOpen}
          onClose={() => setContextSheetOpen(false)}
          customer={customerInfo}
          summary={summary}
          onNavigateToContact={onNavigateToContact}
          onInsertCatalogItem={() => setCatalogPickerOpen(true)}
          onCloseConversation={() => handleStatusChange("closed")}
          onReopenConversation={() => handleStatusChange("open")}
        />

        {/* ERP Catalog Item Picker Sheet */}
        <MobileCatalogItemPickerSheet
          visible={catalogPickerOpen}
          onClose={() => setCatalogPickerOpen(false)}
          onSelect={(item) => setSelectedCatalogItem(item)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  pageContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  topAppBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topContactInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topAvatarWrap: {
    position: "relative",
  },
  channelStatusDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    backgroundColor: "#16a34a",
  },
  topTitleCol: {
    flex: 1,
  },
  topContactName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  topSubtitle: {
    fontSize: 11,
    color: "#16a34a",
    fontWeight: "600",
    marginTop: 1,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  ficha360Pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mobileTheme.colors.primary,
    backgroundColor: "#eff6ff",
  },
  ficha360Text: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  windowNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    borderBottomWidth: 1,
    borderBottomColor: "#bbf7d0",
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  windowNoticeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#166534",
  },
  messageListContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 2,
  },
  messageRowInbound: {
    justifyContent: "flex-start",
  },
  messageRowOutbound: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleInbound: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bubbleOutbound: {
    backgroundColor: mobileTheme.colors.primary,
    borderTopRightRadius: 4,
  },
  messageBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  textInbound: {
    color: "#0f172a",
  },
  textOutbound: {
    color: "#ffffff",
  },
  textInboundSec: {
    color: "#94a3b8",
  },
  textOutboundSec: {
    color: "#bfdbfe",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  deliveryCheck: {
    marginLeft: 2,
  },
  internalBubble: {
    backgroundColor: "#fffdf5",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  internalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  internalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  internalAuthor: {
    fontSize: 10,
    fontWeight: "800",
    color: "#b45309",
    letterSpacing: 0.5,
  },
  internalTime: {
    fontSize: 10,
    color: "#b45309",
    opacity: 0.8,
  },
  internalBody: {
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    minWidth: 180,
  },
  audioPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  audioPlayInbound: {
    backgroundColor: mobileTheme.colors.primary,
  },
  audioPlayOutbound: {
    backgroundColor: "#ffffff",
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  waveBarInbound: {
    backgroundColor: mobileTheme.colors.primary,
  },
  waveBarOutbound: {
    backgroundColor: "#ffffff",
    opacity: 0.85,
  },
  audioDuration: {
    fontSize: 11,
    fontWeight: "700",
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  docCardInbound: {
    backgroundColor: "#f8fafc",
  },
  docCardOutbound: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  docName: {
    fontSize: 12,
    fontWeight: "700",
  },
  docMeta: {
    fontSize: 10,
    marginTop: 1,
  },
  catalogCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  catalogHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  catalogIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  catalogTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
  },
  catalogKey: {
    fontSize: 10,
    color: "#64748b",
  },
  catalogPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: mobileTheme.colors.primary,
    marginTop: 6,
  },
  selectedCatalogPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    borderTopWidth: 1,
    borderTopColor: "#bfdbfe",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedCatalogIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCatalogTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e40af",
  },
  selectedCatalogSub: {
    fontSize: 10,
    color: "#3b82f6",
  },
  removeCatalogBtn: {
    padding: 4,
  },
  composerWrapper: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    gap: 8,
  },
  composerModeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modeTabsWrap: {
    flexDirection: "row",
    gap: 6,
  },
  modeTab: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: "#eff6ff",
  },
  modeTabInternalActive: {
    backgroundColor: "#fef3c7",
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  modeTabTextActive: {
    color: mobileTheme.colors.primary,
    fontWeight: "700",
  },
  modeTabTextInternalActive: {
    color: "#b45309",
    fontWeight: "700",
  },
  catalogShortcutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
  },
  catalogShortcutText: {
    fontSize: 11,
    fontWeight: "600",
    color: mobileTheme.colors.primary,
  },
  composerInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  composerInput: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: "#0f172a",
    maxHeight: 90,
  },
  composerInputInternal: {
    backgroundColor: "#fffdf5",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: mobileTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnInternal: {
    backgroundColor: "#d97706",
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});
