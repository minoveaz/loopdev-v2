import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import {
  Search,
  Tag,
  Sliders,
  ShieldCheck,
  Plus,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Users,
} from "lucide-react-native";
import { useCrmOperations } from "../hooks/useMobileCrmOperations";
import type {
  CRMEntityType,
  CRMFieldType,
  CRMVisibility,
} from "../domains/crm-operations";
import { mobileContactAdapter } from "../adapters/contact";
import type { PotentialContactDuplicate } from "../../../packages/contracts/src/contact-port";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobilePageTabs,
  MobileSearchBar,
  MobileCard,
  MobileButton,
  MobileStatusBadge,
  MobileLoadingState,
  MobileEmptyState,
  MobileBottomSheet,
  MobileConfirmDialog,
} from "./ui";

interface MobileCrmOperationsScreenProps {
  onBack: () => void;
  onNavigateToContact?: (contactId: string) => void;
}

const TAG_COLORS = [
  "#135bec",
  "#16a34a",
  "#ca8a04",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#ec4899",
  "#475569",
];

export function MobileCrmOperationsScreen({
  onBack,
  onNavigateToContact,
}: MobileCrmOperationsScreenProps) {
  const [activeTab, setActiveTab] = useState<string>("search");
  const [entityType, setEntityType] = useState<CRMEntityType>("contact");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTagSheetOpen, setBulkTagSheetOpen] = useState(false);
  const [selectedBulkTag, setSelectedBulkTag] = useState<string>("");

  // Tag creation sheet state
  const [createTagSheetOpen, setCreateTagSheetOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [newTagVisibility, setNewTagVisibility] = useState<CRMVisibility>("workspace");

  // Custom Field sheet state
  const [createFieldSheetOpen, setCreateFieldSheetOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldType, setNewFieldType] = useState<CRMFieldType>("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldVisibility, setNewFieldVisibility] = useState<CRMVisibility>("workspace");

  // Duplicates state
  const [duplicateCandidates, setDuplicateCandidates] = useState<PotentialContactDuplicate[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);

  const {
    tags,
    customFields,
    results,
    loading,
    search,
    createTag,
    createCustomField,
    bulkUpdateEntityTags,
    exportCsv,
  } = useCrmOperations(entityType);

  // Load duplicates when tab changes
  useEffect(() => {
    if (activeTab === "duplicates") {
      void loadDuplicateCandidates();
    }
  }, [activeTab]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, entityType, search]);

  const loadDuplicateCandidates = async () => {
    setLoadingDuplicates(true);
    try {
      const dups = await mobileContactAdapter.findPotentialDuplicates({
        organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
        threshold: 0.7,
      });
      setDuplicateCandidates(dups);
    } catch {
      setDuplicateCandidates([]);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  const handleDismissDuplicate = async (targetId: string) => {
    try {
      await mobileContactAdapter.dismissDuplicateCandidate(
        "80fce911-57c5-4a83-809f-78df6a3736f7",
        targetId,
        "Revisado manualmente desde Operaciones Mobile"
      );
      setDuplicateCandidates((prev) => prev.filter((d) => d.targetContactId !== targetId));
      Alert.alert("Descartado", "El candidato de duplicado ha sido descartado.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo descartar el duplicado.");
    }
  };

  const toggleSelectEntity = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplyBulkTag = async () => {
    if (!selectedBulkTag) {
      Alert.alert("Selección requerida", "Por favor selecciona una etiqueta para asignar.");
      return;
    }
    try {
      await bulkUpdateEntityTags(selectedIds, [selectedBulkTag], "add");
      setSelectedIds([]);
      setBulkTagSheetOpen(false);
      setSelectedBulkTag("");
      Alert.alert("Éxito", `Etiqueta aplicada a ${selectedIds.length} elementos.`);
      search(searchQuery);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo aplicar la etiqueta.");
    }
  };

  const handleCreateTagSubmit = async () => {
    if (!newTagName.trim()) {
      Alert.alert("Requerido", "Por favor ingresa un nombre para el tag.");
      return;
    }
    try {
      await createTag({
        name: newTagName.trim(),
        color: newTagColor,
        visibility: newTagVisibility,
      });
      setNewTagName("");
      setCreateTagSheetOpen(false);
      Alert.alert("Tag Creado", "La etiqueta se guardó correctamente.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo crear la etiqueta.");
    }
  };

  const handleCreateFieldSubmit = async () => {
    if (!newFieldLabel.trim()) {
      Alert.alert("Requerido", "Ingresa una etiqueta para el campo.");
      return;
    }
    const key =
      newFieldKey.trim() ||
      newFieldLabel
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");
    try {
      await createCustomField({
        label: newFieldLabel.trim(),
        key,
        entityType,
        fieldType: newFieldType,
        required: newFieldRequired,
        visibility: newFieldVisibility,
      });
      setNewFieldLabel("");
      setNewFieldKey("");
      setCreateFieldSheetOpen(false);
      Alert.alert("Campo Creado", `El campo "${newFieldLabel}" fue añadido a ${entityType}.`);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo crear el campo.");
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = await exportCsv(entityType);
      Alert.alert(
        "Exportación Generada",
        `Se han generado ${csv.split("\n").length} filas de datos para ${entityType}.`
      );
    } catch (err: any) {
      Alert.alert("Error de Exportación", err?.message || "No se pudo exportar.");
    }
  };

  // Main navigation tabs (Strictly NO pills)
  const mainTabs = [
    { id: "search", label: "Búsqueda & Masivas" },
    { id: "tags", label: "Etiquetas", count: tags.length },
    { id: "fields", label: "Campos", count: customFields.length },
    { id: "duplicates", label: "Duplicados", count: duplicateCandidates.length },
  ];

  // Entity tabs (Strictly NO pills)
  const entityTabs = [
    { id: "contact", label: "Contactos" },
    { id: "lead", label: "Leads" },
    { id: "opportunity", label: "Deals" },
  ];

  return (
    <MobilePageContainer>
      {/* Canonical Header */}
      <MobilePageHeader
        title="Operaciones CRM"
        subtitle="CALIDAD & AUTOMATIZACIÓN"
        onBack={onBack}
        rightAction={
          <MobileButton
            variant="ghost"
            size="sm"
            icon={Download}
            onPress={handleExportCsv}
            minHeight={36}
          >
            Exportar
          </MobileButton>
        }
      />

      {/* Main Tabs (NO PILLS, 2.5px active indicator, weight 700) */}
      <MobilePageTabs
        tabs={mainTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* TAB 1: BÚSQUEDA & OPERACIONES MASIVAS */}
      {activeTab === "search" && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Entity Selector (NO PILLS) */}
          <MobilePageTabs
            tabs={entityTabs}
            activeTab={entityType}
            onTabChange={(val) => {
              setEntityType(val as CRMEntityType);
              setSelectedIds([]);
            }}
          />

          {/* Search Box */}
          <View style={styles.searchWrap}>
            <MobileSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Buscar en ${
                entityType === "contact" ? "contactos" : entityType === "lead" ? "leads" : "oportunidades"
              }...`}
              onClear={() => setSearchQuery("")}
            />
          </View>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <View style={styles.bulkBar}>
              <Text style={styles.bulkCount}>{selectedIds.length} seleccionados</Text>
              <MobileButton
                variant="primary"
                size="sm"
                icon={Tag}
                onPress={() => setBulkTagSheetOpen(true)}
                minHeight={36}
              >
                Asignar Tag
              </MobileButton>
            </View>
          )}

          {/* Results List */}
          <View style={styles.resultsContainer}>
            {loading ? (
              <MobileLoadingState message="Buscando registros..." />
            ) : results.length === 0 ? (
              <MobileEmptyState
                title="No hay resultados"
                description="Intenta con otros términos de búsqueda o cambia la entidad seleccionada."
              />
            ) : (
              results.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <MobileCard key={item.id} style={styles.resultCard}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Seleccionar ${item.title}`}
                      onPress={() => toggleSelectEntity(item.id)}
                      style={styles.cardSelectableRow}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Check size={14} color="#ffffff" />}
                      </View>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultTitle}>{item.title}</Text>
                        <Text style={styles.resultSubtitle}>{item.subtitle || "Sin detalles"}</Text>
                        {item.tags && item.tags.length > 0 && (
                          <View style={styles.tagsRow}>
                            {item.tags.map((t) => (
                              <View key={t} style={styles.tagBadge}>
                                <Text style={styles.tagBadgeText}>{t}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </Pressable>
                  </MobileCard>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* TAB 2: ETIQUETAS */}
      {activeTab === "tags" && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Etiquetas del Workspace</Text>
            <MobileButton
              variant="primary"
              size="sm"
              icon={Plus}
              onPress={() => setCreateTagSheetOpen(true)}
              minHeight={36}
            >
              Nuevo Tag
            </MobileButton>
          </View>

          <View style={styles.resultsContainer}>
            {tags.length === 0 ? (
              <MobileEmptyState
                title="No hay tags creados"
                description="Crea tags para clasificar tus cuentas y prospectos."
                actionLabel="Crear Etiqueta"
                onAction={() => setCreateTagSheetOpen(true)}
              />
            ) : (
              tags.map((tag) => (
                <MobileCard key={tag.id} style={styles.tagCard}>
                  <View style={styles.tagColorRow}>
                    <View style={[styles.tagDot, { backgroundColor: tag.color || "#135bec" }]} />
                    <Text style={styles.tagName}>{tag.name}</Text>
                  </View>
                  <MobileStatusBadge
                    status="neutral"
                    label={
                      tag.visibility === "organization"
                        ? "Org"
                        : tag.visibility === "private"
                        ? "Privado"
                        : "Workspace"
                    }
                    size="sm"
                  />
                </MobileCard>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* TAB 3: CAMPOS PERSONALIZADOS */}
      {activeTab === "fields" && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Campos en {entityType.toUpperCase()}</Text>
            <MobileButton
              variant="primary"
              size="sm"
              icon={Plus}
              onPress={() => setCreateFieldSheetOpen(true)}
              minHeight={36}
            >
              Nuevo Campo
            </MobileButton>
          </View>

          {/* Entity filter for fields */}
          <MobilePageTabs
            tabs={entityTabs}
            activeTab={entityType}
            onTabChange={(val) => setEntityType(val as CRMEntityType)}
          />

          <View style={styles.resultsContainer}>
            {customFields.length === 0 ? (
              <MobileEmptyState
                title="Sin campos personalizados"
                description={`Agrega atributos dinámicos a ${entityType}.`}
                actionLabel="Crear Campo"
                onAction={() => setCreateFieldSheetOpen(true)}
              />
            ) : (
              customFields.map((field) => (
                <MobileCard key={field.id} style={styles.fieldCard}>
                  <View style={styles.fieldHeader}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    {field.required && (
                      <MobileStatusBadge status="warning" label="Requerido" size="sm" />
                    )}
                  </View>
                  <Text style={styles.fieldKey}>Clave: {field.key}</Text>
                  <View style={styles.fieldFooter}>
                    <Text style={styles.fieldMeta}>Tipo: {field.fieldType}</Text>
                    <Text style={styles.fieldMeta}>Scope: {field.visibility}</Text>
                  </View>
                </MobileCard>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* TAB 4: CALIDAD & DUPLICADOS */}
      {activeTab === "duplicates" && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <MobileCard style={styles.qualityCard}>
            <View style={styles.qualityHeader}>
              <ShieldCheck size={20} color="#16a34a" />
              <View style={styles.qualityTextWrap}>
                <Text style={styles.qualityTitle}>Control de Duplicados & Calidad</Text>
                <Text style={styles.qualitySub}>
                  Detección proactiva por email, teléfono y similitud de nombres.
                </Text>
              </View>
            </View>
          </MobileCard>

          <View style={styles.resultsContainer}>
            {loadingDuplicates ? (
              <MobileLoadingState message="Buscando duplicados..." />
            ) : duplicateCandidates.length === 0 ? (
              <MobileEmptyState
                title="Base de datos limpia"
                description="No se detectaron contactos duplicados con score mayor al 70%."
              />
            ) : (
              duplicateCandidates.map((dup) => (
                <MobileCard key={dup.targetContactId} style={styles.dupCard}>
                  <View style={styles.dupHeader}>
                    <Text style={styles.dupName}>{dup.targetName}</Text>
                    <MobileStatusBadge
                      status="warning"
                      label={`${Math.round(dup.score * 100)}% coincidencia`}
                      size="sm"
                    />
                  </View>
                  <Text style={styles.dupReason}>{dup.matchedFields.join(" · ")}</Text>

                  <View style={styles.dupActions}>
                    <MobileButton
                      variant="destructive"
                      size="sm"
                      icon={Trash2}
                      onPress={() => handleDismissDuplicate(dup.targetContactId)}
                      minHeight={44}
                    >
                      Descartar Alerta
                    </MobileButton>
                    {onNavigateToContact && (
                      <MobileButton
                        variant="secondary"
                        size="sm"
                        icon={Users}
                        onPress={() => onNavigateToContact(dup.targetContactId)}
                        minHeight={44}
                      >
                        Ver Contacto
                      </MobileButton>
                    )}
                  </View>
                </MobileCard>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Sheet: Bulk Tagging */}
      <MobileBottomSheet
        visible={bulkTagSheetOpen}
        onClose={() => setBulkTagSheetOpen(false)}
        title="Asignar Etiqueta Masiva"
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetSubtitle}>
            Selecciona la etiqueta para aplicar a los {selectedIds.length} elementos seleccionados:
          </Text>
          <View style={styles.tagOptionsGrid}>
            {tags.map((t) => {
              const isChosen = selectedBulkTag === t.name;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setSelectedBulkTag(t.name)}
                  style={[styles.tagChoice, isChosen && styles.tagChoiceActive]}
                >
                  <View style={[styles.tagDot, { backgroundColor: t.color || "#135bec" }]} />
                  <Text style={[styles.tagChoiceText, isChosen && styles.tagChoiceTextActive]}>
                    {t.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.sheetBtnWrap}>
            <MobileButton
              variant="primary"
              size="md"
              onPress={handleApplyBulkTag}
              minHeight={48}
            >
              Aplicar Etiqueta
            </MobileButton>
          </View>
        </View>
      </MobileBottomSheet>

      {/* Sheet: Crear Tag */}
      <MobileBottomSheet
        visible={createTagSheetOpen}
        onClose={() => setCreateTagSheetOpen(false)}
        title="Crear Nueva Etiqueta"
      >
        <View style={styles.sheetContent}>
          <Text style={styles.inputLabel}>NOMBRE DE LA ETIQUETA *</Text>
          <TextInput
            placeholder="Ej. VIP Enterprise"
            placeholderTextColor="#94a3b8"
            value={newTagName}
            onChangeText={setNewTagName}
            style={styles.textInput}
          />

          <Text style={styles.inputLabel}>COLOR DISTINTIVO</Text>
          <View style={styles.colorsRow}>
            {TAG_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setNewTagColor(c)}
                style={[styles.colorCircle, { backgroundColor: c }, newTagColor === c && styles.colorCircleActive]}
              />
            ))}
          </View>

          <View style={styles.sheetBtnWrap}>
            <MobileButton
              variant="primary"
              size="md"
              onPress={handleCreateTagSubmit}
              minHeight={48}
            >
              Guardar Etiqueta
            </MobileButton>
          </View>
        </View>
      </MobileBottomSheet>

      {/* Sheet: Crear Campo Personalizado */}
      <MobileBottomSheet
        visible={createFieldSheetOpen}
        onClose={() => setCreateFieldSheetOpen(false)}
        title={`Nuevo Campo para ${entityType.toUpperCase()}`}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.inputLabel}>ETIQUETA DEL CAMPO *</Text>
          <TextInput
            placeholder="Ej. Presupuesto Anual"
            placeholderTextColor="#94a3b8"
            value={newFieldLabel}
            onChangeText={setNewFieldLabel}
            style={styles.textInput}
          />

          <Text style={styles.inputLabel}>CLAVE INTERNA (Opcional)</Text>
          <TextInput
            placeholder="presupuesto_anual"
            placeholderTextColor="#94a3b8"
            value={newFieldKey}
            onChangeText={setNewFieldKey}
            style={styles.textInput}
          />

          <View style={styles.sheetBtnWrap}>
            <MobileButton
              variant="primary"
              size="md"
              onPress={handleCreateFieldSubmit}
              minHeight={48}
            >
              Guardar Campo
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
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bulkBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  bulkCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  resultCard: {
    padding: 12,
  },
  cardSelectableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: "#135bec",
    backgroundColor: "#135bec",
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  tagBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  tagCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    minHeight: 48,
  },
  tagColorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tagDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tagName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  fieldCard: {
    padding: 14,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  fieldKey: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  fieldFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 6,
  },
  fieldMeta: {
    fontSize: 11,
    color: "#94a3b8",
  },
  qualityCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  qualityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qualityTextWrap: {
    flex: 1,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },
  qualitySub: {
    fontSize: 12,
    color: "#15803d",
    marginTop: 2,
  },
  dupCard: {
    padding: 14,
  },
  dupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  dupName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  dupReason: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 12,
  },
  dupActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  sheetContent: {
    paddingVertical: 12,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
  },
  tagOptionsGrid: {
    gap: 8,
  },
  tagChoice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  tagChoiceActive: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  tagChoiceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  tagChoiceTextActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  sheetBtnWrap: {
    marginTop: 20,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  colorsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: "#0f172a",
  },
});
