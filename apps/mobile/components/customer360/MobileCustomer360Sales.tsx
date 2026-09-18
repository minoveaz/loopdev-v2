import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BriefcaseBusiness, Calendar, Plus, TrendingUp, UserCheck, Users, X } from "lucide-react-native";
import type { CRMLead, CRMOpportunity } from "../../adapters/crm";
import { useT } from "../../i18n";
import { MobilePageTabs } from "../ui";

interface Props {
  leads: CRMLead[];
  opportunities: CRMOpportunity[];
  contactId: string;
  contactName: string;
  onCreateLead?: (lead: Partial<CRMLead>) => Promise<void>;
  onCreateOpportunity?: (opp: Partial<CRMOpportunity>) => Promise<void>;
}

export function MobileCustomer360Sales({
  leads,
  opportunities,
  contactId,
  contactName,
  onCreateLead,
  onCreateOpportunity,
}: Props) {
  const t = useT();
  const [activeSection, setActiveSection] = useState<"leads" | "opportunities">("leads");
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [createOppOpen, setCreateOppOpen] = useState(false);

  // New Lead Form State
  const [leadInterest, setLeadInterest] = useState("");
  const [leadSource, setLeadSource] = useState("Direct");
  const [leadScore, setLeadScore] = useState("75");

  // New Opportunity Form State
  const [oppName, setOppName] = useState("");
  const [oppAmount, setOppAmount] = useState("");
  const [oppStage, setOppStage] = useState<CRMOpportunity["stageKey"]>("prospecting");

  const handleCreateLead = async () => {
    if (!leadInterest.trim()) return;
    if (onCreateLead) {
      await onCreateLead({
        contactId,
        interest: leadInterest.trim(),
        source: leadSource.trim() || "Direct",
        score: parseInt(leadScore, 10) || 50,
        status: "new",
        ownerName: "Alex Morgan",
        createdAt: new Date().toISOString(),
      });
    }
    setLeadInterest("");
    setCreateLeadOpen(false);
  };

  const handleCreateOpp = async () => {
    if (!oppName.trim()) return;
    if (onCreateOpportunity) {
      await onCreateOpportunity({
        contactId,
        name: oppName.trim(),
        amount: parseFloat(oppAmount) || 0,
        currency: "EUR",
        stageKey: oppStage,
        origin: "manual",
        ownerName: "Alex Morgan",
        createdAt: new Date().toISOString(),
      });
    }
    setOppName("");
    setOppAmount("");
    setCreateOppOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Canonical Sales Sub-tabs (strictly NO pills, 2.5px active indicator, badge counts) */}
      <MobilePageTabs
        tabs={[
          { id: "leads", label: t("crm.customer360.sales.leads"), count: leads.length },
          { id: "opportunities", label: t("crm.customer360.sales.opportunities"), count: opportunities.length },
        ]}
        activeTab={activeSection}
        onTabChange={(id) => setActiveSection(id as "leads" | "opportunities")}
      />

      {/* Leads Content */}
      {activeSection === "leads" && (
        <View style={styles.contentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t("crm.customer360.sales.leads")} ({leads.length})</Text>
            <Pressable style={styles.addButton} onPress={() => setCreateLeadOpen(true)}>
              <Plus size={13} color="#135bec" />
              <Text style={styles.addButtonText}>{t("crm.customer360.sales.newLead")}</Text>
            </Pressable>
          </View>

          {leads.length === 0 ? (
            <View style={styles.emptyBox}>
              <Users size={28} color="#94a3b8" />
              <Text style={styles.emptyTitle}>{t("crm.customer360.sales.noLeads")}</Text>
              <Text style={styles.emptySubtitle}>{t("crm.customer360.sales.noLeadsDesc")}</Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {leads.map((lead) => {
                const isConverted = lead.status === "converted";
                const isInactive = lead.status === "inactive" || lead.status === "stalled";
                return (
                  <View key={lead.id} style={styles.leadCard}>
                    <View style={styles.leadTopRow}>
                      <Text style={styles.leadTitle} numberOfLines={2}>
                        {lead.interest || t("crm.customer360.sales.interest")}
                      </Text>
                      <View
                        style={[
                          styles.badge,
                          isConverted ? styles.badgeSuccess : isInactive ? styles.badgeDanger : styles.badgeInfo,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isConverted ? styles.badgeTextSuccess : isInactive ? styles.badgeTextDanger : styles.badgeTextInfo,
                          ]}
                        >
                          {lead.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.metadataGrid}>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>{t("crm.customer360.sales.source")}</Text>
                        <Text style={styles.metaVal}>{lead.source || "Direct"}</Text>
                      </View>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>{t("crm.customer360.sales.score")}</Text>
                        <Text style={[styles.metaVal, { color: "#135bec", fontWeight: "700" }]}>
                          {lead.score ?? "—"}/100
                        </Text>
                      </View>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>{t("crm.customer360.sales.owner")}</Text>
                        <Text style={styles.metaVal}>{lead.ownerName || "—"}</Text>
                      </View>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>{t("crm.customer360.sales.startDate")}</Text>
                        <Text style={styles.metaVal}>
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}
                        </Text>
                      </View>
                    </View>

                    {lead.nextActivityAt && (
                      <View style={styles.nextActivityRow}>
                        <Calendar size={12} color="#64748b" />
                        <Text style={styles.nextActivityText}>
                          {t("crm.customer360.sales.nextActivity", { date: new Date(lead.nextActivityAt).toLocaleDateString() })}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Opportunities Content */}
      {activeSection === "opportunities" && (
        <View style={styles.contentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t("crm.customer360.sales.opportunities")} ({opportunities.length})</Text>
            <Pressable style={styles.addButton} onPress={() => setCreateOppOpen(true)}>
              <Plus size={13} color="#135bec" />
              <Text style={styles.addButtonText}>{t("crm.customer360.sales.newOpportunity")}</Text>
            </Pressable>
          </View>

          {opportunities.length === 0 ? (
            <View style={styles.emptyBox}>
              <BriefcaseBusiness size={28} color="#94a3b8" />
              <Text style={styles.emptyTitle}>{t("crm.customer360.sales.noOpportunities")}</Text>
              <Text style={styles.emptySubtitle}>{t("crm.customer360.sales.noOpportunitiesDesc")}</Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {opportunities.map((opp) => {
                const isWon = opp.stageKey === "won";
                const isLost = opp.stageKey === "lost";
                return (
                  <View key={opp.id} style={styles.leadCard}>
                    <View style={styles.leadTopRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.leadTitle}>{opp.name}</Text>
                        <Text style={styles.oppAmount}>
                          {opp.amount != null ? `${opp.amount.toLocaleString()} ${opp.currency || "EUR"}` : t("crm.customer360.fields.notRegistered")}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          isWon ? styles.badgeSuccess : isLost ? styles.badgeDanger : styles.badgeInfo,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isWon ? styles.badgeTextSuccess : isLost ? styles.badgeTextDanger : styles.badgeTextInfo,
                          ]}
                        >
                          {opp.stageKey.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.metadataGrid}>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>{t("crm.customer360.sales.owner")}</Text>
                        <Text style={styles.metaVal}>{opp.ownerName || "—"}</Text>
                      </View>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>{t("crm.customer360.sales.source")}</Text>
                        <Text style={styles.metaVal}>
                          {opp.origin === "lead_conversion" ? "Lead Conversion" : "Manual"}
                        </Text>
                      </View>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>{t("crm.customer360.sales.expectedClose", { date: "" }).replace(": ", "")}</Text>
                        <Text style={styles.metaVal}>
                          {opp.expectedCloseAt ? new Date(opp.expectedCloseAt).toLocaleDateString() : "—"}
                        </Text>
                      </View>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>{t("crm.customer360.sales.startDate")}</Text>
                        <Text style={styles.metaVal}>
                          {opp.createdAt ? new Date(opp.createdAt).toLocaleDateString() : "—"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Modal: Create Lead */}
      <Modal visible={createLeadOpen} animationType="fade" transparent onRequestClose={() => setCreateLeadOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Lead para {contactName}</Text>
              <Pressable onPress={() => setCreateLeadOpen(false)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Interés principal *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej. Plan Enterprise, Asesoría técnica..."
                placeholderTextColor="#94a3b8"
                value={leadInterest}
                onChangeText={setLeadInterest}
              />
              <Text style={styles.inputLabel}>Fuente / Origen</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej. Web, Evento, Recomendación..."
                placeholderTextColor="#94a3b8"
                value={leadSource}
                onChangeText={setLeadSource}
              />
              <Text style={styles.inputLabel}>Lead Score (0 - 100)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={leadScore}
                onChangeText={setLeadScore}
              />
            </View>
            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancel} onPress={() => setCreateLeadOpen(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.modalSubmit} onPress={handleCreateLead}>
                <Text style={styles.modalSubmitText}>Guardar Lead</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Create Opportunity */}
      <Modal visible={createOppOpen} animationType="fade" transparent onRequestClose={() => setCreateOppOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Oportunidad</Text>
              <Pressable onPress={() => setCreateOppOpen(false)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre de la Oportunidad *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej. Contrato anual de servicios..."
                placeholderTextColor="#94a3b8"
                value={oppName}
                onChangeText={setOppName}
              />
              <Text style={styles.inputLabel}>Importe (€)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                value={oppAmount}
                onChangeText={setOppAmount}
              />
              <Text style={styles.inputLabel}>Etapa inicial</Text>
              <View style={styles.stagePillsRow}>
                {(["prospecting", "qualified", "proposal", "negotiation"] as const).map((stage) => (
                  <Pressable
                    key={stage}
                    style={[styles.stagePill, oppStage === stage && styles.stagePillActive]}
                    onPress={() => setOppStage(stage)}
                  >
                    <Text style={[styles.stagePillText, oppStage === stage && styles.stagePillTextActive]}>
                      {stage}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancel} onPress={() => setCreateOppOpen(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.modalSubmit} onPress={handleCreateOpp}>
                <Text style={styles.modalSubmitText}>Guardar Oportunidad</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  tabStrip: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 10,
  },
  tabButtonActive: {
    backgroundColor: "#135bec",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  tabButtonTextActive: {
    color: "#ffffff",
  },
  contentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addButtonText: {
    color: "#135bec",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  itemsList: {
    gap: 10,
  },
  leadCard: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  leadTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  leadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  oppAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#15803d",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  badgeDanger: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  badgeInfo: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  badgeTextSuccess: { color: "#15803d" },
  badgeTextDanger: { color: "#b91c1c" },
  badgeTextInfo: { color: "#1d4ed8" },
  metadataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    gap: 10,
  },
  metaCol: {
    width: "45%",
  },
  metaLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  metaVal: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 1,
  },
  nextActivityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  nextActivityText: {
    fontSize: 11,
    color: "#64748b",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalBody: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginTop: 4,
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0f172a",
  },
  stagePillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  stagePill: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stagePillActive: {
    backgroundColor: "#135bec",
  },
  stagePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "capitalize",
  },
  stagePillTextActive: {
    color: "#ffffff",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
  modalCancel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  modalSubmit: {
    backgroundColor: "#135bec",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
});
