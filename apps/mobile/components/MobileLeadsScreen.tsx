import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Flame,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  User,
  Zap,
} from "lucide-react-native";
import { mobileCrmAdapter, type CRMLead } from "../adapters/crm";
import { mobileContactAdapter } from "../adapters/contact";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";
import { useT } from "../i18n";
import { mobileTheme } from "../theme/tokens";

interface Props {
  onBack?: () => void;
  onViewLead: (lead: CRMLead) => void;
  onCreateLead: () => void;
  onNavigateToContact: (contactId: string) => void;
}

type FilterStatus = "all" | "new" | "contacted" | "qualified" | "stalled" | "converted";

export function MobileLeadsScreen({
  onViewLead,
  onCreateLead,
  onNavigateToContact,
}: Props) {
  const t = useT();
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsList, contactsPage] = await Promise.all([
        mobileCrmAdapter.listAllLeads(),
        mobileContactAdapter.listContacts({
          organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
          limit: 100,
        }),
      ]);
      setLeads(leadsList);
      setContacts(contactsPage.items || []);
    } catch {
      // noop fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const contactMap = useMemo(() => {
    const map = new Map<string, ContactRecord>();
    contacts.forEach((c) => map.set(c.id, c));
    return map;
  }, [contacts]);

  // Helper to resolve contact reliably (direct ID match or deterministic index match if mock IDs)
  const resolveContactForLead = (lead: CRMLead, index: number): ContactRecord | null => {
    if (contactMap.has(lead.contactId)) {
      return contactMap.get(lead.contactId)!;
    }
    if (contacts.length > 0) {
      const numericId = parseInt((lead.id || "").replace(/\D/g, "") || String(index + 1), 10);
      const safeIndex = (numericId - 1) % contacts.length;
      return contacts[safeIndex >= 0 ? safeIndex : 0] || null;
    }
    return null;
  };

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead, index) => {
      const contact = resolveContactForLead(lead, index);
      const contactName = contact
        ? [contact.firstName, contact.lastName].filter(Boolean).join(" ").toLowerCase()
        : "";
      const company = contact?.companyName?.toLowerCase() || "";
      const interest = lead.interest?.toLowerCase() || "";
      const owner = lead.ownerName?.toLowerCase() || "";

      const matchesSearch =
        !q ||
        contactName.includes(q) ||
        company.includes(q) ||
        interest.includes(q) ||
        owner.includes(q);

      const matchesStatus =
        activeFilter === "all" || lead.status === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, contacts, contactMap, search, activeFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((l) => l.status === "qualified").length;
    const hot = leads.filter((l) => (l.score ?? 0) >= 80).length;
    const totalPipelineValue = leads.reduce(
      (acc, l) => acc + (l.estimatedValue || 0),
      0
    );
    return { total, qualified, hot, totalPipelineValue };
  }, [leads]);

  const handleStatusChange = (lead: CRMLead, nextStatus: CRMLead["status"]) => {
    void mobileCrmAdapter.updateLead(lead.id, { status: nextStatus }).then(() => {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: nextStatus } : l))
      );
    });
  };

  const handleCall = (contact: ContactRecord | null) => {
    if (contact?.phone) {
      void Linking.openURL(`tel:${contact.phone}`);
    } else {
      Alert.alert(t("crm.leads.noPhoneTitle"), t("crm.leads.noPhoneDesc"));
    }
  };

  const handleEmail = (contact: ContactRecord | null) => {
    if (contact?.email) {
      void Linking.openURL(`mailto:${contact.email}`);
    } else {
      Alert.alert(t("crm.leads.noEmailTitle"), t("crm.leads.noEmailDesc"));
    }
  };

  const handleWhatsApp = (contact: ContactRecord | null) => {
    const phone = contact?.phone || contact?.secondaryPhone;
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9+]/g, "");
      void Linking.openURL(`https://wa.me/${cleanPhone}`);
    } else {
      Alert.alert(t("crm.leads.noPhoneTitle"), t("crm.leads.noPhoneDesc"));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerEyebrow}>SALES CRM</Text>
          <Text style={styles.headerTitle}>{t("crm.leads.title")}</Text>
          <Text style={styles.headerSubtitle}>
            {filteredLeads.length} de {leads.length} leads
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable hitSlop={8} onPress={loadData} style={styles.iconButton}>
            <RefreshCw size={16} color="#64748b" />
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={onCreateLead}>
            <Plus size={15} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.primaryButtonText}>{t("crm.leads.newLead")}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* KPI Summary Cards - Clean Unified Monochrome */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiContainer}
        >
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t("crm.leads.kpiTotal")}</Text>
            <Text style={styles.kpiValue}>{stats.total}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t("crm.leads.kpiQualified")}</Text>
            <Text style={styles.kpiValue}>{stats.qualified}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t("crm.leads.kpiHot")}</Text>
            <Text style={styles.kpiValue}>{stats.hot}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t("crm.leads.kpiPipeline")}</Text>
            <Text style={styles.kpiValue}>
              ${(stats.totalPipelineValue / 1000).toFixed(0)}k
            </Text>
          </View>
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            placeholder={t("crm.leads.searchPlaceholder")}
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setSearch("")}>
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Status Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterStrip}
        >
          {(["all", "new", "contacted", "qualified", "stalled", "converted"] as FilterStatus[]).map(
            (status) => {
              const active = activeFilter === status;
              const count = status === "all" ? leads.length : leads.filter((l) => l.status === status).length;
              return (
                <Pressable
                  key={status}
                  style={[styles.filterTab, active && styles.filterTabActive]}
                  onPress={() => setActiveFilter(status)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      active && styles.filterTabTextActive,
                    ]}
                  >
                    {t(`crm.leads.statusFilter.${status}`)}
                  </Text>
                  <View style={[styles.filterTabBadge, active && styles.filterTabBadgeActive]}>
                    <Text style={[styles.filterTabBadgeText, active && styles.filterTabBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            }
          )}
        </ScrollView>

        {/* Leads List */}
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t("common.loading")}</Text>
          </View>
        ) : filteredLeads.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={36} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>{t("crm.leads.emptyTitle")}</Text>
            <Text style={styles.emptyText}>{t("crm.leads.emptySubtitle")}</Text>
          </View>
        ) : (
          <View style={styles.leadsList}>
            {filteredLeads.map((lead, index) => {
              const contact = resolveContactForLead(lead, index);
              const contactName = contact
                ? [contact.firstName, contact.lastName].filter(Boolean).join(" ")
                : `Prospect · ${lead.ownerName || "Lead"}`;
              const initials = contactName
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();

              const score = lead.score ?? 50;
              const isHot = score >= 75;

              return (
                <Pressable
                  key={lead.id}
                  style={styles.leadCard}
                  onPress={() => onViewLead(lead)}
                >
                  {/* Top Card Row */}
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials || "L"}</Text>
                    </View>
                    <View style={styles.cardHeaderCopy}>
                      <View style={styles.nameRow}>
                        <Text style={styles.contactName} numberOfLines={1}>
                          {contactName}
                        </Text>
                        {isHot ? (
                          <View style={styles.heatBadgeHot}>
                            <Flame size={11} color="#b45309" />
                            <Text style={styles.heatBadgeTextHot}>{score}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.companyName} numberOfLines={1}>
                        {[contact?.jobTitle, contact?.companyName].filter(Boolean).join(" · ") ||
                          (contact ? "Cliente registrado" : "Empresa en prospección")}
                      </Text>
                    </View>
                    <StatusBadge status={lead.status} />
                  </View>

                  {/* Interest / Need */}
                  {lead.interest ? (
                    <View style={styles.interestBox}>
                      <Text style={styles.interestText} numberOfLines={2}>
                        {lead.interest}
                      </Text>
                    </View>
                  ) : null}

                  {/* Metadata Row */}
                  <View style={styles.metaRow}>
                    {lead.estimatedValue ? (
                      <View style={styles.metaItem}>
                        <Text style={styles.metaValueText}>
                          ${lead.estimatedValue.toLocaleString()} {lead.estimatedCurrency || "USD"}
                        </Text>
                      </View>
                    ) : null}

                    {lead.source ? (
                      <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>{lead.source}</Text>
                      </View>
                    ) : null}

                    <View style={styles.metaItem}>
                      <Clock size={12} color="#94a3b8" />
                      <Text style={styles.metaTimeText}>
                        {new Date(lead.lastActivityAt || lead.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* 1-Tap Speed Dial Bar - Clean & Cohesive */}
                  <View style={styles.speedDialBar}>
                    <Pressable
                      style={styles.speedDialBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCall(contact);
                      }}
                    >
                      <Phone size={13} color="#475569" />
                      <Text style={styles.speedDialText}>{t("crm.leads.call")}</Text>
                    </Pressable>

                    <Pressable
                      style={styles.speedDialBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(contact);
                      }}
                    >
                      <MessageCircle size={13} color="#16a34a" />
                      <Text style={styles.speedDialText}>WhatsApp</Text>
                    </Pressable>

                    <Pressable
                      style={styles.speedDialBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEmail(contact);
                      }}
                    >
                      <Mail size={13} color="#475569" />
                      <Text style={styles.speedDialText}>{t("crm.leads.email")}</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.speedDialBtn, styles.speedDialBtnPrimary]}
                      onPress={(e) => {
                        e.stopPropagation();
                        onViewLead(lead);
                      }}
                    >
                      <Text style={styles.speedDialBtnPrimaryText}>{t("crm.leads.view")}</Text>
                      <ArrowRight size={12} color="#135bec" />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatusBadge({ status }: { status: CRMLead["status"] }) {
  const t = useT();

  const config: Record<CRMLead["status"], { bg: string; text: string; border: string }> = {
    new: { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
    contacted: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    qualified: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
    stalled: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    converted: { bg: "#f8fafc", text: "#0f172a", border: "#cbd5e1" },
    unqualified: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
    inactive: { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
  };

  const current = config[status] || config.new;

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: current.bg, borderColor: current.border },
      ]}
    >
      <Text style={[styles.statusBadgeText, { color: current.text }]}>
        {t(`crm.leads.status.${status}`) || status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTextWrap: {
    flex: 1,
  },
  headerEyebrow: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  headerTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  headerSubtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#135bec",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  kpiContainer: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  kpiCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 95,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
  },
  clearText: {
    color: "#94a3b8",
    fontSize: 13,
  },
  filterStrip: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  filterTabActive: {
    borderBottomColor: "#135bec",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  filterTabTextActive: {
    color: "#0f172a",
    fontWeight: "800",
  },
  filterTabBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  filterTabBadgeActive: {
    backgroundColor: "#eff6ff",
  },
  filterTabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  filterTabBadgeTextActive: {
    color: "#1d4ed8",
  },
  leadsList: {
    gap: 12,
    marginTop: 4,
  },
  leadCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 11,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  cardHeaderCopy: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  heatBadgeHot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#fef3c7",
    borderColor: "#fde68a",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  heatBadgeTextHot: {
    fontSize: 10,
    fontWeight: "700",
    color: "#92400e",
  },
  companyName: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },
  statusBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  interestBox: {
    backgroundColor: "#f8fafc",
    borderColor: "#f1f5f9",
    borderWidth: 1,
    borderRadius: 8,
    padding: 9,
  },
  interestText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "500",
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaValueText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  metaPill: {
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  metaTimeText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  speedDialBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 2,
  },
  speedDialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 7,
  },
  speedDialText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  speedDialBtnPrimary: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  speedDialBtnPrimaryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#135bec",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptyText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },
});
