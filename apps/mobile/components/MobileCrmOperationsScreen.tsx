import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  ArrowLeft,
  Search,
  Tag,
  Sliders,
  ShieldCheck,
  Plus,
  Check,
  X,
  Filter,
  Layers,
  Sparkles,
  Download,
  Trash2,
  RefreshCw,
} from "lucide-react-native";
import { useCrmOperations } from "@/loopdev/domains/crm/hooks/use-crm-operations";
import type {
  CRMEntityType,
  CRMFieldType,
  CRMVisibility,
  CRMTag,
  CRMCustomFieldDefinition,
} from "@/loopdev/domains/crm/operations/types";
import { mobileContactAdapter } from "../adapters/contact";
import type { PotentialContactDuplicate } from "../../../packages/contracts/src/contact-port";

interface MobileCrmOperationsScreenProps {
  onBack: () => void;
  onNavigateToContact?: (contactId: string) => void;
}

type OperationsTab = "search" | "tags" | "fields" | "duplicates";

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
  const [activeTab, setActiveTab] = useState<OperationsTab>("search");
  const [entityType, setEntityType] = useState<CRMEntityType>("contact");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTagModalOpen, setBulkTagModalOpen] = useState(false);
  const [selectedBulkTag, setSelectedBulkTag] = useState<string>("");

  // Tag creation modal state
  const [createTagModalOpen, setCreateTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [newTagVisibility, setNewTagVisibility] = useState<CRMVisibility>("workspace");

  // Custom Field modal state
  const [createFieldModalOpen, setCreateFieldModalOpen] = useState(false);
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
    error,
    search,
    createTag,
    createCustomField,
    bulkUpdateEntityTags,
    exportCsv,
  } = useCrmOperations(entityType);

  // Load duplicates when tab changes
  useEffect(() => {
    if (activeTab === "duplicates") {
      setLoadingDuplicates(true);
      mobileContactAdapter
        .listContacts({ organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7", limit: 50, cursor: null })
        .then(async (page) => {
          if (page.items.length > 0) {
            const dups = await mobileContactAdapter.findDuplicates(page.items[0]);
            setDuplicateCandidates(dups);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingDuplicates(false));
    }
  }, [activeTab]);

  // Handle Search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(searchQuery, [], [entityType]).catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, entityType, search]);

  const toggleSelectEntity = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApplyTag = async () => {
    if (!selectedBulkTag || selectedIds.length === 0) return;
    try {
      await bulkUpdateEntityTags(selectedIds, [selectedBulkTag], []);
      Alert.alert("Éxito", `Etiqueta aplicada a ${selectedIds.length} registros.`);
      setSelectedIds([]);
      setBulkTagModalOpen(false);
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
      setCreateTagModalOpen(false);
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
      setCreateFieldModalOpen(false);
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

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={18} color="#0f172a" />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.eyebrow}>OPERACIONES CRM</Text>
          <Text style={styles.title}>Calidad & Automatización</Text>
        </View>
        <Pressable onPress={handleExportCsv} style={styles.exportBtn}>
          <Download size={16} color="#135bec" />
        </Pressable>
      </View>

      {/* Segmented Tabs Strip (Strictly NO pills) */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <Pressable
            onPress={() => setActiveTab("search")}
            style={[styles.tabItem, activeTab === "search" && styles.tabItemActive]}
          >
            <Search size={14} color={activeTab === "search" ? "#135bec" : "#64748b"} />
            <Text style={[styles.tabText, activeTab === "search" && styles.tabTextActive]}>
              Búsqueda & Masivas
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("tags")}
            style={[styles.tabItem, activeTab === "tags" && styles.tabItemActive]}
          >
            <Tag size={14} color={activeTab === "tags" ? "#135bec" : "#64748b"} />
            <Text style={[styles.tabText, activeTab === "tags" && styles.tabTextActive]}>
              Etiquetas ({tags.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("fields")}
            style={[styles.tabItem, activeTab === "fields" && styles.tabItemActive]}
          >
            <Sliders size={14} color={activeTab === "fields" ? "#135bec" : "#64748b"} />
            <Text style={[styles.tabText, activeTab === "fields" && styles.tabTextActive]}>
              Campos ({customFields.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("duplicates")}
            style={[styles.tabItem, activeTab === "duplicates" && styles.tabItemActive]}
          >
            <ShieldCheck size={14} color={activeTab === "duplicates" ? "#135bec" : "#64748b"} />
            <Text style={[styles.tabText, activeTab === "duplicates" && styles.tabTextActive]}>
              Duplicados & Calidad
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* TAB 1: BÚSQUEDA & OPERACIONES MASIVAS */}
      {activeTab === "search" && (
        <View style={styles.tabContent}>
          {/* Entity Selector Tabs */}
          <View style={styles.entitySelector}>
            {(["contact", "lead", "opportunity"] as CRMEntityType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  setEntityType(type);
                  setSelectedIds([]);
                }}
                style={[
                  styles.entityTab,
                  entityType === type && styles.entityTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.entityTabText,
                    entityType === type && styles.entityTabTextActive,
                  ]}
                >
                  {type === "contact"
                    ? "Contactos"
                    : type === "lead"
                    ? "Leads"
                    : "Deals"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Search Box */}
          <View style={styles.searchBar}>
            <Search size={16} color="#64748b" />
            <TextInput
              placeholder={`Buscar en ${entityType === "contact" ? "contactos" : entityType === "lead" ? "leads" : "oportunidades"}...`}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <X size={14} color="#94a3b8" />
              </Pressable>
            )}
          </View>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <View style={styles.bulkBar}>
              <Text style={styles.bulkCount}>{selectedIds.length} seleccionados</Text>
              <Pressable
                onPress={() => setBulkTagModalOpen(true)}
                style={styles.bulkActionButton}
              >
                <Tag size={13} color="#ffffff" />
                <Text style={styles.bulkActionText}>Asignar Tag</Text>
              </Pressable>
            </View>
          )}

          {/* Search Results */}
          <ScrollView contentContainerStyle={styles.resultsScroll}>
            {loading ? (
              <View style={styles.centerWrap}>
                <ActivityIndicator color="#135bec" />
                <Text style={styles.loadingText}>Buscando registros...</Text>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.centerWrap}>
                <Layers size={28} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No hay resultados</Text>
                <Text style={styles.emptySubtitle}>Intenta con otros términos de búsqueda.</Text>
              </View>
            ) : (
              results.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleSelectEntity(item.id)}
                    style={[styles.resultCard, isSelected && styles.resultCardSelected]}
                  >
                    <View style={styles.checkboxWrap}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Check size={12} color="#ffffff" />}
                      </View>
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle}>{item.title}</Text>
                      <Text style={styles.resultSubtitle}>{item.subtitle || "Sin detalles"}</Text>
                      {item.tags && item.tags.length > 0 && (
                        <View style={styles.resultTagsRow}>
                          {item.tags.map((t) => (
                            <View key={t} style={styles.tagBadge}>
                              <Text style={styles.tagBadgeText}>{t}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* TAB 2: GESTIÓN DE ETIQUETAS (TAGS) */}
      {activeTab === "tags" && (
        <View style={styles.tabContent}>
          <View style={styles.tabActionHeader}>
            <Text style={styles.sectionTitle}>Etiquetas del Workspace</Text>
            <Pressable
              onPress={() => setCreateTagModalOpen(true)}
              style={styles.primaryActionButton}
            >
              <Plus size={14} color="#ffffff" />
              <Text style={styles.primaryActionText}>Nuevo Tag</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.tagsScroll}>
            {tags.length === 0 ? (
              <View style={styles.centerWrap}>
                <Tag size={28} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No hay tags creados</Text>
                <Text style={styles.emptySubtitle}>Crea tags para clasificar tus cuentas y prospectos.</Text>
              </View>
            ) : (
              tags.map((tag) => (
                <View key={tag.id} style={styles.tagCard}>
                  <View style={styles.tagColorRow}>
                    <View style={[styles.tagDot, { backgroundColor: tag.color || "#135bec" }]} />
                    <Text style={styles.tagName}>{tag.name}</Text>
                  </View>
                  <View style={styles.tagMeta}>
                    <Text style={styles.tagVisibility}>
                      {tag.visibility === "organization"
                        ? "Org"
                        : tag.visibility === "private"
                        ? "Privado"
                        : "Workspace"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* TAB 3: CAMPOS PERSONALIZADOS (CUSTOM FIELDS) */}
      {activeTab === "fields" && (
        <View style={styles.tabContent}>
          <View style={styles.tabActionHeader}>
            <Text style={styles.sectionTitle}>Campos en {entityType.toUpperCase()}</Text>
            <Pressable
              onPress={() => setCreateFieldModalOpen(true)}
              style={styles.primaryActionButton}
            >
              <Plus size={14} color="#ffffff" />
              <Text style={styles.primaryActionText}>Nuevo Campo</Text>
            </Pressable>
          </View>

          <View style={styles.entitySelector}>
            {(["contact", "lead", "opportunity"] as CRMEntityType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => setEntityType(type)}
                style={[
                  styles.entityTab,
                  entityType === type && styles.entityTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.entityTabText,
                    entityType === type && styles.entityTabTextActive,
                  ]}
                >
                  {type === "contact"
                    ? "Contactos"
                    : type === "lead"
                    ? "Leads"
                    : "Deals"}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.fieldsScroll}>
            {customFields.length === 0 ? (
              <View style={styles.centerWrap}>
                <Sliders size={28} color="#94a3b8" />
                <Text style={styles.emptyTitle}>Sin campos personalizados</Text>
                <Text style={styles.emptySubtitle}>Agrega atributos dinámicos a tus registros.</Text>
              </View>
            ) : (
              customFields.map((field) => (
                <View key={field.id} style={styles.fieldCard}>
                  <View style={styles.fieldHeader}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    {field.required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Requerido</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.fieldKey}>Clave: {field.key}</Text>
                  <View style={styles.fieldFooter}>
                    <Text style={styles.fieldTypeBadge}>Tipo: {field.fieldType}</Text>
                    <Text style={styles.fieldScope}>Scope: {field.visibility}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* TAB 4: CALIDAD & DUPLICADOS */}
      {activeTab === "duplicates" && (
        <View style={styles.tabContent}>
          <ScrollView contentContainerStyle={styles.duplicatesScroll}>
            <View style={styles.qualitySummaryBox}>
              <View style={styles.qualityIconWrap}>
                <ShieldCheck size={20} color="#16a34a" />
              </View>
              <View style={styles.qualityTextWrap}>
                <Text style={styles.qualityTitle}>Control de Duplicados & Calidad</Text>
                <Text style={styles.qualitySub}>
                  Detección automática de coincidencias en emails, teléfonos y nombres comerciales.
                </Text>
              </View>
            </View>

            {loadingDuplicates ? (
              <View style={styles.centerWrap}>
                <ActivityIndicator color="#135bec" />
                <Text style={styles.loadingText}>Analizando duplicados...</Text>
              </View>
            ) : duplicateCandidates.length === 0 ? (
              <View style={styles.centerWrap}>
                <Sparkles size={28} color="#16a34a" />
                <Text style={styles.emptyTitle}>Base de datos limpia</Text>
                <Text style={styles.emptySubtitle}>
                  No se encontraron duplicados pendientes de resolución.
                </Text>
              </View>
            ) : (
              duplicateCandidates.map((cand) => (
                <View key={cand.contact.id} style={styles.dupCard}>
                  <View style={styles.dupHeader}>
                    <Text style={styles.dupName}>
                      {cand.contact.firstName} {cand.contact.lastName || ""}
                    </Text>
                    <Text style={styles.dupScore}>Score: {Math.round(cand.score * 100)}%</Text>
                  </View>
                  <Text style={styles.dupChannel}>
                    {cand.contact.email || cand.contact.phone || "Canal no especificado"}
                  </Text>
                  <View style={styles.reasonsList}>
                    {cand.reasons.map((r, idx) => (
                      <Text key={idx} style={styles.reasonItem}>• {r}</Text>
                    ))}
                  </View>
                  <View style={styles.dupActions}>
                    <Pressable
                      onPress={() => {
                        Alert.alert("Descartado", "El candidato fue marcado como no duplicado.");
                        setDuplicateCandidates((prev) =>
                          prev.filter((c) => c.contact.id !== cand.contact.id)
                        );
                      }}
                      style={styles.dismissBtn}
                    >
                      <Text style={styles.dismissBtnText}>Ignorar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (onNavigateToContact) onNavigateToContact(cand.contact.id);
                      }}
                      style={styles.inspectBtn}
                    >
                      <Text style={styles.inspectBtnText}>Ver Contacto</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* CREATE TAG MODAL */}
      <Modal visible={createTagModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Etiqueta</Text>
              <Pressable onPress={() => setCreateTagModalOpen(false)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Nombre de la Etiqueta</Text>
            <TextInput
              placeholder="Ej. VIP Enterprise, En Renovación..."
              placeholderTextColor="#94a3b8"
              value={newTagName}
              onChangeText={setNewTagName}
              style={styles.modalInput}
            />

            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.paletteRow}>
              {TAG_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewTagColor(c)}
                  style={[
                    styles.paletteDot,
                    { backgroundColor: c },
                    newTagColor === c && styles.paletteDotActive,
                  ]}
                >
                  {newTagColor === c && <Check size={12} color="#ffffff" />}
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Visibilidad</Text>
            <View style={styles.scopeRow}>
              {(["workspace", "organization", "private"] as CRMVisibility[]).map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setNewTagVisibility(v)}
                  style={[
                    styles.scopeTab,
                    newTagVisibility === v && styles.scopeTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.scopeTabText,
                      newTagVisibility === v && styles.scopeTabTextActive,
                    ]}
                  >
                    {v === "workspace" ? "Workspace" : v === "organization" ? "Org" : "Privado"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setCreateTagModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateTagSubmit}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitText}>Guardar Tag</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE CUSTOM FIELD MODAL */}
      <Modal visible={createFieldModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Campo Personalizado</Text>
              <Pressable onPress={() => setCreateFieldModalOpen(false)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Nombre del Campo</Text>
            <TextInput
              placeholder="Ej. NIF / CIF, Sector Industrial..."
              placeholderTextColor="#94a3b8"
              value={newFieldLabel}
              onChangeText={(text) => {
                setNewFieldLabel(text);
                setNewFieldKey(text.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
              }}
              style={styles.modalInput}
            />

            <Text style={styles.inputLabel}>Clave del Atributo (slug)</Text>
            <TextInput
              placeholder="clave_interna"
              placeholderTextColor="#94a3b8"
              value={newFieldKey}
              onChangeText={setNewFieldKey}
              style={styles.modalInput}
            />

            <Text style={styles.inputLabel}>Tipo de Dato</Text>
            <View style={styles.typeRow}>
              {(["text", "number", "date", "boolean"] as CRMFieldType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setNewFieldType(t)}
                  style={[
                    styles.typeTab,
                    newFieldType === t && styles.typeTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeTabText,
                      newFieldType === t && styles.typeTabTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setNewFieldRequired(!newFieldRequired)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, newFieldRequired && styles.checkboxActive]}>
                {newFieldRequired && <Check size={12} color="#ffffff" />}
              </View>
              <Text style={styles.checkboxLabel}>Campo obligatorio</Text>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setCreateFieldModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateFieldSubmit}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitText}>Crear Campo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* BULK TAG MODAL */}
      <Modal visible={bulkTagModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asignar Etiqueta Masiva</Text>
              <Pressable onPress={() => setBulkTagModalOpen(false)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Selecciona el tag a asignar a {selectedIds.length} registros seleccionados:
            </Text>
            <ScrollView style={{ maxHeight: 200, marginVertical: 10 }}>
              {tags.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setSelectedBulkTag(t.name)}
                  style={[
                    styles.bulkTagItem,
                    selectedBulkTag === t.name && styles.bulkTagItemActive,
                  ]}
                >
                  <View style={[styles.tagDot, { backgroundColor: t.color || "#135bec" }]} />
                  <Text style={styles.bulkTagText}>{t.name}</Text>
                  {selectedBulkTag === t.name && <Check size={14} color="#135bec" />}
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setBulkTagModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleBulkApplyTag}
                disabled={!selectedBulkTag}
                style={[styles.modalSubmitBtn, !selectedBulkTag && { opacity: 0.5 }]}
              >
                <Text style={styles.modalSubmitText}>Aplicar a Todos</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#135bec",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  exportBtn: {
    padding: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
  },
  // Pestañas (Tabs)
  tabsContainer: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 20,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: "#135bec",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#0f172a",
    fontWeight: "700",
  },
  tabContent: {
    flex: 1,
  },
  entitySelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  entityTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  entityTabActive: {
    borderBottomColor: "#135bec",
  },
  entityTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  entityTabTextActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
  },
  bulkBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkCount: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  bulkActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#135bec",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  bulkActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  resultsScroll: {
    padding: 16,
    gap: 10,
  },
  resultCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    alignItems: "center",
  },
  resultCardSelected: {
    borderColor: "#135bec",
    backgroundColor: "#f8faff",
  },
  checkboxWrap: {
    marginRight: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#135bec",
    borderColor: "#135bec",
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  resultSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  resultTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  tagBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
  },
  // Tags Tab
  tabActionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#135bec",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  tagsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  tagCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tagColorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tagDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tagName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  tagMeta: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagVisibility: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  // Fields Tab
  fieldsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  fieldCard: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  requiredBadge: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    color: "#dc2626",
    fontSize: 10,
    fontWeight: "700",
  },
  fieldKey: {
    fontSize: 11,
    color: "#64748b",
    fontFamily: "monospace",
    marginTop: 4,
  },
  fieldFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  fieldTypeBadge: {
    fontSize: 11,
    color: "#135bec",
    fontWeight: "700",
  },
  fieldScope: {
    fontSize: 11,
    color: "#94a3b8",
  },
  // Duplicates Tab
  duplicatesScroll: {
    padding: 16,
    gap: 12,
  },
  qualitySummaryBox: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 12,
  },
  qualityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  qualityTextWrap: {
    flex: 1,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#15803d",
  },
  qualitySub: {
    fontSize: 11,
    color: "#166534",
    marginTop: 2,
    lineHeight: 16,
  },
  dupCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  dupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dupName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  dupScore: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ca8a04",
  },
  dupChannel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  reasonsList: {
    marginTop: 8,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 6,
  },
  reasonItem: {
    fontSize: 11,
    color: "#475569",
    marginVertical: 1,
  },
  dupActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  dismissBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
  },
  dismissBtnText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "700",
  },
  inspectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#135bec",
    borderRadius: 6,
  },
  inspectBtnText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "700",
  },
  // Modal Common
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: "#0f172a",
  },
  paletteRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 4,
  },
  paletteDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  paletteDotActive: {
    borderWidth: 2,
    borderColor: "#0f172a",
  },
  scopeRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 6,
  },
  scopeTab: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    alignItems: "center",
  },
  scopeTabActive: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  scopeTabText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  scopeTabTextActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  typeRow: {
    flexDirection: "row",
    gap: 6,
    marginVertical: 6,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    alignItems: "center",
  },
  typeTabActive: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  typeTabText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  typeTabTextActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 13,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#135bec",
    borderRadius: 10,
    alignItems: "center",
  },
  modalSubmitText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  bulkTagItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 10,
  },
  bulkTagItemActive: {
    backgroundColor: "#eff6ff",
  },
  bulkTagText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  centerWrap: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748b",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
  },
});
