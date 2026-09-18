import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  MapPin,
  Mic,
  Package,
  Search,
  Settings,
  User,
  Video,
  X,
  XCircle,
} from "lucide-react-native";
import { MobileBottomSheet } from "../ui/MobileBottomSheet";
import { MobileCard } from "../ui/MobileCard";
import { MobileAvatar } from "../ui/MobileAvatar";
import { MobileStatusBadge, type MobileStatusTone } from "../ui/MobileStatusBadge";
import { mobileTheme } from "../../theme/tokens";
import type {
  CommunicationMessage,
  ConversationSummary,
} from "../../../../src/loopdev/domains/communications";
import {
  buildConversationTimelineMarkers,
  filterTimelineMarkers,
  getTimelineCategoryCounts,
  groupTimelineMarkersByDate,
  type TimelineCategory,
  type TimelineMarker,
  type TimelineMarkerType,
} from "../../domains/communicationsTimeline";

export type ConversationContextTab = "crm" | "operations" | "timeline";

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
  messages?: CommunicationMessage[];
  initialTab?: ConversationContextTab;
  onSelectMarker?: (messageId: string) => void;
  onNavigateToContact?: (contactId: string) => void;
  onScheduleTask?: () => void;
  onInsertCatalogItem?: () => void;
  onCloseConversation?: () => void;
  onReopenConversation?: () => void;
}

const markerIcons: Record<TimelineMarkerType, React.ComponentType<{ size: number; color: string }>> = {
  day: CalendarDays,
  document: FileText,
  audio: Mic,
  image: ImageIcon,
  video: Video,
  location: MapPin,
  link: Link2,
  catalog_item: Package,
};

export function MobileConversationContextSheet({
  visible,
  onClose,
  customer,
  summary,
  messages = [],
  initialTab = "crm",
  onSelectMarker,
  onNavigateToContact,
  onScheduleTask,
  onInsertCatalogItem,
  onCloseConversation,
  onReopenConversation,
}: Props) {
  const [activeTab, setActiveTab] = useState<ConversationContextTab>(initialTab);
  const [timelineCategory, setTimelineCategory] = useState<TimelineCategory>("all");
  const [timelineSearch, setTimelineSearch] = useState("");

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      setTimelineSearch("");
    }
  }, [visible, initialTab]);

  const contactName = customer?.name || summary.contact?.displayName || "Contacto Desconocido";
  const contactMeta = customer?.email || customer?.phone || summary.contact?.phone || summary.contact?.email || "Sin canal directo";
  const channelDisplay = summary.channel.toUpperCase();
  const isClosed = summary.status === "closed";

  const statusTone: MobileStatusTone = isClosed
    ? "neutral"
    : summary.status === "pending"
    ? "warning"
    : "success";

  // Timeline processing
  const markers = useMemo(() => buildConversationTimelineMarkers(messages), [messages]);
  const categoryCounts = useMemo(() => getTimelineCategoryCounts(markers), [markers]);
  const filteredMarkers = useMemo(
    () => filterTimelineMarkers(markers, timelineCategory, timelineSearch),
    [markers, timelineCategory, timelineSearch]
  );
  const groupedMarkers = useMemo(
    () => groupTimelineMarkersByDate(filteredMarkers),
    [filteredMarkers]
  );

  const handleMarkerPress = (messageId: string) => {
    onClose();
    if (onSelectMarker) {
      onSelectMarker(messageId);
    }
  };

  return (
    <MobileBottomSheet
      visible={visible}
      onClose={onClose}
      title="Contexto de Conversación"
      height="90%"
      maxHeight="90%"
    >
      <View style={styles.container}>
        {/* Context Navigation Tabs (CRM, Operations, Timeline) */}
        <View style={styles.tabBar} role="tablist">
          <Pressable
            style={[styles.tabButton, activeTab === "crm" && styles.tabButtonActive]}
            onPress={() => setActiveTab("crm")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "crm" }}
          >
            <User
              size={15}
              color={activeTab === "crm" ? mobileTheme.colors.primary : mobileTheme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "crm" && styles.tabButtonTextActive,
              ]}
            >
              Ficha CRM
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === "operations" && styles.tabButtonActive]}
            onPress={() => setActiveTab("operations")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "operations" }}
          >
            <Settings
              size={15}
              color={activeTab === "operations" ? mobileTheme.colors.primary : mobileTheme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "operations" && styles.tabButtonTextActive,
              ]}
            >
              Operaciones
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === "timeline" && styles.tabButtonActive]}
            onPress={() => setActiveTab("timeline")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "timeline" }}
          >
            <Clock
              size={15}
              color={activeTab === "timeline" ? mobileTheme.colors.primary : mobileTheme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "timeline" && styles.tabButtonTextActive,
              ]}
            >
              Línea de Tiempo
            </Text>
            {markers.length > 0 ? (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{markers.length}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* TAB 1: CRM CONTEXT */}
        {activeTab === "crm" && (
          <View style={styles.tabContent}>
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
          </View>
        )}

        {/* TAB 2: OPERATIONS */}
        {activeTab === "operations" && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>ACCIONES DE FLUJO Y GESTIÓN</Text>

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
        )}

        {/* TAB 3: TIMELINE */}
        {activeTab === "timeline" && (
          <View style={styles.tabContent}>
            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              <Pressable
                style={[
                  styles.categoryChip,
                  timelineCategory === "all" && styles.categoryChipActive,
                ]}
                onPress={() => setTimelineCategory("all")}
                accessibilityRole="tab"
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    timelineCategory === "all" && styles.categoryChipTextActive,
                  ]}
                >
                  Todos ({categoryCounts.all})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.categoryChip,
                  timelineCategory === "files" && styles.categoryChipActive,
                ]}
                onPress={() => setTimelineCategory("files")}
                accessibilityRole="tab"
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    timelineCategory === "files" && styles.categoryChipTextActive,
                  ]}
                >
                  Archivos ({categoryCounts.files})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.categoryChip,
                  timelineCategory === "media" && styles.categoryChipActive,
                ]}
                onPress={() => setTimelineCategory("media")}
                accessibilityRole="tab"
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    timelineCategory === "media" && styles.categoryChipTextActive,
                  ]}
                >
                  Multimedia ({categoryCounts.media})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.categoryChip,
                  timelineCategory === "links-places" && styles.categoryChipActive,
                ]}
                onPress={() => setTimelineCategory("links-places")}
                accessibilityRole="tab"
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    timelineCategory === "links-places" && styles.categoryChipTextActive,
                  ]}
                >
                  Enlaces y Lugares ({categoryCounts["links-places"]})
                </Text>
              </Pressable>
            </ScrollView>

            {/* Timeline Search Input */}
            <View style={styles.searchBar}>
              <Search size={16} color={mobileTheme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar hitos en la conversación..."
                placeholderTextColor={mobileTheme.colors.textMuted}
                value={timelineSearch}
                onChangeText={setTimelineSearch}
                autoCorrect={false}
              />
              {timelineSearch ? (
                <Pressable
                  onPress={() => setTimelineSearch("")}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <X size={16} color={mobileTheme.colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            {/* Timeline Grouped Milestones List */}
            {filteredMarkers.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={28} color={mobileTheme.colors.textSubtle} />
                <Text style={styles.emptyStateTitle}>No se encontraron hitos</Text>
                <Text style={styles.emptyStateSubtitle}>
                  {timelineSearch
                    ? "Ningún hito coincide con tu búsqueda."
                    : "No hay elementos registrados en esta categoría."}
                </Text>
              </View>
            ) : (
              <View style={styles.milestonesList}>
                {Object.entries(groupedMarkers).map(([date, dateMarkers]) => (
                  <View key={date} style={styles.dateGroup}>
                    <Text style={styles.dateGroupHeader}>{date.toUpperCase()}</Text>
                    <View style={styles.dateGroupItems}>
                      {dateMarkers.map((marker) => {
                        const IconComponent = markerIcons[marker.type] || CalendarDays;
                        return (
                          <Pressable
                            key={marker.id}
                            style={({ pressed }) => [
                              styles.milestoneCard,
                              pressed && styles.milestoneCardPressed,
                            ]}
                            onPress={() => handleMarkerPress(marker.messageId)}
                            accessibilityRole="button"
                          >
                            <View style={styles.milestoneIconBox}>
                              <IconComponent
                                size={16}
                                color={mobileTheme.colors.primary}
                              />
                            </View>

                            <View style={styles.milestoneInfo}>
                              <Text style={styles.milestoneLabel} numberOfLines={1}>
                                {marker.label}
                              </Text>
                              <Text style={styles.milestoneDetail} numberOfLines={2}>
                                {marker.detail}
                              </Text>
                            </View>

                            <View style={styles.milestoneJumpBtn}>
                              <Text style={styles.milestoneJumpText}>Saltar</Text>
                              <ChevronRight
                                size={14}
                                color={mobileTheme.colors.primary}
                              />
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 6,
    minHeight: 38,
  },
  tabButtonActive: {
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderLight,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: mobileTheme.colors.textMuted,
  },
  tabButtonTextActive: {
    color: mobileTheme.colors.primary,
    fontWeight: "700",
  },
  tabBadge: {
    backgroundColor: mobileTheme.colors.primarySoft,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  tabContent: {
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
    minHeight: 44,
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
  categoryScroll: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    minHeight: 34,
    justifyContent: "center",
  },
  categoryChipActive: {
    backgroundColor: mobileTheme.colors.primarySoft,
    borderColor: mobileTheme.colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: mobileTheme.colors.textMuted,
  },
  categoryChipTextActive: {
    color: mobileTheme.colors.primary,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 8,
    minHeight: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: mobileTheme.colors.textMain,
    paddingVertical: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.textMain,
    marginTop: 4,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
    textAlign: "center",
  },
  milestonesList: {
    gap: 14,
  },
  dateGroup: {
    gap: 6,
  },
  dateGroupHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 2,
  },
  dateGroupItems: {
    gap: 6,
  },
  milestoneCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: 8,
    padding: 10,
    gap: 10,
    minHeight: 52,
  },
  milestoneCardPressed: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
  },
  milestoneIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: mobileTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.textMain,
  },
  milestoneDetail: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
    marginTop: 1,
  },
  milestoneJumpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  milestoneJumpText: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
});
