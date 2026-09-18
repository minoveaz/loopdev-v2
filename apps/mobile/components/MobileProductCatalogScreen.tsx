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
  Package,
  Boxes,
  Plus,
  X,
  Check,
  ChevronDown,
  Archive,
  Trash2,
  Edit3,
  Layers,
  Sparkles,
  Tag,
  DollarSign,
  Globe,
  SlidersHorizontal,
} from "lucide-react-native";
import { localCatalogAdapter } from "@/loopdev/domains/catalog/adapter";
import { LOCAL_CATALOG_ORGANIZATION_ID } from "@/loopdev/domains/catalog/data/localCatalog";
import type {
  CatalogItem,
  OrganizationCatalog,
  CatalogItemCreateInput,
} from "@/loopdev/domains/catalog";
import { formatCurrency } from "@/lib/formatters";

interface MobileProductCatalogScreenProps {
  onBack: () => void;
  catalogId?: string;
}

type StatusTab = "all" | "active" | "draft" | "archived";

const ITEM_TYPES: Array<{ key: CatalogItem["type"]; label: string }> = [
  { key: "physical_product", label: "Producto Físico" },
  { key: "service", label: "Servicio" },
  { key: "subscription", label: "Suscripción" },
  { key: "coverage", label: "Cobertura" },
  { key: "package", label: "Paquete" },
  { key: "digital_product", label: "Digital" },
];

export function MobileProductCatalogScreen({
  onBack,
  catalogId: initialCatalogId,
}: MobileProductCatalogScreenProps) {
  const [catalogs, setCatalogs] = useState<OrganizationCatalog[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<OrganizationCatalog | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modals
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newType, setNewType] = useState<CatalogItem["type"]>("physical_product");
  const [newCategory, setNewCategory] = useState("Hardware");
  const [newPrice, setNewPrice] = useState("499");
  const [newCurrency, setNewCurrency] = useState("EUR");
  const [newDescription, setNewDescription] = useState("");

  const loadCatalogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await localCatalogAdapter.listCatalogs({
        organizationId: LOCAL_CATALOG_ORGANIZATION_ID,
      });
      setCatalogs(loaded);
      if (loaded.length > 0) {
        const found = initialCatalogId
          ? loaded.find((c) => c.id === initialCatalogId) || loaded[0]
          : loaded[0];
        setSelectedCatalog(found);
      }
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar los catálogos.");
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    if (!selectedCatalog) return;
    try {
      setItemsLoading(true);
      const loadedItems = await localCatalogAdapter.listCatalogItems({
        organizationId: LOCAL_CATALOG_ORGANIZATION_ID,
        catalogId: selectedCatalog.id,
        includeArchived: true,
      });
      setItems(loadedItems);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudieron cargar los productos.");
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, [initialCatalogId]);

  useEffect(() => {
    loadItems();
  }, [selectedCatalog]);

  const categories = useMemo(() => {
    const list = Array.from(
      new Set(items.map((i) => i.categoryKey).filter((c): c is string => Boolean(c)))
    );
    return ["all", ...list];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchQuery =
        !searchQuery.trim() ||
        `${item.name} ${item.sku || ""} ${item.key}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === "all" ? true : item.status === statusFilter;
      const matchCategory =
        selectedCategory === "all" ? true : item.categoryKey === selectedCategory;
      return matchQuery && matchStatus && matchCategory;
    });
  }, [items, searchQuery, statusFilter, selectedCategory]);

  const statusCounts = useMemo(() => {
    return {
      all: items.length,
      active: items.filter((i) => i.status === "active").length,
      draft: items.filter((i) => i.status === "draft").length,
      archived: items.filter((i) => i.status === "archived").length,
    };
  }, [items]);

  const handleCreateSubmit = async () => {
    if (!newName.trim()) {
      Alert.alert("Requerido", "Por favor ingresa el nombre del producto.");
      return;
    }
    if (!selectedCatalog) return;

    try {
      const key = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const itemInput: CatalogItemCreateInput = {
        organizationId: LOCAL_CATALOG_ORGANIZATION_ID,
        catalogId: selectedCatalog.id,
        key,
        sku: newSku.trim() || key.toUpperCase(),
        name: newName.trim(),
        type: newType,
        categoryKey: newCategory,
        description: newDescription.trim() || undefined,
        status: "active",
        channels: selectedCatalog.channels || ["Direct sales", "Online"],
      };

      await localCatalogAdapter.createCatalogItem(itemInput);
      setCreateModalOpen(false);
      setNewName("");
      setNewSku("");
      setNewDescription("");
      Alert.alert("Producto Creado", "El elemento ha sido añadido al catálogo.");
      await loadItems();
    } catch (err: any) {
      Alert.alert("Error al Crear", err?.message || "No se pudo crear el elemento.");
    }
  };

  const handleArchiveItem = async (item: CatalogItem) => {
    try {
      await localCatalogAdapter.archiveCatalogItem({
        organizationId: LOCAL_CATALOG_ORGANIZATION_ID,
        catalogId: item.catalogId,
        itemId: item.id,
      });
      setDetailItem(null);
      Alert.alert("Archivado", `"${item.name}" fue archivado.`);
      await loadItems();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo archivar.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={18} color="#0f172a" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.eyebrow}>ERP · CATÁLOGO</Text>
          <Pressable
            onPress={() => setCatalogPickerOpen(true)}
            style={styles.catalogSelector}
          >
            <Text style={styles.catalogName} numberOfLines={1}>
              {selectedCatalog ? selectedCatalog.name : "Seleccionar Catálogo"}
            </Text>
            <ChevronDown size={16} color="#64748b" />
          </Pressable>
        </View>
        <Pressable
          onPress={() => setCreateModalOpen(true)}
          style={styles.createButton}
        >
          <Plus size={16} color="#ffffff" />
        </Pressable>
      </View>

      {/* Search & Category Bar */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={15} color="#64748b" />
          <TextInput
            placeholder="Buscar por nombre, SKU o código..."
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

        {/* Status Tabs (Strictly NO pills) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusTabsContainer}
        >
          {(
            [
              { id: "all", label: "Todos" },
              { id: "active", label: "Activos" },
              { id: "draft", label: "Borradores" },
              { id: "archived", label: "Archivados" },
            ] as Array<{ id: StatusTab; label: string }>
          ).map((tab) => {
            const isSelected = statusFilter === tab.id;
            const count = statusCounts[tab.id];
            return (
              <Pressable
                key={tab.id}
                onPress={() => setStatusFilter(tab.id)}
                style={[
                  styles.statusTab,
                  isSelected && styles.statusTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    isSelected && styles.statusTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                <View style={[styles.statusTabBadge, isSelected && styles.statusTabBadgeActive]}>
                  <Text
                    style={[
                      styles.statusTabBadgeText,
                      isSelected && styles.statusTabBadgeTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Items List */}
      <ScrollView contentContainerStyle={styles.listScroll}>
        {loading || itemsLoading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator color="#135bec" />
            <Text style={styles.loadingText}>Cargando catálogo de productos...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.centerWrap}>
            <Boxes size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No hay productos en esta vista</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Prueba con otros términos de búsqueda."
                : "Agrega nuevos productos o servicios con el botón superior (+)."}
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const typeLabel =
              ITEM_TYPES.find((t) => t.key === item.type)?.label || item.type;
            const isArchived = item.status === "archived";
            const isDraft = item.status === "draft";

            return (
              <Pressable
                key={item.id}
                onPress={() => setDetailItem(item)}
                style={[styles.itemCard, isArchived && { opacity: 0.65 }]}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemSku}>SKU: {item.sku || item.key}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isArchived
                        ? styles.statusArchived
                        : isDraft
                        ? styles.statusDraft
                        : styles.statusActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isArchived
                          ? { color: "#64748b" }
                          : isDraft
                          ? { color: "#ca8a04" }
                          : { color: "#15803d" },
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Metadata Ribbons */}
                <View style={styles.metaRow}>
                  <View style={styles.tagWrap}>
                    <Tag size={11} color="#64748b" />
                    <Text style={styles.tagText}>
                      {item.categoryKey || "General"}
                    </Text>
                  </View>
                  <View style={styles.tagWrap}>
                    <Package size={11} color="#135bec" />
                    <Text style={[styles.tagText, { color: "#135bec", fontWeight: "700" }]}>
                      {typeLabel}
                    </Text>
                  </View>
                </View>

                {/* Channels Strip */}
                {item.channels && item.channels.length > 0 && (
                  <View style={styles.channelsRow}>
                    <Globe size={11} color="#94a3b8" />
                    <Text style={styles.channelsText} numberOfLines={1}>
                      {item.channels.join(" · ")}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* CATALOG PICKER MODAL */}
      <Modal visible={catalogPickerOpen} transparent animationType="fade">
        <Pressable
          onPress={() => setCatalogPickerOpen(false)}
          style={styles.modalBackdrop}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Seleccionar Catálogo ERP</Text>
            {catalogs.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  setSelectedCatalog(c);
                  setCatalogPickerOpen(false);
                }}
                style={[
                  styles.pickerItem,
                  selectedCatalog?.id === c.id && styles.pickerItemActive,
                ]}
              >
                <View>
                  <Text style={styles.pickerItemName}>{c.name}</Text>
                  <Text style={styles.pickerItemKind}>Tipo: {c.kind} · Moneda: {c.currency}</Text>
                </View>
                {selectedCatalog?.id === c.id && <Check size={16} color="#135bec" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ITEM DETAIL SHEET */}
      <Modal visible={Boolean(detailItem)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          {detailItem && (
            <View style={styles.detailSheet}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eyebrow}>DETALLE DEL PRODUCTO</Text>
                  <Text style={styles.detailTitle}>{detailItem.name}</Text>
                </View>
                <Pressable onPress={() => setDetailItem(null)}>
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 350, marginVertical: 10 }}>
                <View style={styles.detailField}>
                  <Text style={styles.detailLabel}>SKU / Clave</Text>
                  <Text style={styles.detailValue}>{detailItem.sku || detailItem.key}</Text>
                </View>

                <View style={styles.detailField}>
                  <Text style={styles.detailLabel}>Tipo de Elemento</Text>
                  <Text style={styles.detailValue}>
                    {ITEM_TYPES.find((t) => t.key === detailItem.type)?.label || detailItem.type}
                  </Text>
                </View>

                <View style={styles.detailField}>
                  <Text style={styles.detailLabel}>Categoría</Text>
                  <Text style={styles.detailValue}>{detailItem.categoryKey || "Sin categoría"}</Text>
                </View>

                <View style={styles.detailField}>
                  <Text style={styles.detailLabel}>Canales Habilitados</Text>
                  <Text style={styles.detailValue}>
                    {detailItem.channels?.join(", ") || "Todos"}
                  </Text>
                </View>

                {detailItem.description && (
                  <View style={styles.detailField}>
                    <Text style={styles.detailLabel}>Descripción</Text>
                    <Text style={styles.detailDesc}>{detailItem.description}</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                {detailItem.status !== "archived" && (
                  <Pressable
                    onPress={() => handleArchiveItem(detailItem)}
                    style={styles.archiveBtn}
                  >
                    <Archive size={14} color="#dc2626" />
                    <Text style={styles.archiveBtnText}>Archivar</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => setDetailItem(null)}
                  style={styles.closeDetailBtn}
                >
                  <Text style={styles.closeDetailText}>Cerrar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* CREATE PRODUCT MODAL */}
      <Modal visible={createModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.createSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Elemento de Catálogo</Text>
              <Pressable onPress={() => setCreateModalOpen(false)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Nombre del Producto / Servicio</Text>
              <TextInput
                placeholder="Ej. Servidor Cloud Enterprise"
                placeholderTextColor="#94a3b8"
                value={newName}
                onChangeText={(text) => {
                  setNewName(text);
                  setNewSku(text.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 12));
                }}
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>SKU / Código</Text>
              <TextInput
                placeholder="SKU-1001"
                placeholderTextColor="#94a3b8"
                value={newSku}
                onChangeText={setNewSku}
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>Tipo</Text>
              <View style={styles.typeGrid}>
                {ITEM_TYPES.map((t) => (
                  <Pressable
                    key={t.key}
                    onPress={() => setNewType(t.key)}
                    style={[
                      styles.typeOption,
                      newType === t.key && styles.typeOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        newType === t.key && styles.typeOptionTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Categoría</Text>
              <TextInput
                placeholder="Ej. Hardware, Consultoría, Software"
                placeholderTextColor="#94a3b8"
                value={newCategory}
                onChangeText={setNewCategory}
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>Descripción Comercial</Text>
              <TextInput
                placeholder="Especificaciones o alcance..."
                placeholderTextColor="#94a3b8"
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
                style={[styles.modalInput, { height: 70, textAlignVertical: "top", paddingTop: 8 }]}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setCreateModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateSubmit}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitText}>Crear Elemento</Text>
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
    marginRight: 6,
  },
  headerTitleWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#135bec",
    letterSpacing: 1,
  },
  catalogSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  catalogName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    maxWidth: 220,
  },
  createButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#135bec",
    alignItems: "center",
    justifyContent: "center",
  },
  // Filter Section
  filterSection: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
  },
  // Status Tabs
  statusTabsContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  statusTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  statusTabActive: {
    borderBottomColor: "#135bec",
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  statusTabTextActive: {
    color: "#0f172a",
    fontWeight: "700",
  },
  statusTabBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusTabBadgeActive: {
    backgroundColor: "#eff6ff",
  },
  statusTabBadgeText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
  },
  statusTabBadgeTextActive: {
    color: "#135bec",
  },
  // List
  listScroll: {
    padding: 16,
    gap: 10,
  },
  itemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  itemSku: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#64748b",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  statusDraft: {
    backgroundColor: "#fefce8",
    borderColor: "#fef08a",
  },
  statusArchived: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  tagWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  tagText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  channelsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },
  channelsText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  // Modals & Sheets
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  pickerItemActive: {
    backgroundColor: "#f8faff",
  },
  pickerItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  pickerItemKind: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  detailSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  detailField: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginTop: 2,
  },
  detailDesc: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
    marginTop: 2,
  },
  createSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
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
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  typeOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },
  typeOptionActive: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  typeOptionText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  typeOptionTextActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  archiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
  },
  archiveBtnText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 13,
  },
  closeDetailBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#135bec",
    borderRadius: 10,
    alignItems: "center",
  },
  closeDetailText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
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
