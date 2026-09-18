import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  RotateCcw,
  Sparkles,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react-native";
import { mobileCrmAdapter, type CRMOpportunity } from "../adapters/crm";
import { mobileContactAdapter } from "../adapters/contact";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";
import { type PipelineStageId } from "../../../packages/contracts/src/pipeline-capability";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobileCard,
  MobileStepper,
  MobileProgressBar,
  MobileMetricGrid,
  MobileSpeedDialBar,
  MobilePageTabs,
  MobileButton,
  MobileConfirmDialog,
  MobileLoadingState,
  MobileEmptyState,
  MobileStatusBadge,
  MobileBackLink,
} from "./ui";
import { useT } from "../i18n";

interface Props {
  opportunityId: string;
  onBack: () => void;
  onNavigateToContact?: (contactId: string) => void;
}

const STAGES: Array<{ key: PipelineStageId; label: string; step: number; prob: number }> = [
  { key: "prospecting", label: "Prospección", step: 1, prob: 15 },
  { key: "qualified", label: "Cualificado", step: 2, prob: 40 },
  { key: "proposal", label: "Propuesta", step: 3, prob: 65 },
  { key: "negotiation", label: "Negociación", step: 4, prob: 80 },
  { key: "won", label: "Ganada", step: 5, prob: 100 },
];

const STAGE_LABELS: Record<PipelineStageId, string> = {
  prospecting: "Prospección",
  qualified: "Cualificado",
  proposal: "Propuesta",
  negotiation: "Negociación",
  won: "Ganada",
  lost: "Perdida",
};

export function MobileOpportunityDetailScreen({
  opportunityId,
  onBack,
  onNavigateToContact,
}: Props) {
  const t = useT();
  const [opportunity, setOpportunity] = useState<CRMOpportunity | null>(null);
  const [contact, setContact] = useState<ContactRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("summary");

  // Reopen modal
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  // Notes state
  const [notes, setNotes] = useState<Array<{ id: string; text: string; date: string }>>([
    { id: "1", text: "Reunión de alineación comercial realizada. Cliente confirma interés.", date: "Hoy, 11:00" },
  ]);
  const [newNoteText, setNewNoteText] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const opp = await mobileCrmAdapter.getOpportunity(opportunityId);
      if (opp) {
        setOpportunity(opp);
        if (opp.contactId) {
          try {
            const found = await mobileContactAdapter.getCustomer360(opp.contactId);
            if (found?.summary) setContact(found.summary);
          } catch {
            // noop
          }
        }
      }
    } catch (err) {
      console.error("Error loading opportunity:", err);
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentStep = useMemo(() => {
    if (!opportunity) return 1;
    if (opportunity.stageKey === "lost") return 6;
    const found = STAGES.find((s) => s.key === opportunity.stageKey);
    return found ? found.step : 1;
  }, [opportunity]);

  const handleStageClick = async (targetKey: PipelineStageId) => {
    if (!opportunity) return;
    if (opportunity.stageKey === targetKey) return;

    if (opportunity.stageKey === "won" || opportunity.stageKey === "lost") {
      setReopenModalOpen(true);
      return;
    }

    try {
      const updated = await mobileCrmAdapter.moveOpportunityStage(opportunity.id, targetKey);
      setOpportunity(updated);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo actualizar la etapa");
    }
  };

  const handleReopenSubmit = async () => {
    if (!opportunity || !reopenReason.trim()) {
      Alert.alert("Motivo requerido", "Por favor indica la justificación para reabrir este deal.");
      return;
    }

    try {
      const updated = await mobileCrmAdapter.reopenOpportunity(opportunity.id, reopenReason);
      setOpportunity(updated);
      setReopenModalOpen(false);
      setReopenReason("");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo reabrir el deal");
    }
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const item = {
      id: String(Date.now()),
      text: newNoteText.trim(),
      date: "Ahora mismo",
    };
    setNotes([item, ...notes]);
    setNewNoteText("");
  };

  const openPhone = (phone?: string) => {
    if (!phone) {
      Alert.alert("Sin teléfono", "El contacto no tiene teléfono asignado.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) {
      Alert.alert("Sin teléfono", "El contacto no tiene teléfono asignado.");
      return;
    }
    const cleanNumber = phone.replace(/[^\d+]/g, "");
    Linking.openURL(`https://wa.me/${cleanNumber}`);
  };

  const openEmail = (email?: string) => {
    if (!email) {
      Alert.alert("Sin email", "El contacto no tiene correo asignado.");
      return;
    }
    Linking.openURL(`mailto:${email}`);
  };

  const formatCurrency = (amt: number | null, curr: string = "USD") => {
    if (amt === null || amt === undefined) return "$0";
    return `$${amt.toLocaleString("en-US")} ${curr}`;
  };

  if (loading) {
    return (
      <MobilePageContainer>
        <MobileBackLink label={t("crm.pipeline.back", "Volver al pipeline")} onPress={onBack} />
        <MobileLoadingState message="Cargando detalle del deal..." />
      </MobilePageContainer>
    );
  }

  if (!opportunity) {
    return (
      <MobilePageContainer>
        <MobileBackLink label={t("crm.pipeline.back", "Volver al pipeline")} onPress={onBack} />
        <MobileEmptyState
          title="Oportunidad no encontrada"
          description="No pudimos encontrar los datos de este deal comercial."
          actionLabel="Volver al Pipeline"
          onAction={onBack}
        />
      </MobilePageContainer>
    );
  }

  const probPct =
    opportunity.probability !== undefined
      ? Math.round(opportunity.probability * 100)
      : opportunity.stageKey === "won"
      ? 100
      : opportunity.stageKey === "lost"
      ? 0
      : 50;
  const weightedValue = Math.round((opportunity.amount || 0) * (probPct / 100));

  const stepperSteps = STAGES.map((s) => ({
    key: s.key,
    label: s.label,
    stepNumber: s.step,
  }));

  const detailTabs = [
    { id: "summary", label: "Resumen Comercial" },
    { id: "contact", label: "Contacto 360" },
    { id: "notes", label: "Notas", count: notes.length },
  ];

  return (
    <MobilePageContainer>
      {/* Canonical Back Link */}
      <MobileBackLink label={t("crm.pipeline.back", "Volver al pipeline")} onPress={onBack} />

      {/* Opportunity Hero Header Card */}
      <MobileCard style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {opportunity.name}
            </Text>
            <Text style={styles.heroSubtitle} numberOfLines={1}>
              {`${contact ? `${contact.givenName} ${contact.familyName}` : "Contacto B2B"} · ${
                contact?.organizationName || "Empresa"
              }`}
            </Text>
          </View>
          <MobileStatusBadge
            status={
              opportunity.stageKey === "won"
                ? "success"
                : opportunity.stageKey === "lost"
                ? "destructive"
                : opportunity.stageKey === "negotiation"
                ? "warning"
                : "info"
            }
            label={STAGE_LABELS[opportunity.stageKey] || opportunity.stageKey}
            size="sm"
          />
        </View>
      </MobileCard>
        {/* Stepper Card */}
        <MobileCard style={styles.cardSpacing}>
          <View style={styles.stepperHeader}>
            <Text style={styles.sectionHeading}>ETAPA COMERCIAL</Text>
            <Text style={styles.probBadgeText}>{probPct}% PROBABILIDAD</Text>
          </View>
          <MobileStepper
            steps={stepperSteps}
            currentStep={opportunity.stageKey}
            onStepSelect={(key) => handleStageClick(key as PipelineStageId)}
          />

          {/* Lost Stage Quick Option */}
          <View style={styles.lostRow}>
            <MobileButton
              variant={opportunity.stageKey === "lost" ? "destructive" : "outline"}
              size="sm"
              icon={XCircle}
              label={opportunity.stageKey === "lost" ? "Deal Perdido" : "Marcar como Perdida"}
              onPress={() => handleStageClick("lost")}
              minHeight={44}
            />
          </View>
        </MobileCard>

        {/* Commercial KPIs Grid */}
        <View style={styles.metricsWrapper}>
          <MobileMetricGrid
            columns={2}
            metrics={[
              {
                id: "amount",
                label: "Valor Total",
                value: formatCurrency(opportunity.amount, opportunity.currency),
                subtext: "USD nominal",
                status: "info",
                icon: DollarSign,
              },
              {
                id: "weighted",
                label: "Forecast Ponderado",
                value: formatCurrency(weightedValue, opportunity.currency),
                subtext: `${probPct}% ponderado`,
                status: "success",
                icon: Sparkles,
              },
            ]}
          />
        </View>

        {/* Direct Communication Bar */}
        <MobileCard style={styles.cardSpacing}>
          <Text style={styles.sectionHeading}>ACCIONES DIRECTAS CON EL CLIENTE</Text>
          <View style={styles.actionsRow}>
            <MobileSpeedDialBar
              phone={contact?.phone}
              email={contact?.email}
              onCall={() => openPhone(contact?.phone)}
              onWhatsApp={() => openWhatsApp(contact?.phone)}
              onEmail={() => openEmail(contact?.email)}
            />
            {contact && onNavigateToContact && (
              <MobileButton
                variant="secondary"
                size="sm"
                icon={ExternalLink}
                onPress={() => onNavigateToContact(contact.id)}
                minHeight={44}
              >
                Ver 360
              </MobileButton>
            )}
          </View>
        </MobileCard>

        {/* Canonical Horizontal Tabs (NO PILLS) */}
        <MobilePageTabs
          tabs={detailTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* TAB CONTENT */}
        <View style={styles.tabContentContainer}>
          {activeTab === "summary" && (
            <MobileCard style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>DETALLES DEL ACUERDO</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Origen:</Text>
                <Text style={styles.infoValue}>
                  {opportunity.origin === "lead_conversion" ? "Conversión de Lead SQL" : "Creación Manual"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Responsable:</Text>
                <Text style={styles.infoValue}>{opportunity.ownerName || "Maya Chen"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha Cierre Estimada:</Text>
                <Text style={styles.infoValue}>
                  {opportunity.expectedCloseAt
                    ? new Date(opportunity.expectedCloseAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "No definida"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID Oportunidad:</Text>
                <Text style={[styles.infoValue, styles.monospace]}>{opportunity.id}</Text>
              </View>

              {opportunity.lossReason && (
                <View style={styles.lossNotice}>
                  <Text style={styles.lossTitle}>Motivo de pérdida:</Text>
                  <Text style={styles.lossDesc}>{opportunity.lossReason}</Text>
                </View>
              )}
            </MobileCard>
          )}

          {activeTab === "contact" && (
            <MobileCard style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>CONTACTO PRINCIPAL</Text>
              {contact ? (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nombre:</Text>
                    <Text style={styles.infoValue}>
                      {contact.givenName} {contact.familyName}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Empresa:</Text>
                    <Text style={styles.infoValue}>{contact.organizationName || "No indicada"}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{contact.email || "No registrado"}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Teléfono:</Text>
                    <Text style={styles.infoValue}>{contact.phone || "No registrado"}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>País:</Text>
                    <Text style={styles.infoValue}>{contact.country || "España"}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.noContactText}>No hay contacto asignado a esta oportunidad.</Text>
              )}
            </MobileCard>
          )}

          {activeTab === "notes" && (
            <View style={styles.notesContainer}>
              <MobileCard style={styles.newNoteCard}>
                <Text style={styles.detailCardTitle}>AÑADIR NOTA COMERCIAL</Text>
                <TextInput
                  placeholder="Escribe un apunte sobre esta negociación..."
                  placeholderTextColor="#94a3b8"
                  value={newNoteText}
                  onChangeText={setNewNoteText}
                  multiline
                  numberOfLines={3}
                  style={styles.noteInput}
                />
                <View style={styles.noteBtnWrap}>
                  <MobileButton
                    variant="primary"
                    size="sm"
                    onPress={handleAddNote}
                    minHeight={44}
                  >
                    Guardar Nota
                  </MobileButton>
                </View>
              </MobileCard>

              {notes.map((n) => (
                <MobileCard key={n.id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteAuthor}>Nota Interna</Text>
                    <Text style={styles.noteDate}>{n.date}</Text>
                  </View>
                  <Text style={styles.noteBody}>{n.text}</Text>
                </MobileCard>
              ))}
            </View>
          )}
        </View>

      {/* Reopen Dialog */}
      <MobileConfirmDialog
        visible={reopenModalOpen}
        title="Reabrir Oportunidad Cerrada"
        message={`Este deal está cerrado como "${opportunity.stageKey}". Ingresa un motivo para reabrirlo:`}
        confirmLabel="Confirmar Reapertura"
        cancelLabel="Cancelar"
        onConfirm={handleReopenSubmit}
        onCancel={() => {
          setReopenModalOpen(false);
          setReopenReason("");
        }}
      >
        <TextInput
          placeholder="Ej. El cliente solicita una nueva cotización..."
          placeholderTextColor="#94a3b8"
          value={reopenReason}
          onChangeText={setReopenReason}
          multiline
          numberOfLines={3}
          style={styles.reopenTextInput}
        />
      </MobileConfirmDialog>
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: 16,
    marginBottom: 8,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#64748b",
  },
  cardSpacing: {
    marginTop: 12,
    padding: 16,
  },
  metricsWrapper: {
    marginTop: 12,
  },
  stepperHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.8,
  },
  probBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#135bec",
  },
  lostRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
    alignItems: "flex-end",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  tabContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  detailCard: {
    padding: 16,
  },
  detailCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  monospace: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#64748b",
  },
  lossNotice: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  lossTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#b91c1c",
    marginBottom: 2,
  },
  lossDesc: {
    fontSize: 13,
    color: "#7f1d1d",
  },
  noContactText: {
    fontSize: 13,
    color: "#94a3b8",
    fontStyle: "italic",
    paddingVertical: 8,
  },
  notesContainer: {
    gap: 12,
  },
  newNoteCard: {
    padding: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: "#0f172a",
    minHeight: 70,
    textAlignVertical: "top",
  },
  noteBtnWrap: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  noteCard: {
    padding: 14,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  noteDate: {
    fontSize: 11,
    color: "#94a3b8",
  },
  noteBody: {
    fontSize: 13,
    color: "#1e293b",
    lineHeight: 18,
  },
  reopenTextInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: "#0f172a",
    marginTop: 12,
    minHeight: 70,
    textAlignVertical: "top",
  },
});
