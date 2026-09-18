import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquarePlus,
  MoveRight,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  User,
  X,
  XCircle,
} from "lucide-react-native";
import { mobileCrmAdapter, type CRMOpportunity } from "../adapters/crm";
import { mobileContactAdapter } from "../adapters/contact";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";
import { pipelineStages, type PipelineStageId } from "../../../packages/contracts/src/pipeline-capability";

interface Props {
  opportunityId: string;
  onBack: () => void;
  onNavigateToContact?: (contactId: string) => void;
}

const STAGES: Array<{ key: PipelineStageId; label: string; step: number; prob: number }> = [
  { key: "prospecting", label: "1. Prospección", step: 1, prob: 15 },
  { key: "qualified", label: "2. Cualificado", step: 2, prob: 40 },
  { key: "proposal", label: "3. Propuesta", step: 3, prob: 65 },
  { key: "negotiation", label: "4. Negociación", step: 4, prob: 80 },
  { key: "won", label: "5. Ganada", step: 5, prob: 100 },
];

const STAGE_COLORS: Record<PipelineStageId, { bg: string; text: string; border: string }> = {
  prospecting: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
  qualified: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  proposal: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  negotiation: { bg: "#fefce8", text: "#a16207", border: "#fde047" },
  won: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  lost: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
};

type DetailTab = "summary" | "contact" | "notes";

export function MobileOpportunityDetailScreen({
  opportunityId,
  onBack,
  onNavigateToContact,
}: Props) {
  const [opportunity, setOpportunity] = useState<CRMOpportunity | null>(null);
  const [contact, setContact] = useState<ContactRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("summary");

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
        // Load contact
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
      <View style={styles.loadingContainer}>
        <RefreshCw size={24} color="#135bec" />
        <Text style={styles.loadingText}>Cargando detalle del deal...</Text>
      </View>
    );
  }

  if (!opportunity) {
    return (
      <View style={styles.loadingContainer}>
        <XCircle size={32} color="#ef4444" />
        <Text style={styles.notFoundText}>Oportunidad no encontrada</Text>
        <Pressable onPress={onBack} style={styles.backHomeBtn}>
          <Text style={styles.backHomeBtnText}>Volver al Pipeline</Text>
        </Pressable>
      </View>
    );
  }

  const stageStyle = STAGE_COLORS[opportunity.stageKey] || STAGE_COLORS.prospecting;
  const isTerminal = opportunity.stageKey === "won" || opportunity.stageKey === "lost";
  const probPct = opportunity.probability !== undefined ? Math.round(opportunity.probability * 100) : (opportunity.stageKey === "won" ? 100 : opportunity.stageKey === "lost" ? 0 : 50);
  const weightedValue = Math.round((opportunity.amount || 0) * (probPct / 100));

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={18} color="#1e293b" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerDealName} numberOfLines={1}>
            {opportunity.name}
          </Text>
          <Text style={styles.headerContactSub}>
            {contact ? `${contact.givenName} ${contact.familyName}` : "Contacto B2B"} · {contact?.organizationName || "Empresa"}
          </Text>
        </View>
        <View
          style={[
            styles.stageBadge,
            { backgroundColor: stageStyle.bg, borderColor: stageStyle.border },
          ]}
        >
          <Text style={[styles.stageBadgeText, { color: stageStyle.text }]}>
            {opportunity.stageKey.toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Horizontal Interactive Stage Stepper */}
        <View style={styles.stepperCard}>
          <View style={styles.stepperHeader}>
            <Text style={styles.stepperTitle}>ETAPA COMERCIAL ACTUAL</Text>
            <Text style={styles.stepperSub}>{probPct}% PROBABILIDAD</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stepperScroll}
          >
            {STAGES.map((s) => {
              const isPast = currentStep > s.step;
              const isCurrent = currentStep === s.step;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => handleStageClick(s.key)}
                  style={[
                    styles.stepPill,
                    isCurrent && styles.stepPillCurrent,
                    isPast && styles.stepPillPast,
                  ]}
                >
                  <View
                    style={[
                      styles.stepCircle,
                      isCurrent && styles.stepCircleCurrent,
                      isPast && styles.stepCirclePast,
                    ]}
                  >
                    {isPast ? (
                      <Check size={12} color="#ffffff" />
                    ) : (
                      <Text
                        style={[
                          styles.stepNum,
                          isCurrent && styles.stepNumCurrent,
                        ]}
                      >
                        {s.step}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCurrent && styles.stepLabelCurrent,
                      isPast && styles.stepLabelPast,
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}

            {/* Lost Option */}
            <Pressable
              onPress={() => handleStageClick("lost")}
              style={[
                styles.stepPill,
                opportunity.stageKey === "lost" && styles.stepPillLost,
              ]}
            >
              <View
                style={[
                  styles.stepCircle,
                  opportunity.stageKey === "lost" && styles.stepCircleLost,
                ]}
              >
                <X size={12} color={opportunity.stageKey === "lost" ? "#ffffff" : "#b91c1c"} />
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  opportunity.stageKey === "lost" && styles.stepLabelLost,
                ]}
              >
                6. Perdida
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Financial Summary Ribbon */}
        <View style={styles.financeCard}>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>VALOR DEL DEAL</Text>
            <Text style={styles.financeAmount}>
              {formatCurrency(opportunity.amount, opportunity.currency)}
            </Text>
          </View>
          <View style={styles.financeDivider} />
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>FORECAST PONDERADO</Text>
            <Text style={[styles.financeAmount, { color: "#15803d" }]}>
              {formatCurrency(weightedValue, opportunity.currency)}
            </Text>
          </View>
        </View>

        {/* 1-Tap Communication Shortcuts */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsLabel}>ACCIONES DIRECTAS CON EL CLIENTE</Text>
          <View style={styles.quickActionsRow}>
            <Pressable
              onPress={() => openPhone(contact?.phone)}
              style={[styles.quickActionBtn, styles.quickCall]}
            >
              <Phone size={16} color="#15803d" />
              <Text style={[styles.quickActionText, { color: "#15803d" }]}>Llamar</Text>
            </Pressable>
            <Pressable
              onPress={() => openWhatsApp(contact?.phone)}
              style={[styles.quickActionBtn, styles.quickWa]}
            >
              <MessageCircle size={16} color="#047857" />
              <Text style={[styles.quickActionText, { color: "#047857" }]}>WhatsApp</Text>
            </Pressable>
            <Pressable
              onPress={() => openEmail(contact?.email)}
              style={[styles.quickActionBtn, styles.quickEmail]}
            >
              <Mail size={16} color="#1d4ed8" />
              <Text style={[styles.quickActionText, { color: "#1d4ed8" }]}>Email</Text>
            </Pressable>
            {contact && onNavigateToContact && (
              <Pressable
                onPress={() => onNavigateToContact(contact.id)}
                style={[styles.quickActionBtn, styles.quick360]}
              >
                <ExternalLink size={16} color="#475569" />
                <Text style={[styles.quickActionText, { color: "#475569" }]}>360</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Segmented Detail Tabs */}
        <View style={styles.tabsHeader}>
          <Pressable
            onPress={() => setActiveTab("summary")}
            style={[styles.tabButton, activeTab === "summary" && styles.tabButtonActive]}
          >
            <TrendingUp size={14} color={activeTab === "summary" ? "#135bec" : "#64748b"} />
            <Text style={[styles.tabButtonText, activeTab === "summary" && styles.tabButtonTextActive]}>
              Resumen Comercial
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("contact")}
            style={[styles.tabButton, activeTab === "contact" && styles.tabButtonActive]}
          >
            <User size={14} color={activeTab === "contact" ? "#135bec" : "#64748b"} />
            <Text style={[styles.tabButtonText, activeTab === "contact" && styles.tabButtonTextActive]}>
              Contacto 360
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("notes")}
            style={[styles.tabButton, activeTab === "notes" && styles.tabButtonActive]}
          >
            <MessageSquarePlus size={14} color={activeTab === "notes" ? "#135bec" : "#64748b"} />
            <Text style={[styles.tabButtonText, activeTab === "notes" && styles.tabButtonTextActive]}>
              Notas ({notes.length})
            </Text>
          </Pressable>
        </View>

        {/* Tab 1: Resumen Comercial */}
        {activeTab === "summary" && (
          <View style={styles.tabSection}>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardHeading}>DETALLES DEL ACUERDO</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoField}>Origen:</Text>
                <Text style={styles.infoValue}>
                  {opportunity.origin === "lead_conversion" ? "Conversión de Lead SQL" : "Creación Manual"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoField}>Responsable:</Text>
                <Text style={styles.infoValue}>{opportunity.ownerName || "Maya Chen"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoField}>Fecha Estimada Cierre:</Text>
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
                <Text style={styles.infoField}>ID Oportunidad:</Text>
                <Text style={[styles.infoValue, styles.monospace]}>{opportunity.id}</Text>
              </View>
            </View>

            {opportunity.lossReason && opportunity.stageKey === "lost" && (
              <View style={styles.lossDetailBox}>
                <Text style={styles.lossDetailTitle}>MOTIVO REGISTRADO DE PÉRDIDA</Text>
                <Text style={styles.lossDetailBody}>{opportunity.lossReason}</Text>
              </View>
            )}

            {isTerminal && (
              <Pressable onPress={() => setReopenModalOpen(true)} style={styles.reopenActionBtn}>
                <RotateCcw size={16} color="#ffffff" />
                <Text style={styles.reopenActionBtnText}>Reabrir este Deal Cerrado</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Tab 2: Contacto 360 */}
        {activeTab === "contact" && (
          <View style={styles.tabSection}>
            {contact ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardHeading}>PERFIL DEL CLIENTE ASIGNADO</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoField}>Nombre Completo:</Text>
                  <Text style={styles.infoValue}>{contact.givenName} {contact.familyName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoField}>Empresa / Cuenta:</Text>
                  <Text style={styles.infoValue}>{contact.organizationName || "No especificada"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoField}>Cargo / Rol:</Text>
                  <Text style={styles.infoValue}>{contact.jobTitle || "Decisor Comercial"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoField}>Teléfono:</Text>
                  <Text style={styles.infoValue}>{contact.phone || "Sin teléfono"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoField}>Email Corporativo:</Text>
                  <Text style={styles.infoValue}>{contact.email || "Sin email"}</Text>
                </View>

                {onNavigateToContact && (
                  <Pressable
                    onPress={() => onNavigateToContact(contact.id)}
                    style={styles.drilldown360Btn}
                  >
                    <Text style={styles.drilldown360BtnText}>Abrir Ficha Completa Customer 360</Text>
                    <ExternalLink size={14} color="#135bec" />
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptySubtitle}>No hay información de contacto asociada.</Text>
              </View>
            )}
          </View>
        )}

        {/* Tab 3: Notas & Actividad */}
        {activeTab === "notes" && (
          <View style={styles.tabSection}>
            {/* Quick Composer */}
            <View style={styles.composerCard}>
              <Text style={styles.composerHeading}>COMPOSITOR RÁPIDO DE NOTAS</Text>
              <TextInput
                placeholder="Escribe una nota interna sobre esta oportunidad..."
                placeholderTextColor="#94a3b8"
                value={newNoteText}
                onChangeText={setNewNoteText}
                multiline
                numberOfLines={3}
                style={styles.composerInput}
              />
              <View style={styles.composerFooter}>
                <Text style={styles.composerHint}>Sincronizada con Platform Notes</Text>
                <Pressable onPress={handleAddNote} style={styles.composerSubmitBtn}>
                  <Send size={14} color="#ffffff" />
                  <Text style={styles.composerSubmitBtnText}>Guardar</Text>
                </Pressable>
              </View>
            </View>

            {/* Notes List */}
            <View style={styles.notesList}>
              {notes.map((n) => (
                <View key={n.id} style={styles.noteCard}>
                  <Text style={styles.noteText}>{n.text}</Text>
                  <Text style={styles.noteDate}>{n.date}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Reopen Modal */}
      <Modal visible={reopenModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <RotateCcw size={18} color="#135bec" />
                <Text style={styles.modalTitle}>Reabrir Deal Cerrado</Text>
              </View>
              <Pressable onPress={() => setReopenModalOpen(false)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Ingresa el motivo comercial por el cual se reactiva esta oportunidad:
            </Text>

            <TextInput
              placeholder="Ej. El cliente reasignó partida presupuestaria para Q4..."
              placeholderTextColor="#94a3b8"
              value={reopenReason}
              onChangeText={setReopenReason}
              multiline
              numberOfLines={3}
              style={styles.reopenTextInput}
            />

            <View style={styles.modalFooter}>
              <Pressable onPress={() => setReopenModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleReopenSubmit} style={styles.confirmReopenBtn}>
                <Text style={styles.confirmReopenBtnText}>Confirmar</Text>
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
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  backHomeBtn: {
    backgroundColor: "#135bec",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  backHomeBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerDealName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  headerContactSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  stepperCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 10,
  },
  stepperHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepperTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
  },
  stepperSub: {
    fontSize: 10,
    fontWeight: "800",
    color: "#135bec",
    letterSpacing: 0.8,
  },
  stepperScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  stepPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  stepPillCurrent: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  stepPillPast: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  stepPillLost: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  stepCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleCurrent: {
    backgroundColor: "#135bec",
  },
  stepCirclePast: {
    backgroundColor: "#16a34a",
  },
  stepCircleLost: {
    backgroundColor: "#ef4444",
  },
  stepNum: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
  },
  stepNumCurrent: {
    color: "#ffffff",
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  stepLabelCurrent: {
    color: "#1d4ed8",
  },
  stepLabelPast: {
    color: "#15803d",
  },
  stepLabelLost: {
    color: "#b91c1c",
  },
  financeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  financeItem: {
    flex: 1,
  },
  financeDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 12,
  },
  financeLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.8,
  },
  financeAmount: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  quickActionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 10,
  },
  quickActionsLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.9,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  quickCall: {
    backgroundColor: "#dcfce7",
  },
  quickWa: {
    backgroundColor: "#d1fae5",
  },
  quickEmail: {
    backgroundColor: "#eff6ff",
  },
  quick360: {
    backgroundColor: "#f1f5f9",
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tabsHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  tabButtonTextActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  tabSection: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 10,
  },
  infoCardHeading: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  infoField: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  monospace: {
    fontFamily: "monospace",
    fontSize: 11,
  },
  lossDetailBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
    gap: 4,
  },
  lossDetailTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#991b1b",
  },
  lossDetailBody: {
    fontSize: 13,
    color: "#b91c1c",
  },
  reopenActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0f172a",
    paddingVertical: 12,
    borderRadius: 10,
  },
  reopenActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  drilldown360Btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 6,
  },
  drilldown360BtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  composerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 10,
  },
  composerHeading: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
  },
  composerInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    textAlignVertical: "top",
  },
  composerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  composerHint: {
    fontSize: 10,
    color: "#94a3b8",
  },
  composerSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#135bec",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  composerSubmitBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  notesList: {
    gap: 10,
  },
  noteCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 4,
  },
  noteText: {
    fontSize: 13,
    color: "#0f172a",
    lineHeight: 18,
  },
  noteDate: {
    fontSize: 10,
    color: "#94a3b8",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptySubtitle: {
    fontSize: 13,
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
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  reopenTextInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: "#0f172a",
    textAlignVertical: "top",
    backgroundColor: "#f8fafc",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  confirmReopenBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#135bec",
  },
  confirmReopenBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
});
