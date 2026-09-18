import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
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
  Calendar,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Filter,
  Flame,
  MessageCircle,
  MoveRight,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
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

const STAGE_LABELS: Record<PipelineStageId, string> = {
  prospecting: "1. Prospección",
  qualified: "2. Cualificado",
  proposal: "3. Propuesta",
  negotiation: "4. Negociación",
  won: "5. Ganada",
  lost: "6. Perdida",
};

export default function MobilePipelineScreen({ onBack, onNavigate }: MobilePipelineScreenProps) {
  const [opportunities, setOpportunities] = useState<CRMOpportunity[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");

  // Modals
  const [stageModalOpportunity, setStageModalOpportunity] = useState<CRMOpportunity | null>(null);
  const [reopenModalOpportunity, setReopenModalOpportunity] = useState<CRMOpportunity | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Opportunity Form State
  const [newDealName, setNewDealName] = useState("");
  const [newContactId, setNewContactId] = useState("");
  const [newAmount, setNewAmount] = useState("25000");
  const [newCurrency, setNewCurrency] = useState("USD");
  const [newStage, setNewStage] = useState<PipelineStageId>("prospecting");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [oppList, contactsPage] = await Promise.all([
        mobileCrmAdapter.listAllOpportunities(),
        mobileContactAdapter.listContacts({
          organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
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
      setRefreshing(false);
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
      const prob = opp.probability !== undefined ? opp.probability : (opp.stageKey === "won" ? 1 : opp.stageKey === "lost" ? 0 : 0.5);

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
      // Prompt reopen
      const current = stageModalOpportunity;
      setStageModalOpportunity(null);
      setReopenModalOpportunity(current);
      return;
    }

    try {
      await mobileCrmAdapter.moveOpportunityStage(stageModalOpportunity.id, targetStage);
      setStageModalOpportunity(null);
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo actualizar la etapa");
    }
  };

  // Reopen handler
  const handleReopenSubmit = async () => {
    if (!reopenModalOpportunity || !reopenReason.trim()) {
      Alert.alert("Motivo requerido", "Debes ingresar una justificación para reabrir este deal cerrado.");
      return;
    }

    try {
      await mobileCrmAdapter.reopenOpportunity(reopenModalOpportunity.id, reopenReason);
      setReopenModalOpportunity(null);
      setReopenReason("");
      await loadData();
    } catch (err: any) {
      Alert.alert("Error al reabrir", err?.message || "No se pudo reabrir la oportunidad");
    }
  };

  // Create Opportunity handler
  const handleCreateSubmit = async () => {
    if (!newDealName.trim()) {
      Alert.alert("Campo requerido", "Por favor ingresa un nombre para la oportunidad.");
      return;
    }
    if (!newContactId) {
      Alert.alert("Contacto requerido", "Selecciona un contacto asignado.");
      return;
    }

    try {
      const selectedContact = contactsMap.get(newContactId);
      await mobileCrmAdapter.createOpportunity({
        organizationId: selectedContact?.organizationId || "80fce911-57c5-4a83-809f-78df6a3736f7",
        contactId: newContactId,
        leadId: null,
        catalogItemId: null,
        productKey: null,
        name: newDealName.trim(),
        amount: Number(newAmount) || 0,
        currency: newCurrency,
        stageKey: newStage,
        probability: newStage === "prospecting" ? 0.15 : newStage === "qualified" ? 0.4 : newStage === "proposal" ? 0.65 : newStage === "negotiation" ? 0.8 : 0.5,
        origin: "manual",
        ownerName: "Maya Chen",
        ownerId: "owner-maya",
        expectedCloseAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        lossReason: null,
      });

      setCreateModalOpen(false);
      setNewDealName("");
      setNewAmount("25000");
      await loadData();
    } catch (err: any) {
      Alert.alert("Error al crear", err?.message || "No se pudo crear la oportunidad");
    }
  };

  const openPhone = (phone?: string) => {
    if (!phone) {
      Alert.alert("Sin teléfono", "Este contacto no tiene número registrado.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) {
      Alert.alert("Sin teléfono", "Este contacto no tiene número registrado.");
      return;
    }
    const cleanNumber = phone.replace(/[^\d+]/g, "");
    Linking.openURL(`https://wa.me/${cleanNumber}`);
  };

  const openEmail = (email?: string) => {
    if (!email) {
      Alert.alert("Sin email", "Este contacto no tiene correo registrado.");
      return;
    }
    Linking.openURL(`mailto:${email}`);
  };

  const formatCurrency = (amt: number | null, curr: string = "USD") => {
    if (amt === null || amt === undefined) return "$0";
    return `$${amt.toLocaleString("en-US")} ${curr}`;
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={18} color="#1e293b" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <View style={styles.headerEyebrow}>
            <TrendingUp size={12} color="#135bec" />
            <Text style={styles.headerEyebrowText}>VENTAS B2B</Text>
          </View>
          <Text style={styles.headerTitle}>Pipeline Comercial</Text>
        </View>
        <Pressable
          accessibilityLabel="Nueva Oportunidad"
          onPress={() => setCreateModalOpen(true)}
          style={styles.addButton}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addButtonText}>Nuevo</Text>
        </Pressable>
      </View>

      {/* KPI Ribbon */}
      <View style={styles.kpiContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiScroll}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconWrap}>
              <DollarSign size={16} color="#135bec" />
            </View>
            <Text style={styles.kpiLabel}>Pipeline Activo</Text>
            <Text style={styles.kpiValue}>${(kpis.totalPipelineValue / 1000).toFixed(0)}k</Text>
            <Text style={styles.kpiSub}>USD valor nominal</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: "#f0fdf4" }]}>
              <Sparkles size={16} color="#16a34a" />
            </View>
            <Text style={styles.kpiLabel}>Forecast Ponderado</Text>
            <Text style={[styles.kpiValue, { color: "#15803d" }]}>
              ${(kpis.weightedForecast / 1000).toFixed(0)}k
            </Text>
            <Text style={styles.kpiSub}>Cierre estimado</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: "#fefce8" }]}>
              <TrendingUp size={16} color="#ca8a04" />
            </View>
            <Text style={styles.kpiLabel}>Deals Abiertos</Text>
            <Text style={styles.kpiValue}>{kpis.openCount}</Text>
            <Text style={styles.kpiSub}>En negociación activa</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: "#fdf2f8" }]}>
              <CheckCircle2 size={16} color="#db2777" />
            </View>
            <Text style={styles.kpiLabel}>Win Rate</Text>
            <Text style={[styles.kpiValue, { color: "#be185d" }]}>{kpis.winRate}%</Text>
            <Text style={styles.kpiSub}>Efectividad de cierre</Text>
          </View>
        </ScrollView>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={16} color="#64748b" style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar por deal, contacto, empresa..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={styles.clearSearch}>
              <X size={14} color="#94a3b8" />
            </Pressable>
          )}
        </View>

        {/* Stage Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageTabsContainer}
        >
          <Pressable
            onPress={() => setSelectedStage("all")}
            style={[styles.stageTab, selectedStage === "all" && styles.stageTabActive]}
          >
            <Text
              style={[
                styles.stageTabText,
                selectedStage === "all" && styles.stageTabTextActive,
              ]}
            >
              Todos
            </Text>
            <View style={[styles.stageTabBadge, selectedStage === "all" && styles.stageTabBadgeActive]}>
              <Text style={[styles.stageTabBadgeText, selectedStage === "all" && styles.stageTabBadgeTextActive]}>
                {opportunities.length}
              </Text>
            </View>
          </Pressable>

          {pipelineStages.map((stage) => {
            const count = opportunities.filter((o) => o.stageKey === stage.id).length;
            const isSelected = selectedStage === stage.id;
            return (
              <Pressable
                key={stage.id}
                onPress={() => setSelectedStage(stage.id)}
                style={[
                  styles.stageTab,
                  isSelected && styles.stageTabActive,
                ]}
              >
                <View
                  style={[
                    styles.stageDot,
                    { backgroundColor: STAGE_COLORS[stage.id]?.text || "#64748b" },
                  ]}
                />
                <Text
                  style={[
                    styles.stageTabText,
                    isSelected && styles.stageTabTextActive,
                  ]}
                >
                  {STAGE_LABELS[stage.id] || stage.label}
                </Text>
                <View style={[styles.stageTabBadge, isSelected && styles.stageTabBadgeActive]}>
                  <Text style={[styles.stageTabBadgeText, isSelected && styles.stageTabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Opportunities List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <View style={styles.emptyWrap}>
            <RefreshCw size={24} color="#135bec" />
            <Text style={styles.emptyText}>Cargando pipeline comercial...</Text>
          </View>
        ) : filteredOpportunities.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Filter size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No se encontraron deals</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? "Intenta con otros términos de búsqueda." : "No hay oportunidades en esta etapa."}
            </Text>
          </View>
        ) : (
          filteredOpportunities.map((opp) => {
            const contact = contactsMap.get(opp.contactId);
            const contactFullName = contact
              ? `${contact.givenName} ${contact.familyName}`
              : "Contacto sin asignar";
            const orgName = contact?.organizationName || "Empresa B2B";
            const stageStyle = STAGE_COLORS[opp.stageKey] || STAGE_COLORS.prospecting;
            const isTerminal = opp.stageKey === "won" || opp.stageKey === "lost";
            const probPct = opp.probability !== undefined ? Math.round(opp.probability * 100) : (opp.stageKey === "won" ? 100 : opp.stageKey === "lost" ? 0 : 50);

            return (
              <View key={opp.id} style={styles.card}>
                <Pressable
                  onPress={() => onNavigate?.(`/app/sales-crm/opportunities/${opp.id}`)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
                >
                  {/* Top Row: Deal Name & Stage */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {opp.name}
                      </Text>
                      <View style={styles.metaRow}>
                        <Text style={styles.cardSubtitle}>
                          {contactFullName} · {orgName}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.stageBadge,
                        { backgroundColor: stageStyle.bg, borderColor: stageStyle.border },
                      ]}
                    >
                      <Text style={[styles.stageBadgeText, { color: stageStyle.text }]}>
                        {STAGE_LABELS[opp.stageKey] || opp.stageKey}
                      </Text>
                    </View>
                  </View>

                  {/* Amount & Metrics Ribbon */}
                  <View style={styles.metricsBox}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>IMPORTE DEAL</Text>
                      <Text style={styles.metricAmount}>
                        {formatCurrency(opp.amount, opp.currency)}
                      </Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>PROBABILIDAD</Text>
                      <View style={styles.probRow}>
                        <Text style={styles.metricProb}>{probPct}%</Text>
                        <View style={styles.probTrack}>
                          <View style={[styles.probFill, { width: `${probPct}%` }]} />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Info Pills */}
                  <View style={styles.cardPillRow}>
                    {opp.origin === "lead_conversion" && (
                      <View style={styles.infoPill}>
                        <Sparkles size={11} color="#6366f1" />
                        <Text style={[styles.infoPillText, { color: "#4f46e5" }]}>De Lead SQL</Text>
                      </View>
                    )}
                    {opp.expectedCloseAt && (
                      <View style={styles.infoPill}>
                        <Calendar size={11} color="#64748b" />
                        <Text style={styles.infoPillText}>
                          Cierre: {new Date(opp.expectedCloseAt).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                        </Text>
                      </View>
                    )}
                    <View style={styles.infoPill}>
                      <User size={11} color="#64748b" />
                      <Text style={styles.infoPillText}>{opp.ownerName || "Maya Chen"}</Text>
                    </View>
                  </View>

                  {opp.lossReason && opp.stageKey === "lost" && (
                    <View style={styles.lossBox}>
                      <Text style={styles.lossLabel}>Motivo de pérdida:</Text>
                      <Text style={styles.lossText}>{opp.lossReason}</Text>
                    </View>
                  )}
                </Pressable>

                {/* 1-Tap Speed Dial Action Bar */}
                <View style={styles.cardActions}>
                  <View style={styles.commActions}>
                    <Pressable
                      onPress={() => openPhone(contact?.phone)}
                      style={[styles.actionBtn, styles.callBtn]}
                    >
                      <Phone size={14} color="#15803d" />
                    </Pressable>
                    <Pressable
                      onPress={() => openWhatsApp(contact?.phone)}
                      style={[styles.actionBtn, styles.waBtn]}
                    >
                      <MessageCircle size={14} color="#047857" />
                    </Pressable>
                    <Pressable
                      onPress={() => openEmail(contact?.email)}
                      style={[styles.actionBtn, styles.emailBtn]}
                    >
                      <Text style={styles.emailBtnText}>@</Text>
                    </Pressable>
                  </View>

                  <View style={styles.rightActions}>
                    <Pressable
                      onPress={() => {
                        if (isTerminal) {
                          setReopenModalOpportunity(opp);
                        } else {
                          setStageModalOpportunity(opp);
                        }
                      }}
                      style={styles.stageMoveBtn}
                    >
                      {isTerminal ? (
                        <RotateCcw size={12} color="#475569" />
                      ) : (
                        <MoveRight size={12} color="#135bec" />
                      )}
                      <Text
                        style={[
                          styles.stageMoveBtnText,
                          isTerminal && { color: "#475569" },
                        ]}
                      >
                        {isTerminal ? "Reabrir" : "Mover"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => onNavigate?.(`/app/sales-crm/opportunities/${opp.id}`)}
                      style={styles.detailBtn}
                    >
                      <Text style={styles.detailBtnText}>Detalle</Text>
                      <ChevronRight size={14} color="#ffffff" />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal: Cambiar Etapa */}
      <Modal visible={!!stageModalOpportunity} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avanzar Etapa Comercial</Text>
              <Pressable onPress={() => setStageModalOpportunity(null)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Selecciona la nueva etapa para &quot;{stageModalOpportunity?.name}&quot;:
            </Text>

            <View style={styles.stageOptionsList}>
              {pipelineStages.map((st) => {
                const isCurrent = stageModalOpportunity?.stageKey === st.id;
                const styleObj = STAGE_COLORS[st.id] || STAGE_COLORS.prospecting;
                return (
                  <Pressable
                    key={st.id}
                    onPress={() => handleStageSelect(st.id)}
                    style={[
                      styles.stageOptionItem,
                      isCurrent && styles.stageOptionItemCurrent,
                    ]}
                  >
                    <View
                      style={[
                        styles.stageOptionBadge,
                        { backgroundColor: styleObj.bg, borderColor: styleObj.border },
                      ]}
                    >
                      <Text style={[styles.stageOptionBadgeText, { color: styleObj.text }]}>
                        {STAGE_LABELS[st.id] || st.label}
                      </Text>
                    </View>
                    {isCurrent && (
                      <Text style={styles.currentStageTag}>Actual</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Reabrir Deal Terminal */}
      <Modal visible={!!reopenModalOpportunity} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <RotateCcw size={18} color="#135bec" />
                <Text style={styles.modalTitle}>Reabrir Oportunidad Cerrada</Text>
              </View>
              <Pressable onPress={() => setReopenModalOpportunity(null)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Este deal está en estado terminal (&quot;{reopenModalOpportunity?.stageKey}&quot;). Para reactivarlo, ingresa una justificación obligatoria:
            </Text>

            <TextInput
              placeholder="Ej. El cliente reactivó presupuesto tras reestructuración..."
              placeholderTextColor="#94a3b8"
              value={reopenReason}
              onChangeText={setReopenReason}
              multiline
              numberOfLines={3}
              style={styles.reopenTextInput}
            />

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setReopenModalOpportunity(null)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleReopenSubmit}
                style={styles.confirmReopenBtn}
              >
                <Text style={styles.confirmReopenBtnText}>Confirmar Reapertura</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Crear Nueva Oportunidad */}
      <Modal visible={createModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Oportunidad Comercial</Text>
              <Pressable onPress={() => setCreateModalOpen(false)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.createFormScroll}>
              <Text style={styles.fieldLabel}>NOMBRE DEL DEAL *</Text>
              <TextInput
                placeholder="Ej. Expansión Enterprise Licencias 2026"
                placeholderTextColor="#94a3b8"
                value={newDealName}
                onChangeText={setNewDealName}
                style={styles.formInput}
              />

              <Text style={styles.fieldLabel}>CONTACTO / EMPRESA *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactPickerScroll}>
                {contacts.map((c) => {
                  const isSelected = newContactId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setNewContactId(c.id)}
                      style={[
                        styles.contactPill,
                        isSelected && styles.contactPillActive,
                      ]}
                    >
                      <Text style={[styles.contactPillText, isSelected && styles.contactPillTextActive]}>
                        {c.givenName} {c.familyName}
                      </Text>
                      <Text style={[styles.contactPillSub, isSelected && styles.contactPillSubActive]}>
                        {c.organizationName || "B2B"}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>IMPORTE (USD)</Text>
                  <TextInput
                    placeholder="25000"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={newAmount}
                    onChangeText={setNewAmount}
                    style={styles.formInput}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>ETAPA INICIAL</Text>
                  <View style={styles.initialStageBox}>
                    <Text style={styles.initialStageText}>1. Prospección (15%)</Text>
                  </View>
                </View>
              </View>

              <Pressable onPress={handleCreateSubmit} style={styles.submitCreateBtn}>
                <Text style={styles.submitCreateBtnText}>Crear Oportunidad</Text>
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
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerEyebrowText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#135bec",
    letterSpacing: 1.1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#135bec",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  kpiContainer: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  kpiScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  kpiCard: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    width: 140,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },
  searchSection: {
    backgroundColor: "#ffffff",
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    marginHorizontal: 16,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
    paddingVertical: 0,
  },
  clearSearch: {
    padding: 4,
  },
  stageTabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: "row",
    gap: 16,
  },
  stageTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 10,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  stageTabActive: {
    borderBottomColor: "#135bec",
  },
  stageTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  stageTabTextActive: {
    color: "#0f172a",
    fontWeight: "800",
  },
  stageTabBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  stageTabBadgeActive: {
    backgroundColor: "#eff6ff",
  },
  stageTabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  stageTabBadgeTextActive: {
    color: "#1d4ed8",
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  listContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748b",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metricsBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  metricItem: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 10,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.8,
  },
  metricAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  probRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  metricProb: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
  },
  probTrack: {
    flex: 1,
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  probFill: {
    height: "100%",
    backgroundColor: "#135bec",
  },
  cardPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  infoPillText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
  },
  lossBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  lossLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#991b1b",
  },
  lossText: {
    fontSize: 12,
    color: "#b91c1c",
    marginTop: 1,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  commActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  callBtn: {
    backgroundColor: "#dcfce7",
  },
  waBtn: {
    backgroundColor: "#d1fae5",
  },
  emailBtn: {
    backgroundColor: "#eff6ff",
  },
  emailBtnText: {
    color: "#1d4ed8",
    fontWeight: "800",
    fontSize: 13,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stageMoveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stageMoveBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
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
  createModalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "85%",
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
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  stageOptionsList: {
    gap: 8,
    marginTop: 4,
  },
  stageOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  stageOptionItemCurrent: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  stageOptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  stageOptionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  currentStageTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#135bec",
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
  createFormScroll: {
    gap: 12,
    paddingTop: 10,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  contactPickerScroll: {
    flexDirection: "row",
    gap: 8,
  },
  contactPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
  },
  contactPillActive: {
    backgroundColor: "#135bec",
    borderColor: "#135bec",
  },
  contactPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  contactPillTextActive: {
    color: "#ffffff",
  },
  contactPillSub: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  contactPillSubActive: {
    color: "#bfdbfe",
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
  },
  formCol: {
    flex: 1,
    gap: 6,
  },
  initialStageBox: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  initialStageText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  submitCreateBtn: {
    backgroundColor: "#135bec",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitCreateBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
});
