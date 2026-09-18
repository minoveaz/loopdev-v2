import React, { useEffect, useMemo, useState } from "react";
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
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Flame,
  ListTodo,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquarePlus,
  Pencil,
  Phone,
  Plus,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  User,
  UserCheck,
  X,
  Zap,
} from "lucide-react-native";
import { mobileCrmAdapter, type CRMLead, type CRMOpportunity } from "../adapters/crm";
import { mobileContactAdapter } from "../adapters/contact";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";
import { useT } from "../i18n";

interface Props {
  leadId: string;
  onBack: () => void;
  onNavigateToContact: (contactId: string) => void;
}

const STAGES: Array<{ key: CRMLead["status"]; label: string; step: number }> = [
  { key: "new", label: "Nuevo", step: 1 },
  { key: "contacted", label: "Contactado", step: 2 },
  { key: "qualified", label: "Calificado", step: 3 },
  { key: "converted", label: "Convertido", step: 4 },
];

type DetailTab = "bant" | "contact" | "notes";

export function MobileLeadDetailScreen({
  leadId,
  onBack,
  onNavigateToContact,
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
            if (found?.summary) setContact(found.summary);
          } catch {
            // fallback
          }
        }
      }
    } catch {
      // noop
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
      Alert.alert("¡Lead Convertido!", "Se ha creado la oportunidad en el Pipeline exitosamente.");
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

  const handleCall = () => {
    if (contact?.phone) {
      void Linking.openURL(`tel:${contact.phone}`);
    } else {
      Alert.alert("Teléfono no disponible", "Este prospecto no tiene número de teléfono registrado.");
    }
  };

  const handleEmail = () => {
    if (contact?.email) {
      void Linking.openURL(`mailto:${contact.email}`);
    } else {
      Alert.alert("Email no disponible", "Este prospecto no tiene correo registrado.");
    }
  };

  const handleWhatsApp = () => {
    if (contact?.phone) {
      const cleanPhone = contact.phone.replace(/[^0-9]/g, "");
      void Linking.openURL(`https://wa.me/${cleanPhone}`);
    } else {
      Alert.alert("WhatsApp no disponible", "No hay teléfono para iniciar chat.");
    }
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando ficha de lead...</Text>
      </View>
    );
  }

  const contactDisplayName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(" ")
    : lead.ownerName || "Prospecto Lead";

  const initials = contactDisplayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const score = lead.score ?? 50;
  const isHot = score >= 75;
  const isWarm = score >= 50 && score < 75;

  const currentStageIndex = STAGES.findIndex((s) => s.key === lead.status);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={18} color="#0f172a" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {contactDisplayName}
          </Text>
          <Text style={styles.headerSubtitle}>
            {lead.interest || "Lead Comercial"} · {lead.id}
          </Text>
        </View>
        <Pressable
          hitSlop={8}
          onPress={() => setEditModalOpen(true)}
          style={styles.editButton}
        >
          <Pencil size={15} color="#135bec" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Lead Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || "L"}</Text>
            </View>
            <View style={styles.heroCopy}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {contactDisplayName}
                </Text>
                {isHot ? (
                  <View style={styles.heatBadgeHot}>
                    <Flame size={10} color="#ea580c" />
                    <Text style={styles.heatBadgeTextHot}>Hot · {score}</Text>
                  </View>
                ) : isWarm ? (
                  <View style={styles.heatBadgeWarm}>
                    <Zap size={10} color="#0284c7" />
                    <Text style={styles.heatBadgeTextWarm}>Warm · {score}</Text>
                  </View>
                ) : (
                  <View style={styles.heatBadgeNeutral}>
                    <Text style={styles.heatBadgeTextNeutral}>{score} pts</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroCompany}>
                {[contact?.jobTitle, contact?.companyName].filter(Boolean).join(" · ") || "Empresa / Cargo no especificado"}
              </Text>
              <Text style={styles.heroOwner}>
                Owner: <Text style={styles.heroOwnerBold}>{lead.ownerName || "Sin asignar"}</Text>
              </Text>
            </View>
          </View>

          {/* Quick 1-Touch Communication Actions */}
          <View style={styles.commGrid}>
            <Pressable style={styles.commBtn} onPress={handleCall}>
              <Phone size={14} color="#0f172a" />
              <Text style={styles.commBtnText}>Llamar</Text>
            </Pressable>
            <Pressable style={styles.commBtn} onPress={handleWhatsApp}>
              <MessageCircle size={14} color="#16a34a" />
              <Text style={styles.commBtnText}>WhatsApp</Text>
            </Pressable>
            <Pressable style={styles.commBtn} onPress={handleEmail}>
              <Mail size={14} color="#0f172a" />
              <Text style={styles.commBtnText}>Email</Text>
            </Pressable>
          </View>
        </View>

        {/* Interactive Qualification Stage Progression Stepper */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Fase del Lead</Text>
          <View style={styles.stageStepper}>
            {STAGES.map((s, index) => {
              const isCurrent = lead.status === s.key;
              const isPassed = currentStageIndex >= 0 && currentStageIndex > index;

              return (
                <Pressable
                  key={s.key}
                  style={[
                    styles.stagePill,
                    isCurrent && styles.stagePillActive,
                    isPassed && styles.stagePillPassed,
                  ]}
                  onPress={() => handleStageChange(s.key)}
                >
                  <Text
                    style={[
                      styles.stagePillText,
                      isCurrent && styles.stagePillTextActive,
                      isPassed && styles.stagePillTextPassed,
                    ]}
                  >
                    {isPassed ? "✓ " : `${s.step}. `}{s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Segmented Control Tabs */}
        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tabButton, activeTab === "bant" && styles.tabButtonActive]}
            onPress={() => setActiveTab("bant")}
          >
            <Target size={13} color={activeTab === "bant" ? "#135bec" : "#64748b"} />
            <Text style={[styles.tabText, activeTab === "bant" && styles.tabTextActive]}>
              Cualificación BANT
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === "contact" && styles.tabButtonActive]}
            onPress={() => setActiveTab("contact")}
          >
            <User size={13} color={activeTab === "contact" ? "#135bec" : "#64748b"} />
            <Text style={[styles.tabText, activeTab === "contact" && styles.tabTextActive]}>
              Contacto 360
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === "notes" && styles.tabButtonActive]}
            onPress={() => setActiveTab("notes")}
          >
            <MessageSquarePlus size={13} color={activeTab === "notes" ? "#135bec" : "#64748b"} />
            <Text style={[styles.tabText, activeTab === "notes" && styles.tabTextActive]}>
              Notas ({notesList.length})
            </Text>
          </Pressable>
        </View>

        {/* Tab 1: BANT Qualification */}
        {activeTab === "bant" && (
          <View style={styles.sectionCard}>
            {/* Maturity Progress Bar */}
            <View style={styles.bantHeaderRow}>
              <View>
                <Text style={styles.sectionHeading}>Madurez Comercial</Text>
                <Text style={styles.bantScoreSubtitle}>{bantMetrics.score}% Calificado</Text>
              </View>
              <Pressable
                onPress={() => setEditModalOpen(true)}
                style={styles.editBantBtn}
              >
                <Pencil size={11} color="#135bec" />
                <Text style={styles.editBantBtnText}>Editar BANT</Text>
              </Pressable>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${bantMetrics.score}%`,
                    backgroundColor:
                      bantMetrics.score >= 75
                        ? "#10b981"
                        : bantMetrics.score >= 50
                        ? "#f59e0b"
                        : "#135bec",
                  },
                ]}
              />
            </View>

            {/* BANT 4 Items */}
            <View style={styles.criteriaGrid}>
              <View style={styles.criteriaItem}>
                <View style={styles.criteriaItemHead}>
                  <Text style={styles.criteriaLabel}>B · Budget</Text>
                  {bantMetrics.budget ? (
                    <Text style={styles.criteriaPillOk}>✓ Listo</Text>
                  ) : (
                    <Text style={styles.criteriaPillPending}>Pendiente</Text>
                  )}
                </View>
                <Text style={styles.criteriaValueHighlight}>
                  {lead.estimatedValue != null
                    ? `${lead.estimatedValue.toLocaleString()} ${lead.estimatedCurrency || "EUR"}`
                    : "Sin estimar"}
                </Text>
              </View>

              <View style={styles.criteriaItem}>
                <View style={styles.criteriaItemHead}>
                  <Text style={styles.criteriaLabel}>A · Authority</Text>
                  {bantMetrics.authority ? (
                    <Text style={styles.criteriaPillOk}>✓ Listo</Text>
                  ) : (
                    <Text style={styles.criteriaPillPending}>Pendiente</Text>
                  )}
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
                  <Text style={styles.criteriaLabel}>N · Need (Necesidad)</Text>
                  {bantMetrics.need ? (
                    <Text style={styles.criteriaPillOk}>✓ Lista</Text>
                  ) : (
                    <Text style={styles.criteriaPillPending}>Pendiente</Text>
                  )}
                </View>
                <Text style={styles.criteriaValue}>
                  {lead.qualificationNeed || lead.interest || "Sin requerimientos documentados aún."}
                </Text>
              </View>

              <View style={styles.criteriaItemFull}>
                <View style={styles.criteriaItemHead}>
                  <Text style={styles.criteriaLabel}>T · Timeline (Plazo)</Text>
                  {bantMetrics.timeline ? (
                    <Text style={styles.criteriaPillOk}>✓ Listo</Text>
                  ) : (
                    <Text style={styles.criteriaPillPending}>Pendiente</Text>
                  )}
                </View>
                <Text style={styles.criteriaValue}>
                  {lead.qualificationTimeline || "Sin fecha objetivo de cierre"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab 2: Contact 360 */}
        {activeTab === "contact" && (
          <View style={styles.sectionCard}>
            <View style={styles.contactCardHeader}>
              <Text style={styles.sectionHeading}>Datos del Contacto</Text>
              {contact && (
                <Pressable
                  onPress={() => onNavigateToContact(contact.id)}
                  style={styles.customer360Link}
                >
                  <Text style={styles.customer360LinkText}>Abrir 360</Text>
                  <ArrowRight size={12} color="#135bec" />
                </Pressable>
              )}
            </View>

            <View style={styles.contactDetails}>
              <View style={styles.contactRow}>
                <User size={13} color="#64748b" />
                <Text style={styles.contactRowText}>{contactDisplayName}</Text>
              </View>
              {contact?.email && (
                <View style={styles.contactRow}>
                  <Mail size={13} color="#64748b" />
                  <Text style={styles.contactRowText}>{contact.email}</Text>
                </View>
              )}
              {contact?.phone && (
                <View style={styles.contactRow}>
                  <Phone size={13} color="#64748b" />
                  <Text style={styles.contactRowText}>{contact.phone}</Text>
                </View>
              )}
              {(contact?.city || contact?.country) && (
                <View style={styles.contactRow}>
                  <MapPin size={13} color="#64748b" />
                  <Text style={styles.contactRowText}>
                    {[contact.city, contact.country].filter(Boolean).join(", ")}
                  </Text>
                </View>
              )}
              <View style={styles.contactRow}>
                <Building2 size={13} color="#64748b" />
                <Text style={styles.contactRowText}>
                  {contact?.companyName || "Empresa no asignada"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab 3: Notes & Quick Activity */}
        {activeTab === "notes" && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Notas y Actividad</Text>

            {/* Quick Note Input */}
            <View style={styles.quickNoteBox}>
              <TextInput
                style={styles.quickNoteInput}
                placeholder="Escribe una nota rápida o compromiso..."
                value={newNoteText}
                onChangeText={setNewNoteText}
                multiline
              />
              <Pressable
                style={[styles.quickNoteSendBtn, !newNoteText.trim() && { opacity: 0.5 }]}
                disabled={!newNoteText.trim()}
                onPress={handleAddNote}
              >
                <Send size={13} color="#ffffff" />
                <Text style={styles.quickNoteSendText}>Guardar</Text>
              </Pressable>
            </View>

            {/* Notes List */}
            <View style={styles.notesList}>
              {notesList.map((item) => (
                <View key={item.id} style={styles.noteCard}>
                  <Text style={styles.noteDate}>{item.date}</Text>
                  <Text style={styles.noteText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.stickyBottomBar}>
        {lead.status !== "converted" ? (
          <Pressable
            style={styles.convertCtaButton}
            onPress={() => setConvertModalOpen(true)}
          >
            <TrendingUp size={16} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.convertCtaText}>Convertir a Oportunidad</Text>
          </Pressable>
        ) : (
          <View style={styles.convertedBanner}>
            <CheckCircle2 size={16} color="#15803d" />
            <Text style={styles.convertedBannerText}>Lead Convertido en Pipeline</Text>
          </View>
        )}
      </View>

      {/* Convert to Opportunity Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={convertModalOpen}
        onRequestClose={() => setConvertModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Convertir a Oportunidad</Text>
              <Pressable hitSlop={8} onPress={() => setConvertModalOpen(false)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Título de la Oportunidad</Text>
              <TextInput
                style={styles.textInput}
                value={dealName}
                onChangeText={setDealName}
                placeholder="ej. Oportunidad Cloud Enterprise"
              />

              <Text style={styles.inputLabel}>Importe Estimado (€ / $)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={dealAmount}
                onChangeText={setDealAmount}
                placeholder="35000"
              />

              <Text style={styles.inputLabel}>Fase Inicial en Pipeline</Text>
              <View style={styles.stageOptionsRow}>
                {(["prospecting", "qualified", "proposal", "negotiation"] as const).map(
                  (stage) => (
                    <Pressable
                      key={stage}
                      style={[
                        styles.stageOptionPill,
                        dealStage === stage && styles.stageOptionPillActive,
                      ]}
                      onPress={() => setDealStage(stage)}
                    >
                      <Text
                        style={[
                          styles.stageOptionText,
                          dealStage === stage && styles.stageOptionTextActive,
                        ]}
                      >
                        {stage}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              <Pressable
                style={[styles.modalSubmitBtn, converting && { opacity: 0.6 }]}
                disabled={converting}
                onPress={handleConvert}
              >
                <TrendingUp size={16} color="#ffffff" />
                <Text style={styles.modalSubmitText}>
                  {converting ? "Creando Oportunidad..." : "Confirmar Conversión"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Quick Edit & BANT Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={editModalOpen}
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Lead y BANT</Text>
              <Pressable hitSlop={8} onPress={() => setEditModalOpen(false)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Interés / Objetivo del Prospecto</Text>
              <TextInput
                style={styles.textInput}
                value={editInterest}
                onChangeText={setEditInterest}
                placeholder="ej. Expansión Enterprise Cloud"
              />

              <Text style={styles.inputLabel}>Presupuesto Estimado (Budget)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={editValue}
                onChangeText={setEditValue}
                placeholder="35000"
              />

              <Text style={styles.inputLabel}>Necesidad Detectada (Need)</Text>
              <TextInput
                style={[styles.textInput, { height: 65, textAlignVertical: "top" }]}
                multiline
                value={editNeed}
                onChangeText={setEditNeed}
                placeholder="¿Qué problema u objetivo buscan solucionar?"
              />

              <Text style={styles.inputLabel}>Plazo Esperado (Timeline)</Text>
              <TextInput
                style={styles.textInput}
                value={editTimeline}
                onChangeText={setEditTimeline}
                placeholder="Este trimestre, 3-6 meses..."
              />

              <Pressable style={styles.modalSubmitBtn} onPress={handleSaveEdit}>
                <Check size={16} color="#ffffff" />
                <Text style={styles.modalSubmitText}>Guardar Cambios</Text>
              </Pressable>
            </ScrollView>
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
  },
  loadingText: {
    color: "#64748b",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748b",
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 90,
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 14,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#135bec",
    fontSize: 17,
    fontWeight: "800",
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
    fontSize: 16,
    fontWeight: "800",
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
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  heatBadgeTextHot: {
    fontSize: 10,
    fontWeight: "700",
    color: "#92400e",
  },
  heatBadgeWarm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  heatBadgeTextWarm: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0284c7",
  },
  heatBadgeNeutral: {
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  heatBadgeTextNeutral: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
  },
  heroCompany: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  heroOwner: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 3,
  },
  heroOwnerBold: {
    fontWeight: "700",
    color: "#334155",
  },
  commGrid: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  commBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  commBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  stageStepper: {
    flexDirection: "row",
    gap: 5,
  },
  stagePill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  stagePillActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  stagePillPassed: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
  },
  stagePillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
  },
  stagePillTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  stagePillTextPassed: {
    color: "#334155",
    fontWeight: "600",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  bantHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bantScoreSubtitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 1,
  },
  editBantBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editBantBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#135bec",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  criteriaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  criteriaItem: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
    gap: 3,
  },
  criteriaItemFull: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
    gap: 3,
  },
  criteriaItemHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  criteriaLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  criteriaPillOk: {
    fontSize: 9,
    fontWeight: "700",
    color: "#15803d",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  criteriaPillPending: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  criteriaValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  criteriaSubtext: {
    fontSize: 11,
    color: "#64748b",
  },
  criteriaValueHighlight: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  contactCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customer360Link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  customer360LinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#135bec",
  },
  contactDetails: {
    gap: 8,
    paddingTop: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactRowText: {
    fontSize: 13,
    color: "#334155",
  },
  quickNoteBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  quickNoteInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 80,
    fontSize: 12,
    color: "#0f172a",
    padding: 0,
  },
  quickNoteSendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#135bec",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickNoteSendText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  notesList: {
    gap: 8,
    marginTop: 4,
  },
  noteCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: 10,
    gap: 3,
  },
  noteDate: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
  },
  noteText: {
    fontSize: 12,
    color: "#334155",
  },
  stickyBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  convertCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#135bec",
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: "#135bec",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  convertCtaText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  convertedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  convertedBannerText: {
    color: "#15803d",
    fontSize: 13,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalBody: {
    paddingVertical: 14,
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginTop: 4,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#0f172a",
  },
  stageOptionsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  stageOptionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  stageOptionPillActive: {
    backgroundColor: "#135bec",
    borderColor: "#135bec",
  },
  stageOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "capitalize",
  },
  stageOptionTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  modalSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#135bec",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
  },
  modalSubmitText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});

