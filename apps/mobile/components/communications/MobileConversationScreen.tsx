import React, { useEffect, useMemo, useRef, useState } from "react";
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
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Lock,
  MessageSquare,
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
import { useMobileI18n } from "../../i18n";
import { useCommunicationConversation } from "../../hooks/useMobileCommunications";
import {
  MobileConversationContextSheet,
  type ConversationContextTab,
  type ConversationCustomerInfo,
} from "./MobileConversationContextSheet";
import { MobileCatalogItemPickerSheet } from "./MobileCatalogItemPickerSheet";
import { mobileContactAdapter } from "../../adapters/contact";
import type { CatalogItem } from "../../adapters/catalog";
import {
  localCommunicationsAdapter,
  COMMUNICATIONS_LOCAL_CONTEXT,
  type CommunicationMessage,
  type ConversationStatus,
} from "../../../../src/loopdev/domains/communications";
import { buildConversationTimelineMarkers } from "../../domains/communicationsTimeline";

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
  const { lang, t } = useMobileI18n();
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
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const [contextSheetTab, setContextSheetTab] = useState<ConversationContextTab>("crm");
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const messages = conversation?.messages || [];
  const markers = useMemo(() => buildConversationTimelineMarkers(messages), [messages]);

  const handleJumpToMessage = (messageId: string) => {
    const index = messages.findIndex((m) => m.id === messageId);
    if (index >= 0) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.4,
      });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2500);
    }
  };

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
        <MobileLoadingState message={lang === "es" ? "Cargando conversación..." : "Loading conversation..."} />
      </MobilePageContainer>
    );
  }

  if (error || !conversation) {
    return (
      <MobilePageContainer>
        <MobileBackLink
          label={t("crm.communications.back", lang === "es" ? "Volver a mensajes" : "Back to messages")}
          onPress={onBack}
        />
        <MobileEmptyState
          title={lang === "es" ? "Conversación no encontrada" : "Conversation not found"}
          description={error || (lang === "es" ? "No pudimos cargar el hilo de mensajes." : "Could not load message thread.")}
          action={{
            label: t("crm.communications.back", lang === "es" ? "Volver a mensajes" : "Back to messages"),
            onPress: onBack,
          }}
        />
      </MobilePageContainer>
    );
  }

  const { summary } = conversation;
  const contactName = customerInfo?.name || summary.contact?.displayName || (lang === "es" ? "Contacto" : "Contact");
  const channelDisplay = summary.channel.toUpperCase();

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text && !selectedCatalogItem) return;

    setSending(true);
    try {
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
                {lang === "es" ? "NOTA INTERNA" : "INTERNAL NOTE"} · {item.authorName || (lang === "es" ? "Equipo Comercial" : "Sales Team")}
              </Text>
            </View>
            <Text style={styles.internalTime}>{timeStr}</Text>
          </View>
          <Text style={styles.internalBody}>{item.body}</Text>
        </View>
      );
    }

    const isHighlighted = item.id === highlightedMessageId;

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
            isHighlighted && styles.bubbleHighlighted,
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
            accessibilityLabel={lang === "es" ? "Volver a mensajes" : "Back to messages"}
          >
            <ArrowLeft size={22} color="#0f172a" />
          </Pressable>

          <Pressable
            onPress={() => setContextSheetOpen(true)}
            style={styles.topContactInfo}
            accessibilityRole="button"
            accessibilityLabel={lang === "es" ? `Ver ficha de ${contactName}` : `View profile of ${contactName}`}
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
                {summary.channel === "whatsapp"
                  ? (lang === "es" ? "WhatsApp · En línea" : "WhatsApp · Online")
                  : `${channelDisplay} · ${lang === "es" ? "Conectado" : "Connected"}`}
              </Text>
            </View>
          </Pressable>

          <View style={styles.topActions}>
            {summary.contact?.phone ? (
              <Pressable
                onPress={handleCall}
                style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel={lang === "es" ? "Llamar al contacto" : "Call contact"}
              >
                <Phone size={17} color="#334155" />
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => {
                setContextSheetTab("timeline");
                setContextSheetOpen(true);
              }}
              style={({ pressed }) => [styles.actionCircleBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={lang === "es" ? "Ver actividad de la conversación" : "View conversation activity"}
            >
              <Clock size={17} color="#334155" />
            </Pressable>

            <Pressable
              onPress={() => {
                setContextSheetTab("crm");
                setContextSheetOpen(true);
              }}
              style={({ pressed }) => [styles.actionCircleBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={lang === "es" ? "Ver Ficha 360 del cliente" : "View 360 Customer Profile"}
            >
              <User size={17} color="#334155" />
            </Pressable>
          </View>
        </View>

        {/* 2. Active WhatsApp 24h Window Notice (Slim banner) */}
        {summary.channel === "whatsapp" && summary.windowExpiresAt && (
          <View style={styles.windowNotice}>
            <Clock size={11} color="#166534" />
            <Text style={styles.windowNoticeText}>
              {lang === "es"
                ? "Ventana de respuesta 24h activa (restan 18h)"
                : "Active 24h reply window (18h remaining)"}
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
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({
              offset: Math.max(0, info.averageItemLength * info.index),
              animated: true,
            });
          }}
        />

        {/* Interactive Checkpoint Bar above composer */}
        <Pressable
          style={({ pressed }) => [
            styles.timelineBar,
            pressed && { backgroundColor: "#f1f5f9" },
          ]}
          onPress={() => {
            setContextSheetTab("timeline");
            setContextSheetOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={lang === "es" ? "Abrir actividad de conversación" : "Open conversation activity"}
        >
          <View style={styles.timelineBarLeft}>
            <Clock size={13} color="#475569" />
            <Text style={styles.timelineBarTitle}>{lang === "es" ? "Actividad de conversación" : "Conversation activity"}</Text>
          </View>
          <View style={styles.timelineBarRight}>
            <Text style={styles.timelineBarCount}>
              {markers.length} {markers.length === 1 ? (lang === "es" ? "hito" : "milestone") : (lang === "es" ? "hitos" : "milestones")}
            </Text>
            <ChevronRight size={13} color={mobileTheme.colors.primary} />
          </View>
        </Pressable>

        {/* Dedicated Customer Reply Composer (Matching Mobile Web) */}
        <View style={styles.composerWrapper}>
          {/* Header Row: Customer reply Badge + Subtitle */}
          <View style={styles.composerHeaderRow}>
            <View style={styles.customerReplyBadge}>
              <Text style={styles.customerReplyBadgeText}>{lang === "es" ? "Respuesta al cliente" : "Customer reply"}</Text>
            </View>
            <Text style={styles.composerAvailabilityText} numberOfLines={1}>
              {summary.channel === "whatsapp" && summary.windowExpiresAt
                ? (lang === "es" ? "Ventana WhatsApp activa · Entrega directa" : "Active WhatsApp window · Direct delivery")
                : (lang === "es" ? `Respuestas enviadas directamente a ${contactName}` : `Replies sent directly to ${contactName}`)}
            </Text>
            <Text style={styles.composerQueuedText}>{lang === "es" ? "Directo" : "Direct"}</Text>
          </View>

          {/* Catalog Item Attachment Dropdown Row */}
          <Pressable
            style={({ pressed }) => [
              styles.catalogSelectRow,
              selectedCatalogItem && styles.catalogSelectRowActive,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setCatalogPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={lang === "es" ? "Adjuntar producto del catálogo" : "Attach catalog product"}
          >
            <View style={styles.catalogSelectLeft}>
              <Package
                size={14}
                color={selectedCatalogItem ? mobileTheme.colors.primary : "#64748b"}
              />
              <Text
                style={[
                  styles.catalogSelectText,
                  selectedCatalogItem && styles.catalogSelectTextActive,
                ]}
                numberOfLines={1}
              >
                {selectedCatalogItem
                  ? `${selectedCatalogItem.name} · ${selectedCatalogItem.key}`
                  : (lang === "es" ? "Adjuntar producto del catálogo (opcional)" : "Attach catalog product (optional)")}
              </Text>
            </View>

            {selectedCatalogItem ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedCatalogItem(null);
                }}
                style={styles.catalogClearBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={lang === "es" ? "Quitar producto adjunto" : "Remove attached product"}
              >
                <X size={14} color="#64748b" />
              </Pressable>
            ) : (
              <ChevronDown size={14} color="#64748b" />
            )}
          </Pressable>

          {/* Textarea & Send Button Row */}
          <View style={styles.textareaRow}>
            <TextInput
              style={styles.composerTextarea}
              placeholder={
                summary.channel === "whatsapp"
                  ? (lang === "es" ? "Escribe una respuesta por WhatsApp..." : "Write a WhatsApp reply...")
                  : (lang === "es" ? `Escribe una respuesta por ${channelDisplay}...` : `Write a reply via ${channelDisplay}...`)
              }
              placeholderTextColor="#94a3b8"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              textAlignVertical="top"
              maxLength={1500}
            />

            <Pressable
              onPress={handleSend}
              disabled={sending || (!messageText.trim() && !selectedCatalogItem)}
              style={({ pressed }) => [
                styles.squareSendBtn,
                (!messageText.trim() && !selectedCatalogItem) && styles.squareSendBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={lang === "es" ? "Enviar respuesta al cliente" : "Send reply to customer"}
            >
              <Send size={18} color="#ffffff" />
            </Pressable>
          </View>

          {/* Footer helper note */}
          <Text style={styles.composerFooterNote}>
            {lang === "es"
              ? "Canal directo con el cliente · Respuestas sincronizadas en tiempo real"
              : "Direct customer channel · Real-time synced replies"}
          </Text>
        </View>

        {/* Customer Context, Operations & Timeline Sheet */}
        <MobileConversationContextSheet
          visible={contextSheetOpen}
          onClose={() => setContextSheetOpen(false)}
          customer={customerInfo}
          summary={summary}
          messages={messages}
          initialTab={contextSheetTab}
          onSelectMarker={handleJumpToMessage}
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
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
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
  bubbleHighlighted: {
    borderColor: mobileTheme.colors.primary,
    borderWidth: 2,
    boxShadow: "0px 0px 8px rgba(19, 91, 236, 0.45)",
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
  timelineBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 38,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  timelineBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timelineBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timelineBarTitle: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  timelineBarCount: {
    fontSize: 12,
    color: mobileTheme.colors.primary,
    fontWeight: "700",
  },
  composerWrapper: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    gap: 8,
  },
  composerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customerReplyBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  customerReplyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  composerAvailabilityText: {
    fontSize: 11,
    color: "#64748b",
    flex: 1,
  },
  composerQueuedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  catalogSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  catalogSelectRowActive: {
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
  },
  catalogSelectLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  catalogSelectText: {
    fontSize: 12,
    color: "#64748b",
  },
  catalogSelectTextActive: {
    color: mobileTheme.colors.primary,
    fontWeight: "700",
  },
  catalogClearBtn: {
    padding: 2,
  },
  textareaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  composerTextarea: {
    flex: 1,
    minHeight: 70,
    maxHeight: 120,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    lineHeight: 18,
    color: "#0f172a",
  },
  squareSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: mobileTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  squareSendBtnDisabled: {
    opacity: 0.45,
  },
  composerFooterNote: {
    fontSize: 10,
    color: "#94a3b8",
  },
});
