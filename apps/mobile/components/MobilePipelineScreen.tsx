import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import {
  Calendar,
  DollarSign,
  MoveRight,
  Plus,
  RotateCcw,
  Sparkles,
  TrendingUp,
  User,
  ChevronRight,
  Filter,
} from "lucide-react-native";
import { mobileCrmAdapter, type CRMOpportunity } from "../adapters/crm";
import { mobileContactAdapter } from "../adapters/contact";
import { mobileTenantContextAdapter } from "../adapters/auth";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";
import { pipelineStages, type PipelineStageId } from "../../../packages/contracts/src/pipeline-capability";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobileCard,
  MobilePageTabs,
  MobileSearchBar,
  MobileButton,
  MobileStatusBadge,
  MobileMetricGrid,
  MobileEmptyState,
  MobileLoadingState,
  MobileSpeedDialBar,
  MobileConfirmDialog,
  MobileBottomSheet,
  MobileProgressBar,
} from "./ui";
import { useT } from "../i18n";

interface MobilePipelineScreenProps {
  onBack: () => void;
  onNavigate?: (path: string) => void;
}

const STAGE_COLORS: Record<PipelineStageId, { bg: string; text: string; border: string }> = {
  prospecting: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
  qualified: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  proposal: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  negotiation: { bg: "#fefce8", text: "#a16207", border: "#fde047" },
  won: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  lost: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
};

export default function MobilePipelineScreen({ onBack, onNavigate }: MobilePipelineScreenProps) {
  const t = useT();
  const stageLabel = (stage: PipelineStageId) => t(`crm.pipeline.stages.${stage}`);
  const [opportunities, setOpportunities] = useState<CRMOpportunity[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");

  // Modals & BottomSheets
  const [stageModalOpportunity, setStageModalOpportunity] = useState<CRMOpportunity | null>(null);
  const [reopenModalOpportunity, setReopenModalOpportunity] = useState<CRMOpportunity | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  // New Opportunity Form State
  const [newDealName, setNewDealName] = useState("");
  const [newContactId, setNewContactId] = useState("");
  const [newAmount, setNewAmount] = useState("25000");
  const [newCurrency] = useState("USD");
  const [newStage] = useState<PipelineStageId>("prospecting");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [oppList, contactsPage] = await Promise.all([
        mobileCrmAdapter.listAllOpportunities(),
        mobileContactAdapter.listContacts({
          organizationId: mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId || "",
          limit: 100,
        }),
      ]);
      setOpportunities(oppList);
      const contactList = contactsPage?.items || [];
      setContacts(contactList);
      if (contactList.length > 0 && !newContactId) {
        setNewContactId(contactList[0].id);
      }
    } catch (err) {
      console.error("Error loading pipeline data:", err);
    } finally {
      setLoading(false);
    }
  }, [newContactId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const contactsMap = useMemo(() => {
    const map = new Map<string, ContactRecord>();
    contacts.forEach((c) => map.set(c.id, c));
    return map;
  }, [contacts]);

  // KPIs
  const kpis = useMemo(() => {
    let totalPipelineValue = 0;
    let weightedForecast = 0;
    let openCount = 0;
    let wonCount = 0;
    let lostCount = 0;

    opportunities.forEach((opp) => {
      const amt = opp.amount || 0;
      const prob =
        opp.probability !== undefined
          ? opp.probability
          : opp.stageKey === "won"
          ? 1
          : opp.stageKey === "lost"
          ? 0
          : 0.5;

      if (opp.stageKey === "won") {
        wonCount++;
      } else if (opp.stageKey === "lost") {
        lostCount++;
      } else {
        openCount++;
        totalPipelineValue += amt;
        weightedForecast += amt * prob;
      }
    });

    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

    return {
      totalPipelineValue,
      weightedForecast: Math.round(weightedForecast),
      openCount,
      winRate,
    };
  }, [opportunities]);

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchesStage = selectedStage === "all" || opp.stageKey === selectedStage;
      const contact = contactsMap.get(opp.contactId);
      const contactName = contact ? `${contact.givenName} ${contact.familyName}` : "";
      const orgName = contact?.organizationName || "";
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        opp.name.toLowerCase().includes(q) ||
        contactName.toLowerCase().includes(q) ||
        orgName.toLowerCase().includes(q) ||
        opp.stageKey.toLowerCase().includes(q);

      return matchesStage && matchesQuery;
    });
  }, [opportunities, selectedStage, searchQuery, contactsMap]);

  // Stage change handler
  const handleStageSelect = async (targetStage: PipelineStageId) => {
    if (!stageModalOpportunity) return;

    if (stageModalOpportunity.stageKey === "won" || stageModalOpportunity.stageKey === "lost") {
      const current = stageModalOpportunity;
      setStageModalOpportunity(null);
      setReopenModalOpportunity(current);
      return;
    }

    try {
      await mobileCrmAdapter.moveOpportunityStage(stageModalOpportunity.id, targetStage, undefined, stageModalOpportunity.updatedAt);
      setStageModalOpportunity(null);
      await loadData();
    } catch (err: any) {
      Alert.alert(t("crm.common.error"), err?.message || t("crm.pipeline.errors.stageUpdate"));
    }
  };

  // Reopen handler
  const handleReopenSubmit = async () => {
    if (!reopenModalOpportunity || !reopenReason.trim()) {
      Alert.alert(t("crm.pipeline.errors.reasonRequired"), t("crm.pipeline.errors.reopenReason"));
      return;
    }

    try {
      await mobileCrmAdapter.reopenOpportunity(reopenModalOpportunity.id, reopenReason);
      setReopenModalOpportunity(null);
      setReopenReason("");
      await loadData();
    } catch (err: any) {
      Alert.alert(t("crm.pipeline.errors.reopen"), err?.message || t("crm.pipeline.errors.reopenFailed"));
    }
  };

  // Create Opportunity handler
  const handleCreateSubmit = async () => {
    if (!newDealName.trim()) {
      Alert.alert(t("crm.pipeline.errors.required"), t("crm.pipeline.errors.dealName"));
      return;
    }
    if (!newContactId) {
      Alert.alert(t("crm.pipeline.errors.contactRequired"), t("crm.pipeline.errors.contactSelect"));
      return;
    }

    try {
      const selectedContact = contactsMap.get(newContactId);
      await mobileCrmAdapter.createOpportunity({
        organizationId: selectedContact?.organizationId || mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId || "",
        contactId: newContactId,
        leadId: null,
        catalogItemId: null,
        productKey: null,
        name: newDealName.trim(),
        amount: Number(newAmount) || 0,
        currency: newCurrency,
        stageKey: newStage,
        probability:
          newStage === "prospecting"
            ? 0.15
            : newStage === "qualified"
            ? 0.4
            : newStage === "proposal"
            ? 0.65
            : newStage === "negotiation"
            ? 0.8
            : 0.5,
        origin: "manual",
        ownerName: "Maya Chen",
        ownerId: "owner-maya",
        expectedCloseAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        lossReason: null,
      });

      setCreateSheetOpen(false);
      setNewDealName("");
      setNewAmount("25000");
      await loadData();
    } catch (err: any) {
      Alert.alert(t("crm.pipeline.errors.create"), err?.message || t("crm.pipeline.errors.createFailed"));
    }
  };

  const openPhone = (phone?: string) => {
    if (!phone) {
      Alert.alert(t("crm.pipeline.errors.noPhone"), t("crm.pipeline.errors.noPhoneDescription"));
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) {
      Alert.alert(t("crm.pipeline.errors.noPhone"), t("crm.pipeline.errors.noPhoneDescription"));
      return;
    }
    const cleanNumber = phone.replace(/[^\d+]/g, "");
    Linking.openURL(`https://wa.me/${cleanNumber}`);
  };

  const openEmail = (email?: string) => {
    if (!email) {
      Alert.alert(t("crm.pipeline.errors.noEmail"), t("crm.pipeline.errors.noEmailDescription"));
      return;
    }
    Linking.openURL(`mailto:${email}`);
  };

  const formatCurrency = (amt: number | null, curr: string = "USD") => {
    if (amt === null || amt === undefined) return "$0";
    return `$${amt.toLocaleString("en-US")} ${curr}`;
  };

  // Build tabs for MobilePageTabs (NO PILLS)
  const tabs = useMemo(() => {
    const allTab = {
      id: "all",
      label: t("common.all"),
      count: opportunities.length,
    };
    const stageTabsList = pipelineStages.map((stage) => {
      const count = opportunities.filter((o) => o.stageKey === stage.id).length;
      return {
        id: stage.id,
        label: stageLabel(stage.id) || stage.label,
        count,
      };
    });
    return [allTab, ...stageTabsList];
  }, [opportunities]);

  return (
    <MobilePageContainer>
      {/* Canonical Header */}
      <MobilePageHeader
        title={t("crm.pipeline.title")}
        subtitle={t("crm.pipeline.subtitle")}
        onBack={onBack}
        rightAction={
          <MobileButton
            variant="primary"
            size="sm"
            icon={Plus}
            onPress={() => setCreateSheetOpen(true)}
            minHeight={36}
          >
            {t("crm.pipeline.new")}
          </MobileButton>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Metrics Grid */}
        <View style={styles.metricsWrapper}>
          <MobileMetricGrid
            columns={2}
            metrics={[
              {
                id: "pipeline_val",
                label: t("crm.pipeline.metrics.active"),
                value: `$${(kpis.totalPipelineValue / 1000).toFixed(0)}k`,
                subtext: t("crm.pipeline.metrics.nominal"),
                status: "info",
                icon: DollarSign,
              },
              {
                id: "forecast",
                label: t("crm.pipeline.metrics.forecast"),
                value: `$${(kpis.weightedForecast / 1000).toFixed(0)}k`,
                subtext: t("crm.pipeline.metrics.estimatedClose"),
                status: "success",
                icon: Sparkles,
              },
              {
                id: "open_deals",
                label: t("crm.pipeline.metrics.openDeals"),
                value: String(kpis.openCount),
                subtext: t("crm.pipeline.metrics.negotiating"),
                status: "warning",
                icon: TrendingUp,
              },
              {
                id: "win_rate",
                label: t("crm.pipeline.metrics.winRate"),
                value: `${kpis.winRate}%`,
                subtext: t("crm.pipeline.metrics.closeRate"),
                status: "neutral",
                icon: Filter,
              },
            ]}
          />
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <MobileSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("crm.pipeline.searchPlaceholder")}
            onClear={() => setSearchQuery("")}
          />
        </View>

        {/* Canonical Horizontal Tabs (NO PILLS, 2.5px active indicator, badge count) */}
        <MobilePageTabs
          tabs={tabs}
          activeTab={selectedStage}
          onTabChange={setSelectedStage}
        />

        {/* Opportunities List */}
        <View style={styles.listContainer}>
          {loading ? (
            <MobileLoadingState message={t("crm.pipeline.loading")} />
          ) : filteredOpportunities.length === 0 ? (
            <MobileEmptyState
              title={t("crm.pipeline.empty.title")}
              description={
                searchQuery
                  ? t("crm.pipeline.empty.searchDescription")
                  : t("crm.pipeline.empty.description")
              }
              actionLabel={searchQuery ? t("crm.pipeline.clearFilter") : t("crm.pipeline.create")}
              onAction={() => {
                if (searchQuery) setSearchQuery("");
                else setCreateSheetOpen(true);
              }}
            />
          ) : (
            filteredOpportunities.map((opp) => {
              const contact = contactsMap.get(opp.contactId);
              const contactFullName = contact
                ? `${contact.givenName} ${contact.familyName}`
                : t("crm.pipeline.unassignedContact");
              const orgName = contact?.organizationName || t("crm.pipeline.defaultCompany");
              const isTerminal = opp.stageKey === "won" || opp.stageKey === "lost";
              const probPct =
                opp.probability !== undefined
                  ? Math.round(opp.probability * 100)
                  : opp.stageKey === "won"
                  ? 100
                  : opp.stageKey === "lost"
                  ? 0
                  : 50;

              return (
                <MobileCard key={opp.id} style={styles.dealCard}>
                  {/* Pressable Deal Main Area (Targets >= 44px) */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("crm.pipeline.viewDeal", { name: opp.name })}
                    onPress={() => onNavigate?.(`/app/sales-crm/opportunities/${opp.id}`)}
                    style={({ pressed }) => [styles.cardPressableArea, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardTitleWrap}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {opp.name}
                        </Text>
                        <Text style={styles.cardSubtitle} numberOfLines={1}>
                          {contactFullName} · {orgName}
                        </Text>
                      </View>
                      <MobileStatusBadge
                        status={
                          opp.stageKey === "won"
                            ? "success"
                            : opp.stageKey === "lost"
                            ? "destructive"
                            : opp.stageKey === "negotiation"
                            ? "warning"
                            : "info"
                        }
                        label={stageLabel(opp.stageKey) || opp.stageKey}
                        size="sm"
                      />
                    </View>

                    {/* Financial amount & probability bar */}
                    <View style={styles.dealAmountRow}>
                      <View>
                        <Text style={styles.amountLabel}>{t("crm.pipeline.amount")}</Text>
                        <Text style={styles.amountValue}>
                          {formatCurrency(opp.amount, opp.currency)}
                        </Text>
                      </View>
                      <View style={styles.probBox}>
                        <View style={styles.probTextRow}>
                          <Text style={styles.probLabel}>{t("crm.pipeline.probability")}</Text>
                          <Text style={styles.probValue}>{probPct}%</Text>
                        </View>
                        <MobileProgressBar progress={probPct} height={6} />
                      </View>
                    </View>

                    {/* Meta tags row */}
                    <View style={styles.metaTagsRow}>
                      {opp.origin === "lead_conversion" && (
                        <View style={styles.tagItem}>
                          <Sparkles size={11} color="#4f46e5" />
                          <Text style={[styles.tagItemText, { color: "#4f46e5" }]}>{t("crm.common.fromLead")}</Text>
                        </View>
                      )}
                      {opp.expectedCloseAt && (
                        <View style={styles.tagItem}>
                          <Calendar size={11} color="#64748b" />
                          <Text style={styles.tagItemText}>
                            Cierre:{" "}
                            {t("crm.pipeline.closeDate", { date: new Date(opp.expectedCloseAt).toLocaleDateString("es-ES", {
                              month: "short",
                              day: "numeric",
                            }) })}
                          </Text>
                        </View>
                      )}
                      <View style={styles.tagItem}>
                        <User size={11} color="#64748b" />
                        <Text style={styles.tagItemText}>{opp.ownerName || t("crm.pipeline.defaultOwner")}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* Speed Dial & Stage Action Bar */}
                  <View style={styles.bottomActionsRow}>
                    <MobileSpeedDialBar
                      phone={contact?.phone}
                      email={contact?.email}
                      onCall={() => openPhone(contact?.phone ?? undefined)}
                      onWhatsApp={() => openWhatsApp(contact?.phone ?? undefined)}
                      onEmail={() => openEmail(contact?.email ?? undefined)}
                    />

                    <View style={styles.rightActionBtns}>
                      <MobileButton
                        variant="secondary"
                        size="sm"
                        icon={isTerminal ? RotateCcw : MoveRight}
                        onPress={() => {
                          if (isTerminal) {
                            setReopenModalOpportunity(opp);
                          } else {
                            setStageModalOpportunity(opp);
                          }
                        }}
                        minHeight={44}
                      >
                          {isTerminal ? t("crm.pipeline.reopen") : t("crm.pipeline.move")}
                      </MobileButton>

                      <MobileButton
                        variant="ghost"
                        size="sm"
                        icon={ChevronRight}
                        onPress={() => onNavigate?.(`/app/sales-crm/opportunities/${opp.id}`)}
                        minHeight={44}
                      >
                        {t("crm.pipeline.detail")}
                      </MobileButton>
                    </View>
                  </View>
                </MobileCard>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Bottom Sheet: Cambiar Etapa Comercial */}
      <MobileBottomSheet
        visible={!!stageModalOpportunity}
        onClose={() => setStageModalOpportunity(null)}
        title={t("crm.pipeline.stageSheetTitle")}
      >
        <View style={styles.sheetBody}>
          <Text style={styles.sheetSub}>
            {t("crm.pipeline.stageSheetDescription", { name: stageModalOpportunity?.name || "" })}
          </Text>
          <View style={styles.stageOptionsGrid}>
            {pipelineStages.map((st) => {
              const isCurrent = stageModalOpportunity?.stageKey === st.id;
              return (
                <Pressable
                  key={st.id}
                  onPress={() => handleStageSelect(st.id)}
                  style={[styles.stageOptionBtn, isCurrent && styles.stageOptionBtnActive]}
                >
                  <Text style={[styles.stageOptionBtnText, isCurrent && styles.stageOptionBtnTextActive]}>
                    {stageLabel(st.id) || st.label}
                  </Text>
                  {isCurrent && <Text style={styles.currentBadge}>{t("crm.pipeline.current")}</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>
      </MobileBottomSheet>

      {/* Reopen Dialog */}
      <MobileConfirmDialog
        visible={!!reopenModalOpportunity}
        title={t("crm.pipeline.reopenTitle")}
        message={t("crm.pipeline.reopenMessage", { stage: reopenModalOpportunity?.stageKey || "" })}
        confirmLabel={t("crm.pipeline.reopenOpportunity")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleReopenSubmit}
        onCancel={() => {
          setReopenModalOpportunity(null);
          setReopenReason("");
        }}
      >
        <TextInput
          placeholder={t("crm.pipeline.reopenPlaceholder")}
          placeholderTextColor="#94a3b8"
          value={reopenReason}
          onChangeText={setReopenReason}
          multiline
          numberOfLines={3}
          style={styles.reopenInput}
        />
      </MobileConfirmDialog>

      {/* Bottom Sheet: Crear Oportunidad */}
      <MobileBottomSheet
        visible={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        title={t("crm.pipeline.createTitle")}
      >
        <View style={styles.createSheetContent}>
          <Text style={styles.inputLabel}>{t("crm.pipeline.dealNameLabel")}</Text>
          <TextInput
            placeholder={t("crm.pipeline.dealNamePlaceholder")}
            placeholderTextColor="#94a3b8"
            value={newDealName}
            onChangeText={setNewDealName}
            style={styles.formInput}
          />

          <Text style={styles.inputLabel}>{t("crm.pipeline.contactLabel")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactPickerScroll}>
            {contacts.map((c) => {
              const isSelected = newContactId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setNewContactId(c.id)}
                  style={[styles.contactChoice, isSelected && styles.contactChoiceActive]}
                >
                  <Text style={[styles.contactChoiceText, isSelected && styles.contactChoiceTextActive]}>
                    {c.givenName} {c.familyName}
                  </Text>
                  <Text style={styles.contactChoiceSub}>{c.organizationName || t("crm.pipeline.b2b")}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.inputLabel}>{t("crm.pipeline.amountLabel")}</Text>
          <TextInput
            placeholder={t("crm.common.amountPlaceholder")}
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={newAmount}
            onChangeText={setNewAmount}
            style={styles.formInput}
          />

          <View style={styles.submitBtnWrap}>
            <MobileButton variant="primary" size="md" onPress={handleCreateSubmit} minHeight={48}>
              {t("crm.pipeline.create")}
            </MobileButton>
          </View>
        </View>
      </MobileBottomSheet>
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  metricsWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  dealCard: {
    padding: 16,
    marginBottom: 12,
  },
  cardPressableArea: {
    paddingBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748b",
  },
  dealAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.8,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  probBox: {
    width: 120,
  },
  probTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  probLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
  },
  probValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#135bec",
  },
  metaTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagItemText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  bottomActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
    marginTop: 4,
  },
  rightActionBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetBody: {
    paddingVertical: 12,
  },
  sheetSub: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
  },
  stageOptionsGrid: {
    gap: 8,
  },
  stageOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  stageOptionBtnActive: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  stageOptionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  stageOptionBtnTextActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  currentBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#135bec",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reopenInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#0f172a",
    marginTop: 12,
    minHeight: 70,
    textAlignVertical: "top",
  },
  createSheetContent: {
    paddingVertical: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  contactPickerScroll: {
    flexDirection: "row",
    marginBottom: 8,
  },
  contactChoice: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    marginRight: 8,
    justifyContent: "center",
  },
  contactChoiceActive: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  contactChoiceText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  contactChoiceTextActive: {
    color: "#135bec",
  },
  contactChoiceSub: {
    fontSize: 11,
    color: "#64748b",
  },
  submitBtnWrap: {
    marginTop: 20,
    marginBottom: 16,
  },
});
