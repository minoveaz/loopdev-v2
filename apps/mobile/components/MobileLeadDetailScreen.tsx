import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Flame,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Send,
  Target,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react-native";
import { mobileCrmAdapter, type CRMLead, type CRMOpportunity } from "../adapters/crm";
import { mobileContactAdapter } from "../adapters/contact";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";
import { useT } from "../i18n";
import {
  MobilePageContainer,
  MobileCard,
  MobileButton,
  MobileStatusBadge,
  MobileAvatar,
  MobileStepper,
  MobilePageTabs,
  MobileProgressBar,
  MobileMetricGrid,
  MobileSpeedDialBar,
  MobileBottomSheet,
  MobileInput,
  MobileTextArea,
  MobileBackLink,
  MobileEmptyState,
  MobileLoadingState,
  MobileConfirmDialog,
} from "./ui";
import { mobileTheme } from "../theme/tokens";

interface Props {
  leadId: string;
  onBack: () => void;
  onNavigateToContact: (contactId: string) => void;
  onArchive?: (lead: CRMLead) => Promise<void>;
}

const STAGES: Array<{ key: CRMLead["status"]; label: string }> = [
  { key: "new", label: "Nuevo" },
  { key: "contacted", label: "Contactado" },
  { key: "qualified", label: "Calificado" },
  { key: "converted", label: "Convertido" },
];

type DetailTab = "bant" | "contact" | "notes";

export function MobileLeadDetailScreen({
  leadId,
  onBack,
  onNavigateToContact,
  onArchive,
}: Props) {
  const t = useT();
  const [lead, setLead] = useState<CRMLead | null>(null);
  const [contact, setContact] = useState<ContactRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("bant");

  // Conversion Modal State
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [dealName, setDealName] = useState("");
  const [dealAmount, setDealAmount] = useState("");
  const [dealStage, setDealStage] = useState<CRMOpportunity["stageKey"]>("qualified");
  const [converting, setConverting] = useState(false);

  // Quick Edit & BANT Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editInterest, setEditInterest] = useState("");
  const [editNeed, setEditNeed] = useState("");
  const [editTimeline, setEditTimeline] = useState("");
  const [editValue, setEditValue] = useState("");

  // Notes State
  const [notesList, setNotesList] = useState<Array<{ id: string; text: string; date: string }>>([
    { id: "1", text: "Primer contacto realizado. Muestra interés en migración cloud.", date: "Hoy, 10:30" },
  ]);
  const [newNoteText, setNewNoteText] = useState("");

  const loadLead = async () => {
    setLoading(true);
    try {
      const item = await mobileCrmAdapter.getLead(leadId);
      if (item) {
        setLead(item);
        setDealName(`Oportunidad · ${item.interest || "Expansión Comercial"}`);
        setDealAmount(item.estimatedValue ? String(item.estimatedValue) : "35000");
        setEditInterest(item.interest || "");
        setEditNeed(item.qualificationNeed || "");
        setEditTimeline(item.qualificationTimeline || "");
        setEditValue(item.estimatedValue ? String(item.estimatedValue) : "");

        if (item.contactId) {
          try {
            const found = await mobileContactAdapter.getCustomer360(item.contactId);
            if (found?.contact) setContact(found.contact);
          } catch {
            // fallback
          }
        }
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLead();
  }, [leadId]);

  const handleStageChange = async (nextStage: CRMLead["status"]) => {
    if (!lead) return;
    try {
      const updated = await mobileCrmAdapter.updateLead(lead.id, { status: nextStage });
      setLead(updated);
    } catch {
      Alert.alert(t("common.error"), t("crm.leads.updateError"));
    }
  };

  const handleConvert = async () => {
    if (!lead) return;
    setConverting(true);
    try {
      const { lead: updatedLead } = await mobileCrmAdapter.convertLeadToOpportunity(lead.id, {
        name: dealName.trim() || `Oportunidad · ${lead.interest}`,
        amount: dealAmount ? Number(dealAmount) : (lead.estimatedValue ?? 25000),
        currency: lead.estimatedCurrency || "EUR",
        stageKey: dealStage,
      });
      setLead(updatedLead);
      setConvertModalOpen(false);
      Alert.alert(t("crm.leads.convertSuccessTitle"), t("crm.leads.convertSuccessDesc"));
    } catch {
      Alert.alert(t("common.error"), t("crm.leads.convertError"));
    } finally {
      setConverting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!lead) return;
    try {
      const updated = await mobileCrmAdapter.updateLead(lead.id, {
        interest: editInterest.trim() || lead.interest,
        qualificationNeed: editNeed.trim() || null,
        qualificationTimeline: editTimeline.trim() || null,
        estimatedValue: editValue.trim() ? Number(editValue) : null,
      });
      setLead(updated);
      setEditModalOpen(false);
    } catch {
      Alert.alert(t("common.error"), t("crm.leads.updateError"));
    }
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const item = {
      id: String(Date.now()),
      text: newNoteText.trim(),
      date: "Ahora",
    };
    setNotesList([item, ...notesList]);
    setNewNoteText("");
  };

  const bantMetrics = useMemo(() => {
    if (!lead) return { score: 0, budget: false, authority: false, need: false, timeline: false };
    const budget = Boolean(lead.estimatedValue && lead.estimatedValue > 0);
    const authority = Boolean(contact?.jobTitle || contact?.companyName);
    const need = Boolean(lead.qualificationNeed || lead.interest);
    const timeline = Boolean(lead.qualificationTimeline);

    let count = 0;
    if (budget) count += 25;
    if (authority) count += 25;
    if (need) count += 25;
    if (timeline) count += 25;

    return { score: count, budget, authority, need, timeline };
  }, [lead, contact]);

  if (loading || !lead) {
    return (
      <MobilePageContainer>
        <MobileBackLink label={t("crm.leads.back", "Volver a leads")} onPress={onBack} />
        <MobileLoadingState message="Cargando ficha de lead..." />
      </MobilePageContainer>
    );
  }

  const contactDisplayName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(" ")
    : lead.ownerName || "Prospecto Lead";

  const score = lead.score ?? 50;
  const isHot = score >= 75;
  const isWarm = score >= 50 && score < 75;

  const detailTabs = [
    { id: "bant", label: "Cualificación BANT" },
    { id: "contact", label: "Contacto 360" },
    { id: "notes", label: "Notas", count: notesList.length },
  ];

  const conversionStageTabs = [
    { id: "prospecting", label: "Prospección" },
    { id: "qualified", label: "Cualificado" },
    { id: "proposal", label: "Propuesta" },
    { id: "negotiation", label: "Negociación" },
  ];

  return (
    <MobilePageContainer>
      {/* Top Header Row with Canonical Back Link and Edit Action */}
      <View style={styles.topBackRow}>
        <MobileBackLink label={t("crm.leads.back", "Volver a leads")} onPress={onBack} />
        <MobileButton
          variant="outline"
          size="sm"
          label="Editar"
          icon={<Pencil size={13} color={mobileTheme.colors.primary} />}
          onPress={() => setEditModalOpen(true)}
        />
        {onArchive ? <MobileButton
          variant="outline"
          size="sm"
          label={t("crm.leads.archive")}
          onPress={() => Alert.alert("Archivar lead", "El lead dejará de aparecer en los listados activos.", [{ text: "Cancelar", style: "cancel" }, { text: "Archivar", style: "destructive", onPress: () => void onArchive(lead) }])}
        /> : null}
      </View>

      {/* Lead Hero Card */}
      <MobileCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <MobileAvatar name={contactDisplayName} size="lg" />
          <View style={styles.heroCopy}>
            <View style={styles.nameRow}>
              <Text style={styles.heroName} numberOfLines={1}>
                {contactDisplayName}
              </Text>
              {isHot ? (
                <View style={styles.heatBadgeHot}>
                  <Flame size={11} color="#ea580c" />
                  <Text style={styles.heatBadgeTextHot}>Hot · {score}</Text>
                </View>
              ) : isWarm ? (
                <View style={styles.heatBadgeWarm}>
                  <Zap size={11} color="#0284c7" />
                  <Text style={styles.heatBadgeTextWarm}>Warm · {score}</Text>
                </View>
              ) : (
                <View style={styles.heatBadgeNeutral}>
                  <Text style={styles.heatBadgeTextNeutral}>{score} pts</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroCompany} numberOfLines={1}>
              {[contact?.jobTitle, contact?.companyName].filter(Boolean).join(" · ") ||
                "Empresa / Cargo no especificado"}
            </Text>
            <Text style={styles.heroOwner}>
              Propietario: <Text style={styles.heroOwnerBold}>{lead.ownerName || "Sin asignar"}</Text>
            </Text>
          </View>
        </View>

        {/* 1-Tap Speed Dial Bar */}
        <View style={styles.dialBarWrapper}>
          <MobileSpeedDialBar
            phone={contact?.phone || undefined}
            email={contact?.email || undefined}
            whatsapp={contact?.phone || undefined}
            contactName={contactDisplayName}
          />
        </View>
      </MobileCard>

      {/* Canonical Interactive Qualification Stepper (NO pills) */}
      <MobileCard style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>FASE DE MADURACIÓN</Text>
        <MobileStepper
          steps={STAGES}
          activeKey={lead.status}
          onSelectStep={(key) => handleStageChange(key as CRMLead["status"])}
        />
      </MobileCard>

      {/* Canonical Horizontal Page Tabs (NO pills) */}
      <View style={styles.tabsWrapper}>
        <MobilePageTabs
          tabs={detailTabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as DetailTab)}
        />
      </View>

      {/* Tab 1: BANT Qualification */}
      {activeTab === "bant" && (
        <MobileCard style={styles.sectionCard}>
          <View style={styles.bantHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>MADUREZ COMERCIAL</Text>
              <Text style={styles.bantScoreSubtitle}>{bantMetrics.score}% Calificado</Text>
            </View>
            <MobileButton
              variant="outline"
              size="sm"
              label="Editar BANT"
              icon={<Pencil size={12} color={mobileTheme.colors.primary} />}
              onPress={() => setEditModalOpen(true)}
            />
          </View>

          <View style={styles.progressWrapper}>
            <MobileProgressBar
              progress={bantMetrics.score / 100}
              tone={bantMetrics.score >= 75 ? "success" : bantMetrics.score >= 50 ? "info" : "warning"}
              showPercentage
            />
          </View>

          {/* BANT 4 Criteria Items */}
          <View style={styles.criteriaGrid}>
            <View style={styles.criteriaItem}>
              <View style={styles.criteriaItemHead}>
                <Text style={styles.criteriaLabel}>B · BUDGET</Text>
                <MobileStatusBadge
                  tone={bantMetrics.budget ? "success" : "warning"}
                  label={bantMetrics.budget ? "Listo" : "Pendiente"}
                  dot
                />
              </View>
              <Text style={styles.criteriaValueHighlight}>
                {lead.estimatedValue != null
                  ? `$${lead.estimatedValue.toLocaleString()} ${lead.estimatedCurrency || "USD"}`
                  : "Sin estimar"}
              </Text>
            </View>

            <View style={styles.criteriaItem}>
              <View style={styles.criteriaItemHead}>
                <Text style={styles.criteriaLabel}>A · AUTHORITY</Text>
                <MobileStatusBadge
                  tone={bantMetrics.authority ? "success" : "warning"}
                  label={bantMetrics.authority ? "Listo" : "Pendiente"}
                  dot
                />
              </View>
              <Text style={styles.criteriaValue} numberOfLines={1}>
                {contact?.jobTitle || "Decisor"}
              </Text>
              <Text style={styles.criteriaSubtext} numberOfLines={1}>
                {contact?.companyName || "Empresa"}
              </Text>
            </View>

            <View style={styles.criteriaItemFull}>
              <View style={styles.criteriaItemHead}>
                <Text style={styles.criteriaLabel}>N · NEED (NECESIDAD)</Text>
                <MobileStatusBadge
                  tone={bantMetrics.need ? "success" : "warning"}
                  label={bantMetrics.need ? "Lista" : "Pendiente"}
                  dot
                />
              </View>
              <Text style={styles.criteriaValue}>
                {lead.qualificationNeed || lead.interest || "Sin requerimientos documentados aún."}
              </Text>
            </View>

            <View style={styles.criteriaItemFull}>
              <View style={styles.criteriaItemHead}>
                <Text style={styles.criteriaLabel}>T · TIMELINE (PLAZO)</Text>
                <MobileStatusBadge
                  tone={bantMetrics.timeline ? "success" : "warning"}
                  label={bantMetrics.timeline ? "Listo" : "Pendiente"}
                  dot
                />
              </View>
              <Text style={styles.criteriaValue}>
                {lead.qualificationTimeline || "Sin fecha objetivo de cierre"}
              </Text>
            </View>
          </View>
        </MobileCard>
      )}

      {/* Tab 2: Contact 360 Link */}
      {activeTab === "contact" && (
        <MobileCard style={styles.sectionCard}>
          <View style={styles.contactCardHeader}>
            <Text style={styles.sectionHeading}>DATOS DEL CONTACTO</Text>
            {contact && (
              <MobileButton
                variant="ghost"
                size="sm"
                label="Ver 360"
                icon={<ExternalLink size={13} color={mobileTheme.colors.primary} />}
                onPress={() => onNavigateToContact(contact.id)}
              />
            )}
          </View>

          {contact ? (
            <View style={styles.contactDataRows}>
              <View style={styles.contactDataRow}>
                <User size={15} color="#64748b" />
                <Text style={styles.contactDataText}>
                  {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                </Text>
              </View>
              {contact.companyName && (
                <View style={styles.contactDataRow}>
                  <Building2 size={15} color="#64748b" />
                  <Text style={styles.contactDataText}>{contact.companyName}</Text>
                </View>
              )}
              {contact.email && (
                <View style={styles.contactDataRow}>
                  <Mail size={15} color="#64748b" />
                  <Text style={styles.contactDataText}>{contact.email}</Text>
                </View>
              )}
              {contact.phone && (
                <View style={styles.contactDataRow}>
                  <Phone size={15} color="#64748b" />
                  <Text style={styles.contactDataText}>{contact.phone}</Text>
                </View>
              )}
              {(contact.city || contact.country) && (
                <View style={styles.contactDataRow}>
                  <MapPin size={15} color="#64748b" />
                  <Text style={styles.contactDataText}>
                    {[contact.city, contact.country].filter(Boolean).join(", ")}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <MobileEmptyState
              icon={<Users size={28} color={mobileTheme.colors.textSubtle} />}
              title="Sin contacto vinculado"
              description="Este lead aún no tiene un registro de contacto enlazado."
            />
          )}
        </MobileCard>
      )}

      {/* Tab 3: Notes List */}
      {activeTab === "notes" && (
        <MobileCard style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>NOTAS Y COMPROMISOS</Text>

          {/* Quick Note Input */}
          <View style={styles.quickNoteBox}>
            <MobileTextArea
              value={newNoteText}
              onChangeText={setNewNoteText}
              placeholder="Escribe una nota rápida o compromiso..."
              rows={2}
            />
            <View style={{ alignItems: "flex-end", marginTop: 6 }}>
              <MobileButton
                variant="primary"
                size="sm"
                label="Guardar nota"
                icon={<Send size={13} color="#ffffff" />}
                disabled={!newNoteText.trim()}
                onPress={handleAddNote}
              />
            </View>
          </View>

          {/* Notes List */}
          <View style={styles.notesList}>
            {notesList.map((item) => (
              <View key={item.id} style={styles.noteItem}>
                <View style={styles.noteDateRow}>
                  <Clock size={12} color="#94a3b8" />
                  <Text style={styles.noteDate}>{item.date}</Text>
                </View>
                <Text style={styles.noteText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </MobileCard>
      )}

      {/* Bottom Conversion Action Card */}
      <View style={styles.bottomBar}>
        {lead.status !== "converted" ? (
          <MobileButton
            variant="primary"
            size="lg"
            label="Convertir a Oportunidad"
            icon={<TrendingUp size={16} color="#ffffff" />}
            onPress={() => setConvertModalOpen(true)}
            style={{ width: "100%" }}
          />
        ) : (
          <View style={styles.convertedBanner}>
            <CheckCircle2 size={18} color="#15803d" />
            <Text style={styles.convertedBannerText}>Lead Convertido en Pipeline Comercial</Text>
          </View>
        )}
      </View>

      {/* Convert to Opportunity Bottom Sheet */}
      <MobileBottomSheet
        visible={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title="Convertir a Oportunidad"
        footer={
          <MobileButton
            variant="primary"
            label={converting ? "Creando Oportunidad..." : "Confirmar Conversión"}
            loading={converting}
            icon={<TrendingUp size={16} color="#ffffff" />}
            onPress={handleConvert}
            style={{ width: "100%" }}
          />
        }
      >
        <MobileInput
          label="Título de la Oportunidad"
          value={dealName}
          onChangeText={setDealName}
          placeholder="ej. Oportunidad Cloud Enterprise"
        />

        <MobileInput
          label="Importe Estimado (€ / $)"
          value={dealAmount}
          onChangeText={setDealAmount}
          keyboardType="numeric"
          placeholder="35000"
        />

        <Text style={styles.sectionLabel}>Fase Inicial en Pipeline</Text>
        <View style={styles.tabsWrapper}>
          <MobilePageTabs
            tabs={conversionStageTabs}
            activeTab={dealStage}
            onTabChange={(id) => setDealStage(id as CRMOpportunity["stageKey"])}
          />
        </View>
      </MobileBottomSheet>

      {/* Quick Edit Modal */}
      <MobileBottomSheet
        visible={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar Ficha de Lead"
        footer={
          <MobileButton
            variant="primary"
            label="Guardar Cambios"
            onPress={handleSaveEdit}
            style={{ width: "100%" }}
          />
        }
      >
        <MobileInput
          label="Interés Principal"
          value={editInterest}
          onChangeText={setEditInterest}
        />

        <MobileTextArea
          label="Necesidad (Need)"
          value={editNeed}
          onChangeText={setEditNeed}
          rows={3}
        />

        <MobileInput
          label="Plazo Estimado (Timeline)"
          value={editTimeline}
          onChangeText={setEditTimeline}
        />

        <MobileInput
          label="Valor Estimado"
          value={editValue}
          onChangeText={setEditValue}
          keyboardType="numeric"
        />
      </MobileBottomSheet>
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  topBackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
  },
  backButtonText: {
    color: mobileTheme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: mobileTheme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: mobileTheme.colors.textSecondary,
  },
  heroCard: {
    padding: 16,
    marginBottom: 12,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroCopy: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroName: {
    fontSize: 17,
    fontWeight: "800",
    color: mobileTheme.colors.textPrimary,
  },
  heatBadgeHot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  heatBadgeTextHot: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ea580c",
  },
  heatBadgeWarm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  heatBadgeTextWarm: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0284c7",
  },
  heatBadgeNeutral: {
    backgroundColor: "#f1f5f9",
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  heatBadgeTextNeutral: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  heroCompany: {
    fontSize: 13,
    color: mobileTheme.colors.textSecondary,
    marginTop: 2,
  },
  heroOwner: {
    fontSize: 12,
    color: mobileTheme.colors.textSecondary,
    marginTop: 4,
  },
  heroOwnerBold: {
    fontWeight: "700",
    color: mobileTheme.colors.textPrimary,
  },
  dialBarWrapper: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: mobileTheme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  tabsWrapper: {
    marginBottom: 12,
  },
  bantHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  bantScoreSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  progressWrapper: {
    marginBottom: 16,
  },
  criteriaGrid: {
    gap: 10,
  },
  criteriaItem: {
    backgroundColor: mobileTheme.colors.background,
    borderColor: mobileTheme.colors.borderLight,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.input,
    padding: 12,
  },
  criteriaItemFull: {
    backgroundColor: mobileTheme.colors.background,
    borderColor: mobileTheme.colors.borderLight,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.input,
    padding: 12,
  },
  criteriaItemHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  criteriaLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: mobileTheme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  criteriaValueHighlight: {
    fontSize: 15,
    fontWeight: "800",
    color: mobileTheme.colors.textPrimary,
  },
  criteriaValue: {
    fontSize: 14,
    fontWeight: "600",
    color: mobileTheme.colors.textPrimary,
    lineHeight: 20,
  },
  criteriaSubtext: {
    fontSize: 12,
    color: mobileTheme.colors.textSecondary,
    marginTop: 2,
  },
  contactCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  contactDataRows: {
    gap: 10,
  },
  contactDataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactDataText: {
    fontSize: 14,
    color: mobileTheme.colors.textPrimary,
    fontWeight: "500",
  },
  quickNoteBox: {
    marginBottom: 14,
  },
  notesList: {
    gap: 8,
  },
  noteItem: {
    backgroundColor: mobileTheme.colors.background,
    borderColor: mobileTheme.colors.borderLight,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.input,
    padding: 12,
  },
  noteDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 11,
    color: mobileTheme.colors.textSecondary,
  },
  noteText: {
    fontSize: 13,
    color: mobileTheme.colors.textPrimary,
    lineHeight: 18,
  },
  bottomBar: {
    marginTop: 8,
    marginBottom: 24,
  },
  convertedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 14,
  },
  convertedBannerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#15803d",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.textPrimary,
    marginTop: 10,
    marginBottom: 8,
  },
});
