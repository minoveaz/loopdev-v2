import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Camera,
  FileText,
  Mail,
  MessageCircle,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Volume2,
} from "lucide-react-native";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobilePageTabs,
  MobileSearchBar,
  MobileCard,
  MobileAvatar,
  MobileStatusBadge,
  MobileLoadingState,
  MobileEmptyState,
} from "../ui";
import { mobileTheme } from "../../theme/tokens";
import { useT } from "../../i18n";
import { useCommunicationsInbox } from "../../hooks/useMobileCommunications";
import type { CommunicationChannel, ConversationStatus, ConversationSummary } from "../../../../src/loopdev/domains/communications";

interface Props {
  onSelectConversation: (conversationId: string) => void;
  onBack?: () => void;
  onNavigateToContact?: (contactId: string) => void;
}

type TabId = "all" | CommunicationChannel;

const CHANNEL_COLORS: Record<CommunicationChannel, string> = {
  whatsapp: "#22c55e",
  email: "#135bec",
  instagram: "#e11d48",
  facebook_messenger: "#2563eb",
  sms: "#0891b2",
  phone: "#64748b",
  livechat: "#0284c7",
};

export function MobileCommunicationsScreen({
  onSelectConversation,
  onBack,
  onNavigateToContact,
}: Props) {
  const t = useT();
  const {
    conversations,
    loading,
    error,
    channelUnreadCounts,
    unreadCount,
    markRead,
  } = useCommunicationsInbox();

  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = useMemo(() => {
    return [
      {
        id: "all",
        label: t("crm.communications.tabs.all", "Todas"),
        count: conversations.length > 0 ? conversations.length : undefined,
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        count: conversations.filter((c) => c.channel === "whatsapp").length || undefined,
      },
      {
        id: "email",
        label: "Email",
        count: conversations.filter((c) => c.channel === "email").length || undefined,
      },
      {
        id: "instagram",
        label: "Instagram",
        count: conversations.filter((c) => c.channel === "instagram").length || undefined,
      },
      {
        id: "sms",
        label: "SMS",
        count: conversations.filter((c) => c.channel === "sms").length || undefined,
      },
    ];
  }, [conversations, t]);

  const filtered = useMemo(() => {
    let list = conversations;
    if (activeTab !== "all") {
      list = list.filter((item) => item.channel === activeTab);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.contact.displayName?.toLowerCase().includes(q) ||
          item.contact.phone?.toLowerCase().includes(q) ||
          item.contact.email?.toLowerCase().includes(q) ||
          item.preview?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [conversations, activeTab, searchQuery]);

  const renderChannelBadge = (channel: CommunicationChannel) => {
    const color = CHANNEL_COLORS[channel] || mobileTheme.colors.primary;
    let Icon = MessageCircle;
    if (channel === "email") Icon = Mail;
    if (channel === "instagram") Icon = Camera;
    if (channel === "sms") Icon = MessageSquare;
    if (channel === "phone") Icon = Phone;

    return (
      <View style={[styles.channelBadge, { backgroundColor: color }]}>
        <Icon size={10} color="#ffffff" />
      </View>
    );
  };

  const renderConversationItem = ({ item }: { item: ConversationSummary }) => {
    const hasUnread = item.unreadCount > 0;
    const timeStr = item.lastMessageAt
      ? new Date(item.lastMessageAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const statusTone: Record<ConversationStatus, "success" | "warning" | "neutral" | "info"> = {
      open: "success",
      pending: "warning",
      snoozed: "info",
      closed: "neutral",
    };

    const statusLabel: Record<ConversationStatus, string> = {
      open: "Abierto",
      pending: "SLA 30m",
      snoozed: "Pausado",
      closed: "Cerrado",
    };

    return (
      <Pressable
        style={({ pressed }) => [styles.cardPressable, pressed && { opacity: 0.85 }]}
        onPress={() => {
          if (hasUnread) void markRead(item.id);
          onSelectConversation(item.id);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Conversación con ${item.contact.displayName}`}
      >
        <MobileCard style={[styles.card, hasUnread && styles.cardUnread]}>
          {/* Avatar with Channel Overlay Badge */}
          <View style={styles.avatarWrapper}>
            <MobileAvatar name={item.contact.displayName || "Cliente"} size="md" />
            {renderChannelBadge(item.channel)}
          </View>

          {/* Conversation Text Body */}
          <View style={styles.contentCol}>
            {/* Row 1: Name with unread dot + Time */}
            <View style={styles.titleRow}>
              <View style={styles.nameWithDot}>
                {hasUnread && <View style={styles.unreadDot} />}
                <Text style={[styles.contactName, hasUnread && styles.contactNameBold]} numberOfLines={1}>
                  {item.contact.displayName || "Contacto Desconocido"}
                </Text>
              </View>
              <Text style={[styles.timestamp, hasUnread && styles.timestampUnread]}>
                {timeStr}
              </Text>
            </View>

            {/* Row 2: Last Message Snippet */}
            <Text
              style={[styles.snippetText, hasUnread && styles.snippetTextUnread]}
              numberOfLines={1}
            >
              {item.preview || "Sin mensajes recientes"}
            </Text>

            {/* Row 3: Meta & Status & Unread Count Badge */}
            <View style={styles.bottomMetaRow}>
              <View style={styles.metaLeftGroup}>
                <MobileStatusBadge tone={statusTone[item.status] || "neutral"}>
                  {statusLabel[item.status] || item.status}
                </MobileStatusBadge>
                <Text style={styles.contactSubtitle} numberOfLines={1}>
                  {item.contact.phone || item.contact.email || "Omnicanal"}
                </Text>
              </View>

              {hasUnread && (
                <View style={styles.unreadCountBadge}>
                  <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </MobileCard>
      </Pressable>
    );
  };

  return (
    <MobilePageContainer scrollable={false} style={styles.container}>
      {/* Canonical Module Header */}
      <MobilePageHeader
        eyebrow="SALES CRM"
        title={t("crm.communications.title", "Comunicaciones")}
        subtitle={t("crm.communications.subtitle", "Buzón omnicanal en tiempo real")}
        actionButton={{
          label: t("crm.communications.newChat", "Nuevo"),
          icon: <Plus size={16} color="#ffffff" />,
          onPress: () => {
            if (conversations.length > 0) {
              onSelectConversation(conversations[0].id);
            }
          },
        }}
      />

      {/* Canonical Navigation Tabs (No pills, active bottom line 2.5px #135bec) */}
      <MobilePageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Canonical Search Input with Spacing */}
      <MobileSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t(
          "crm.communications.searchPlaceholder",
          "Buscar por cliente, teléfono o mensaje...",
        )}
      />

      {/* Loading & Empty States */}
      {loading && (
        <View style={styles.loadingWrap}>
          <MobileLoadingState message="Sincronizando buzón omnicanal..." />
        </View>
      )}

      {error && !loading && (
        <MobileEmptyState
          title="Error de sincronización"
          description={error}
          action={{
            label: "Reintentar",
            onPress: () => {},
          }}
        />
      )}

      {!loading && !error && filtered.length === 0 && (
        <MobileEmptyState
          title={t("crm.communications.emptyTitle", "No se encontraron conversaciones")}
          description={t(
            "crm.communications.emptySubtitle",
            "Los mensajes entrantes de WhatsApp, Email y redes aparecerán aquí.",
          )}
        />
      )}

      {/* Conversation List */}
      {!loading && !error && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    marginTop: 32,
  },
  listContent: {
    paddingBottom: 110,
    gap: 8,
    marginTop: 6,
  },
  cardPressable: {
    borderRadius: mobileTheme.radii.card,
  },
  card: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
    alignItems: "center",
  },
  cardUnread: {
    backgroundColor: "#f8faff",
    borderColor: "#93c5fd",
    borderWidth: 1.5,
  },
  nameWithDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mobileTheme.colors.primary,
  },
  avatarWrapper: {
    position: "relative",
    alignSelf: "center",
  },
  channelBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  contentCol: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactName: {
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.textMain,
  },
  contactNameBold: {
    fontWeight: "800",
  },
  timestamp: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
  },
  timestampUnread: {
    color: mobileTheme.colors.primary,
    fontWeight: "700",
  },
  snippetText: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
    lineHeight: 16,
  },
  snippetTextUnread: {
    color: mobileTheme.colors.textMain,
    fontWeight: "600",
  },
  bottomMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  metaLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  contactSubtitle: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
  },
  unreadCountBadge: {
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },
});
