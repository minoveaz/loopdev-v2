import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AlertCircle,
  Camera,
  Check,
  ChevronDown,
  Inbox,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Star,
  User,
  Users,
  X,
} from "lucide-react-native";
import {
  MobileLoadingState,
  MobileEmptyState,
} from "../ui";
import { mobileTheme } from "../../theme/tokens";
import { useT } from "../../i18n";
import { useCommunicationsInbox } from "../../hooks/useMobileCommunications";
import type {
  CommunicationChannel,
  ConversationAssigneeFilter,
  ConversationStatus,
  ConversationSummary,
} from "../../../../src/loopdev/domains/communications";

interface Props {
  onSelectConversation: (conversationId: string) => void;
  onBack?: () => void;
  onNavigateToContact?: (contactId: string) => void;
}

const CHANNEL_COLORS: Record<CommunicationChannel, string> = {
  whatsapp: "#22c55e",
  email: "#135bec",
  instagram: "#e11d48",
  facebook_messenger: "#2563eb",
  sms: "#0891b2",
  phone: "#64748b",
  livechat: "#0284c7",
};

const CHANNEL_LABELS: Record<CommunicationChannel | "all", string> = {
  all: "Todos los canales",
  whatsapp: "WhatsApp",
  email: "Email",
  instagram: "Instagram",
  facebook_messenger: "Messenger",
  sms: "SMS",
  phone: "Teléfono",
  livechat: "Live Chat",
};

const STATUS_OPTIONS: Array<{ id: ConversationStatus | "all"; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "open", label: "Abiertas" },
  { id: "pending", label: "Pendientes" },
  { id: "snoozed", label: "Pausadas" },
  { id: "closed", label: "Cerradas" },
];

function ChannelIcon({ channel, size = 13 }: { channel: CommunicationChannel; size?: number }) {
  const color = CHANNEL_COLORS[channel] || mobileTheme.colors.primary;
  if (channel === "whatsapp") return <MessageCircle size={size} color={color} />;
  if (channel === "email") return <Mail size={size} color={color} />;
  if (channel === "instagram") return <Camera size={size} color={color} />;
  if (channel === "sms" || channel === "facebook_messenger") return <MessageSquare size={size} color={color} />;
  if (channel === "phone") return <Phone size={size} color={color} />;
  return <MessageCircle size={size} color={color} />;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays}d`;
  if (diffDays < 14) return "la semana pasada";
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MobileCommunicationsScreen({
  onSelectConversation,
  onBack,
  onNavigateToContact,
}: Props) {
  const t = useT();

  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<ConversationStatus | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<ConversationAssigneeFilter>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelPickerOpen, setChannelPickerOpen] = useState(false);

  const filters = useMemo(
    () => ({
      channel: selectedChannel,
      status: selectedStatus,
      assignee: assigneeFilter,
      unreadOnly,
      starredOnly,
      query: searchQuery,
    }),
    [selectedChannel, selectedStatus, assigneeFilter, unreadOnly, starredOnly, searchQuery],
  );

  const {
    channels,
    conversations,
    total,
    unreadCount,
    channelUnreadCounts,
    loading,
    error,
    reload,
    markRead,
    toggleStar,
  } = useCommunicationsInbox(filters);

  const statusToneMap: Record<ConversationStatus, { bg: string; text: string; label: string }> = {
    open: { bg: "#dcfce7", text: "#15803d", label: "Abierto" },
    pending: { bg: "#fef3c7", text: "#b45309", label: "SLA 30m" },
    snoozed: { bg: "#eff6ff", text: "#1d4ed8", label: "Pausado" },
    closed: { bg: "#f1f5f9", text: "#64748b", label: "Cerrado" },
  };

  const renderConversationItem = ({ item }: { item: ConversationSummary }) => {
    const hasUnread = item.unreadCount > 0;
    const timeDisplay = formatRelativeTime(item.lastMessageAt);
    const tone = statusToneMap[item.status] || statusToneMap.open;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.itemRow,
          hasUnread && styles.itemRowUnread,
          pressed && styles.itemRowPressed,
        ]}
        onPress={() => {
          if (hasUnread) void markRead(item.id);
          onSelectConversation(item.id);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Conversación con ${item.contact.displayName}`}
      >
        {/* Left: Circular Avatar with Initials */}
        <View style={[styles.avatarCircle, hasUnread ? styles.avatarUnread : styles.avatarNormal]}>
          <Text style={[styles.avatarInitials, hasUnread ? styles.avatarInitialsUnread : styles.avatarInitialsNormal]}>
            {getInitials(item.contact.displayName)}
          </Text>
        </View>

        {/* Center: Multi-line Details */}
        <View style={styles.itemContent}>
          {/* Row 1: Name + Relative Time */}
          <View style={styles.nameTimeRow}>
            <Text
              style={[styles.contactName, hasUnread && styles.contactNameBold]}
              numberOfLines={1}
            >
              {item.contact.displayName || "Contacto sin nombre"}
            </Text>
            <Text style={[styles.timeText, hasUnread && styles.timeTextUnread]}>
              {timeDisplay}
            </Text>
          </View>

          {/* Row 2: Channel icon + Channel label + Snippet */}
          <View style={styles.snippetRow}>
            <ChannelIcon channel={item.channel} size={12} />
            <Text style={styles.channelSnippetLabel}>
              {item.contact.identityStatus === "pending_identity_review"
                ? "Revisión identidad"
                : CHANNEL_LABELS[item.channel]}
            </Text>
            <Text style={styles.bulletSeparator}>·</Text>
            <Text
              style={[styles.snippetText, hasUnread && styles.snippetTextUnread]}
              numberOfLines={1}
            >
              {item.preview || "Sin mensajes aún"}
            </Text>
          </View>

          {/* Row 3: Status Badge + Assignee + Unread Count */}
          <View style={styles.metaRow}>
            <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
              <Text style={[styles.statusPillText, { color: tone.text }]}>
                {tone.label}
              </Text>
            </View>

            {item.assignedToName ? (
              <View style={styles.assigneeWrap}>
                <View style={styles.assigneeAvatar}>
                  <Text style={styles.assigneeAvatarText}>
                    {getInitials(item.assignedToName)}
                  </Text>
                </View>
                <Text style={styles.assigneeName} numberOfLines={1}>
                  {item.assignedToName}
                </Text>
              </View>
            ) : (
              <Text style={styles.unassignedText}>Sin asignar</Text>
            )}

            {/* Collaboration Presence Dot */}
            {item.collaboration?.presence?.some((p) => p.state !== "offline") && (
              <View style={styles.presenceDot} />
            )}

            {/* Unread count badge */}
            {hasUnread && (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: Star Button */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            void toggleStar(item.id);
          }}
          style={({ pressed }) => [styles.starBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={item.starred ? "Quitar destacada" : "Destacar conversación"}
        >
          <Star
            size={16}
            color={item.starred ? "#eab308" : "#cbd5e1"}
            fill={item.starred ? "#eab308" : "none"}
          />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header & Filters Box (Comfortable padding on mobile) */}
      <View style={styles.topSection}>
        {/* Eyebrow & Title */}
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>CHANNELS</Text>
          <Text style={styles.headerTitle}>Operational inbox</Text>
          <Text style={styles.headerSubtitle}>
            Buzón omnicanal sincronizado en tiempo real
          </Text>
        </View>

        {/* Channel Selector Row: [Channel: All channels ⌵] + [↻] */}
        <View style={styles.channelFilterRow}>
          <Text style={styles.channelFilterLabel}>Canal</Text>
          <Pressable
            style={({ pressed }) => [styles.channelDropdown, pressed && { opacity: 0.75 }]}
            onPress={() => setChannelPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Filtrar por canal"
          >
            <View style={styles.channelDropdownLeft}>
              {selectedChannel === "all" ? (
                <Inbox size={13} color="#64748b" />
              ) : (
                <ChannelIcon channel={selectedChannel} size={13} />
              )}
              <Text style={styles.channelDropdownText} numberOfLines={1}>
                {CHANNEL_LABELS[selectedChannel]}
              </Text>
              {selectedChannel !== "all" && <View style={styles.channelActiveDot} />}
            </View>
            <ChevronDown size={14} color="#64748b" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]}
            onPress={reload}
            accessibilityRole="button"
            accessibilityLabel="Actualizar bandeja"
          >
            <RefreshCw size={14} color="#475569" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <Search size={15} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por cliente, teléfono o mensaje..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              style={styles.searchClearBtn}
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
            >
              <X size={14} color="#64748b" />
            </Pressable>
          )}
        </View>

        {/* Status Filter Row: All, Open, Pending, Snoozed, Closed */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFiltersScroll}
        >
          {STATUS_OPTIONS.map((opt) => {
            const isActive = selectedStatus === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setSelectedStatus(opt.id)}
                style={[
                  styles.statusFilterPill,
                  isActive && styles.statusFilterPillActive,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.statusFilterText,
                    isActive && styles.statusFilterTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quick Filter Buttons: Mine, Unassigned, Unread, Starred */}
        <View style={styles.quickFiltersRow}>
          <Pressable
            onPress={() => setAssigneeFilter((curr) => (curr === "mine" ? "all" : "mine"))}
            style={[
              styles.quickBtn,
              assigneeFilter === "mine" && styles.quickBtnActive,
            ]}
            accessibilityRole="button"
          >
            <User size={12} color={assigneeFilter === "mine" ? "#135bec" : "#64748b"} />
            <Text
              style={[
                styles.quickBtnText,
                assigneeFilter === "mine" && styles.quickBtnTextActive,
              ]}
            >
              Mías
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setAssigneeFilter((curr) => (curr === "unassigned" ? "all" : "unassigned"))}
            style={[
              styles.quickBtn,
              assigneeFilter === "unassigned" && styles.quickBtnActive,
            ]}
            accessibilityRole="button"
          >
            <Users size={12} color={assigneeFilter === "unassigned" ? "#135bec" : "#64748b"} />
            <Text
              style={[
                styles.quickBtnText,
                assigneeFilter === "unassigned" && styles.quickBtnTextActive,
              ]}
            >
              Sin asignar
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setUnreadOnly((curr) => !curr)}
            style={[
              styles.quickBtn,
              unreadOnly && styles.quickBtnActive,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.quickBtnText,
                unreadOnly && styles.quickBtnTextActive,
              ]}
            >
              No leídos
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setStarredOnly((curr) => !curr)}
            style={[
              styles.quickBtn,
              starredOnly && styles.quickBtnStarredActive,
            ]}
            accessibilityRole="button"
          >
            <Star
              size={12}
              color={starredOnly ? "#eab308" : "#64748b"}
              fill={starredOnly ? "#eab308" : "none"}
            />
            <Text
              style={[
                styles.quickBtnText,
                starredOnly && styles.quickBtnStarredTextActive,
              ]}
            >
              Destacadas
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Counter Strip: "4 conversaciones" ... "1 no leída" */}
      <View style={styles.counterStrip}>
        <Text style={styles.counterTotal}>
          {total} conversación{total === 1 ? "" : "es"}
        </Text>
        {unreadCount > 0 && (
          <Text style={styles.counterUnread}>
            {unreadCount} no leída{unreadCount === 1 ? "" : "s"}
          </Text>
        )}
      </View>

      {/* Loading / Error / Empty States */}
      {loading && (
        <View style={styles.stateContainer}>
          <MobileLoadingState message="Cargando conversaciones..." />
        </View>
      )}

      {error && !loading && (
        <View style={styles.stateContainer}>
          <MobileEmptyState
            title="Error al cargar conversaciones"
            description={error}
            action={{
              label: "Reintentar",
              onPress: reload,
            }}
          />
        </View>
      )}

      {!loading && !error && conversations.length === 0 && (
        <View style={styles.stateContainer}>
          <MobileEmptyState
            title="No se encontraron conversaciones"
            description={
              searchQuery || selectedChannel !== "all" || selectedStatus !== "all" || unreadOnly || starredOnly
                ? "Prueba cambiando o limpiando los filtros de búsqueda."
                : "Las conversaciones autorizadas aparecerán aquí."
            }
          />
        </View>
      )}

      {/* Native Divided List (Edge-to-edge separated by clean hairline borders) */}
      {!loading && !error && (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Channel Picker Modal */}
      <Modal
        visible={channelPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setChannelPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setChannelPickerOpen(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por canal</Text>
              <Pressable
                onPress={() => setChannelPickerOpen(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Cerrar modal"
              >
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.modalOption,
                selectedChannel === "all" && styles.modalOptionActive,
              ]}
              onPress={() => {
                setSelectedChannel("all");
                setChannelPickerOpen(false);
              }}
            >
              <Inbox size={18} color="#64748b" />
              <Text style={styles.modalOptionText}>Todos los canales</Text>
              {selectedChannel === "all" && <Check size={16} color="#135bec" />}
            </Pressable>

            {channels.map((acc) => {
              const isSelected = selectedChannel === acc.channel;
              const unread = channelUnreadCounts[acc.channel] ?? 0;
              return (
                <Pressable
                  key={acc.id}
                  style={[
                    styles.modalOption,
                    isSelected && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedChannel(acc.channel);
                    setChannelPickerOpen(false);
                  }}
                >
                  <ChannelIcon channel={acc.channel} size={18} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.modalOptionText}>
                      {CHANNEL_LABELS[acc.channel]}
                    </Text>
                    <Text style={styles.modalOptionSub}>
                      {acc.state === "connected" ? "Conectado" : "Pendiente"}
                    </Text>
                  </View>
                  {unread > 0 && (
                    <View style={styles.modalUnreadBadge}>
                      <Text style={styles.modalUnreadText}>{unread}</Text>
                    </View>
                  )}
                  {isSelected && <Check size={16} color="#135bec" />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  titleWrap: {
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  channelFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  channelFilterLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  channelDropdown: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 32,
    paddingHorizontal: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
  },
  channelDropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  channelDropdownText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  channelActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    position: "relative",
    justifyContent: "center",
    marginBottom: 10,
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    zIndex: 1,
  },
  searchInput: {
    height: 36,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingLeft: 34,
    paddingRight: 32,
    fontSize: 13,
    color: "#0f172a",
  },
  searchClearBtn: {
    position: "absolute",
    right: 8,
    padding: 4,
    zIndex: 1,
  },
  statusFiltersScroll: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 8,
  },
  statusFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
  },
  statusFilterPillActive: {
    backgroundColor: mobileTheme.colors.primary,
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  statusFilterTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  quickFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 2,
  },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  quickBtnActive: {
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
  },
  quickBtnStarredActive: {
    borderColor: "#fde047",
    backgroundColor: "#fefce8",
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  quickBtnTextActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  quickBtnStarredTextActive: {
    color: "#ca8a04",
    fontWeight: "700",
  },
  counterStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  counterTotal: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  counterUnread: {
    fontSize: 11,
    color: "#135bec",
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 110,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  itemRowUnread: {
    backgroundColor: "#fcfdff",
  },
  itemRowPressed: {
    backgroundColor: "#f8fafc",
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  avatarNormal: {
    backgroundColor: "#f1f5f9",
  },
  avatarUnread: {
    backgroundColor: "#135bec",
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: "700",
  },
  avatarInitialsNormal: {
    color: "#334155",
  },
  avatarInitialsUnread: {
    color: "#ffffff",
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  nameTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
    paddingRight: 8,
  },
  contactNameBold: {
    fontWeight: "700",
  },
  timeText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  timeTextUnread: {
    color: "#135bec",
    fontWeight: "600",
  },
  snippetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  channelSnippetLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  bulletSeparator: {
    fontSize: 11,
    color: "#94a3b8",
  },
  snippetText: {
    fontSize: 12,
    color: "#64748b",
    flex: 1,
  },
  snippetTextUnread: {
    color: "#1e293b",
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  assigneeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  assigneeAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  assigneeAvatarText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  assigneeName: {
    fontSize: 10,
    color: "#64748b",
  },
  unassignedText: {
    fontSize: 10,
    color: "#94a3b8",
  },
  presenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  unreadPill: {
    marginLeft: "auto",
    backgroundColor: "#135bec",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
  },
  starBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stateContainer: {
    padding: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  modalOptionActive: {
    backgroundColor: "#f8faff",
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginLeft: 10,
  },
  modalOptionSub: {
    fontSize: 11,
    color: "#64748b",
    marginLeft: 10,
  },
  modalUnreadBadge: {
    backgroundColor: "#135bec",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  modalUnreadText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },
});
