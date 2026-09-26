import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock,
  DollarSign,
  Flame,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mobileCrmAdapter, type CRMLead } from "../adapters/crm";
import { mobileContactAdapter } from "../adapters/contact";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";
import { useT } from "../i18n";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobilePageTabs,
  MobileSearchBar,
  MobileCard,
  MobileButton,
  MobileStatusBadge,
  MobileAvatar,
  MobileProgressBar,
  MobileMetricGrid,
  MobileSpeedDialBar,
  MobileEmptyState,
  MobileLoadingState,
} from "./ui";
import { mobileTheme } from "../theme/tokens";
import { mobileTenantContextAdapter } from "../adapters/auth";

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
  const organizationId = mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId || "";

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsList, contactsPage] = await Promise.all([
        mobileCrmAdapter.listAllLeads(),
        mobileContactAdapter.listContacts({
          organizationId,
          limit: 100,
        }),
      ]);
      setLeads(leadsList);
      setContacts(contactsPage.items || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [organizationId]);

  const contactMap = useMemo(() => {
    const map = new Map<string, ContactRecord>();
    contacts.forEach((c) => map.set(c.id, c));
    return map;
  }, [contacts]);

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

  const tabs = useMemo(() => {
    const list: Array<{ id: FilterStatus; label: string; count: number }> = [
      { id: "all", label: "Todos", count: leads.length },
      { id: "new", label: "Nuevos", count: leads.filter((l) => l.status === "new").length },
      { id: "contacted", label: "Contactados", count: leads.filter((l) => l.status === "contacted").length },
      { id: "qualified", label: "Calificados", count: leads.filter((l) => l.status === "qualified").length },
      { id: "stalled", label: "Estancados", count: leads.filter((l) => l.status === "stalled").length },
      { id: "converted", label: "Convertidos", count: leads.filter((l) => l.status === "converted").length },
    ];
    return list;
  }, [leads]);

  const kpis = [
    { label: t("crm.leads.kpiTotal"), value: String(stats.total) },
    { label: t("crm.leads.kpiQualified"), value: String(stats.qualified) },
    { label: t("crm.leads.kpiHot"), value: String(stats.hot) },
    {
      label: t("crm.leads.kpiPipeline"),
      value: `$${(stats.totalPipelineValue / 1000).toFixed(0)}k`,
    },
  ];

  const getLeadTone = (status: CRMLead["status"]): "neutral" | "info" | "success" | "warning" | "destructive" => {
    switch (status) {
      case "converted":
        return "success";
      case "qualified":
        return "info";
      case "contacted":
        return "warning";
      case "stalled":
        return "destructive";
      default:
        return "neutral";
    }
  };

  return (
    <MobilePageContainer onRefresh={loadData} refreshing={loading}>
      {/* Canonical Header */}
      <MobilePageHeader
        eyebrow="SALES CRM"
        title={t("crm.leads.title")}
        subtitle={`${filteredLeads.length} de ${leads.length} prospectos activos`}
        primaryAction={{
          label: "Nuevo Lead",
          icon: <Plus size={15} color="#ffffff" strokeWidth={2.5} />,
          onPress: onCreateLead,
        }}
      />

      {/* KPI Metrics Strip */}
      <MobileCard style={styles.kpiCardWrapper}>
        <MobileMetricGrid items={kpis} columns={4} />
      </MobileCard>

      {/* Canonical Search Input */}
      <View style={styles.searchWrapper}>
        <MobileSearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t("crm.leads.searchPlaceholder")}
          onClear={() => setSearch("")}
        />
      </View>

      {/* Canonical Horizontal Page Tabs (strictly NO pills, 2.5px active indicator, badge counts) */}
      <View style={styles.tabsWrapper}>
        <MobilePageTabs
          tabs={tabs}
          activeTab={activeFilter}
          onTabChange={(id) => setActiveFilter(id as FilterStatus)}
        />
      </View>

      {/* Leads List */}
      {loading ? (
        <MobileLoadingState message={t("common.loading")} />
      ) : filteredLeads.length === 0 ? (
        <MobileEmptyState
          icon={<Users size={32} color={mobileTheme.colors.primary} />}
          title={t("crm.leads.emptyTitle")}
          description={
            leads.length
              ? "No se encontraron leads con el filtro actual."
              : t("crm.leads.emptySubtitle")
          }
          actionLabel={leads.length ? "Limpiar filtro" : "Crear Lead"}
          onAction={leads.length ? () => { setSearch(""); setActiveFilter("all"); } : onCreateLead}
        />
      ) : (
        <View style={styles.list}>
          {filteredLeads.map((lead, index) => {
            const contact = resolveContactForLead(lead, index);
            const contactName = contact
              ? [contact.firstName, contact.lastName].filter(Boolean).join(" ")
              : `Prospecto · ${lead.ownerName || "Sin asignar"}`;
            const companyRole =
              [contact?.jobTitle, contact?.companyName].filter(Boolean).join(" · ") ||
              "Empresa en prospección";

            const score = lead.score ?? 50;
            const isHot = score >= 75;

            return (
              <MobileCard key={lead.id} style={styles.leadCard}>
                {/* Header Row: Avatar, Name & Status */}
                <View style={styles.cardHeader}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ver ficha de ${contactName}`}
                    onPress={() => onViewLead(lead)}
                    style={styles.avatarRow}
                  >
                    <MobileAvatar name={contactName} size="md" />
                    <View style={styles.headerTextWrap}>
                      <View style={styles.nameRow}>
                        <Text style={styles.contactName} numberOfLines={1}>
                          {contactName}
                        </Text>
                        {isHot && (
                          <View style={styles.hotBadge}>
                            <Flame size={12} color="#b45309" />
                            <Text style={styles.hotBadgeText}>{score}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.companyName} numberOfLines={1}>
                        {companyRole}
                      </Text>
                    </View>
                  </Pressable>

                  <MobileStatusBadge
                    tone={getLeadTone(lead.status)}
                    label={t(`crm.leads.statusFilter.${lead.status}`) || lead.status}
                    dot
                  />
                </View>

                {/* Commercial Interest */}
                {lead.interest ? (
                  <View style={styles.interestBox}>
                    <Text style={styles.interestText} numberOfLines={2}>
                      {lead.interest}
                    </Text>
                  </View>
                ) : null}

                {/* Score Progress Bar */}
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Calificación del Lead</Text>
                  <MobileProgressBar
                    progress={score / 100}
                    tone={score >= 80 ? "success" : score >= 50 ? "info" : "warning"}
                    showPercentage
                  />
                </View>

                {/* Metadata Row: Value & Date */}
                <View style={styles.metaRow}>
                  {lead.estimatedValue ? (
                    <View style={styles.metaItem}>
                      <DollarSign size={13} color={mobileTheme.colors.primary} />
                      <Text style={styles.metaValueText}>
                        ${lead.estimatedValue.toLocaleString()} {lead.estimatedCurrency || "USD"}
                      </Text>
                    </View>
                  ) : null}

                  {lead.source ? (
                    <View style={styles.sourceTag}>
                      <Text style={styles.sourceTagText}>{lead.source}</Text>
                    </View>
                  ) : null}

                  <View style={styles.metaItem}>
                    <Clock size={12} color="#94a3b8" />
                    <Text style={styles.metaTimeText}>
                      {new Date(lead.lastActivityAt || lead.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* 1-Tap Speed Dial Bar */}
                <View style={styles.dialBarWrapper}>
                  <MobileSpeedDialBar
                    phone={contact?.phone || contact?.secondaryPhone || undefined}
                    email={contact?.email || undefined}
                    whatsapp={contact?.phone || contact?.secondaryPhone || undefined}
                    contactName={contactName}
                  />
                </View>

                {/* Footer Action to View Detail */}
                <View style={styles.cardFooter}>
                  <MobileButton
                    variant="ghost"
                    size="sm"
                    label={t("crm.leads.view")}
                    icon={<ArrowRight size={14} color={mobileTheme.colors.primary} />}
                    onPress={() => onViewLead(lead)}
                  />
                </View>
              </MobileCard>
            );
          })}
        </View>
      )}
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  kpiCardWrapper: {
    padding: 12,
    marginBottom: 12,
  },
  searchWrapper: {
    marginBottom: 10,
  },
  tabsWrapper: {
    marginBottom: 14,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  leadCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  headerTextWrap: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "700",
    color: mobileTheme.colors.textPrimary,
  },
  hotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hotBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#b45309",
  },
  companyName: {
    fontSize: 12,
    color: mobileTheme.colors.textSecondary,
    marginTop: 2,
  },
  interestBox: {
    backgroundColor: mobileTheme.colors.background,
    borderRadius: mobileTheme.radii.input,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderLight,
  },
  interestText: {
    fontSize: 13,
    color: mobileTheme.colors.textPrimary,
    lineHeight: 18,
  },
  scoreRow: {
    marginBottom: 10,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaValueText: {
    fontSize: 13,
    fontWeight: "800",
    color: mobileTheme.colors.textPrimary,
  },
  metaTimeText: {
    fontSize: 12,
    color: mobileTheme.colors.textSecondary,
  },
  sourceTag: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: mobileTheme.radii.input,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sourceTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  dialBarWrapper: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
});
