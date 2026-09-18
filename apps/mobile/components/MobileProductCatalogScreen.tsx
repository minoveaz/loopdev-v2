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
  Package,
  Boxes,
  Plus,
  Check,
  ChevronDown,
  Archive,
  Tag,
  Globe,
} from "lucide-react-native";
import { localCatalogAdapter } from "@/loopdev/domains/catalog/adapter";
import { LOCAL_CATALOG_ORGANIZATION_ID } from "@/loopdev/domains/catalog/data/localCatalog";
import type {
  CatalogItem,
  OrganizationCatalog,
} from "@/loopdev/domains/catalog";
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

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals / Sheets
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [archiveTargetItem, setArchiveTargetItem] = useState<CatalogItem | null>(null);

  // Form State
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newType, setNewType] = useState<CatalogItem["type"]>("physical_product");
  const [newCategory, setNewCategory] = useState("Hardware");
  const [newPrice, setNewPrice] = useState("499");
  const [newDescription, setNewDescription] = useState("");

  const loadCatalogs = async () => {
    try {
      setLoading(true);
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
    } catch (err) {
      console.error("Error loading catalogs:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    if (!selectedCatalog) return;
    try {
      setItemsLoading(true);
      const loaded = await localCatalogAdapter.listCatalogItems({
        organizationId: LOCAL_CATALOG_ORGANIZATION_ID,
        catalogId: selectedCatalog.id,
        includeArchived: true,
      });
      setItems(loaded);
    } catch (err) {
      console.error("Error loading catalog items:", err);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalogs();
  }, [initialCatalogId]);

  useEffect(() => {
    if (selectedCatalog) {
      void loadItems();
    }
  }, [selectedCatalog]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.key.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [items, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    return {
      all: items.length,
      active: items.filter((i) => i.status === "active").length,
      draft: items.filter((i) => i.status === "draft").length,
      archived: items.filter((i) => i.status === "archived").length,
    };
  }, [items]);

  const handleCreateSubmit = async () => {
    if (!selectedCatalog) return;
    if (!newName.trim()) {
      Alert.alert("Campo Requerido", "Por favor ingresa un nombre para el producto.");
      return;
    }

    try {
      const key =
        newSku.trim() ||
        newName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      await localCatalogAdapter.createCatalogItem({
        organizationId: LOCAL_CATALOG_ORGANIZATION_ID,
        catalogId: selectedCatalog.id,
        name: newName.trim(),
        key,
        sku: newSku.trim() || undefined,
        type: newType,
        categoryKey: newCategory,
        status: "active",
        channels: ["b2b_direct", "web"],
        description: newDescription.trim() || undefined,
      });

      setCreateSheetOpen(false);
      setNewName("");
      setNewSku("");
      setNewDescription("");
      Alert.alert("Producto Creado", `"${newName}" ha sido añadido al catálogo.`);
      await loadItems();
    } catch (err: any) {
      Alert.alert("Error al Crear", err?.message || "No se pudo guardar el ítem.");
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTargetItem) return;
    try {
      await localCatalogAdapter.archiveCatalogItem({
        organizationId: LOCAL_CATALOG_ORGANIZATION_ID,
        catalogId: archiveTargetItem.catalogId,
        itemId: archiveTargetItem.id,
      });
      setArchiveTargetItem(null);
      setDetailItem(null);
      Alert.alert("Archivado", `"${archiveTargetItem.name}" fue archivado.`);
      await loadItems();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo archivar.");
    }
  };

  // Status tabs (Strictly NO pills)
  const tabs = [
    { id: "all", label: "Todos", count: statusCounts.all },
    { id: "active", label: "Activos", count: statusCounts.active },
    { id: "draft", label: "Borradores", count: statusCounts.draft },
    { id: "archived", label: "Archivados", count: statusCounts.archived },
  ];

  return (
    <MobilePageContainer>
      {/* Canonical Header with Catalog Selector */}
      <MobilePageHeader
        title={selectedCatalog ? selectedCatalog.name : "Catálogo ERP"}
        subtitle="CATÁLOGO & PRODUCTOS"
        onBack={onBack}
        rightAction={
          <View style={styles.headerActions}>
            <MobileButton
              variant="secondary"
              size="sm"
              icon={ChevronDown}
              onPress={() => setCatalogPickerOpen(true)}
              minHeight={36}
            >
              Catálogos
            </MobileButton>
            <MobileButton
              variant="primary"
              size="sm"
              icon={Plus}
              onPress={() => setCreateSheetOpen(true)}
              minHeight={36}
            >
              Nuevo
            </MobileButton>
          </View>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <MobileSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre, SKU o clave..."
          onClear={() => setSearchQuery("")}
        />
      </View>

      {/* Canonical Horizontal Tabs (NO PILLS) */}
      <MobilePageTabs
        tabs={tabs}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
      />

      {/* Items List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {loading || itemsLoading ? (
            <MobileLoadingState message="Cargando catálogo de productos..." />
          ) : filteredItems.length === 0 ? (
            <MobileEmptyState
              title="No hay productos en esta vista"
              description={
                searchQuery
                  ? "Prueba con otros términos de búsqueda."
                  : "Agrega nuevos productos o servicios con el botón superior (+)."
              }
              actionLabel={searchQuery ? "Limpiar filtro" : "Crear Producto"}
              onAction={() => {
                if (searchQuery) setSearchQuery("");
                else setCreateSheetOpen(true);
              }}
            />
          ) : (
            filteredItems.map((item) => {
              const typeLabel =
                ITEM_TYPES.find((t) => t.key === item.type)?.label || item.type;
              const isArchived = item.status === "archived";

              return (
                <MobileCard key={item.id} style={styles.itemCard}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ver detalle de ${item.name}`}
                    onPress={() => setDetailItem(item)}
                    style={({ pressed }) => [styles.cardPressableArea, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardTitleWrap}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemSku}>SKU: {item.sku || item.key}</Text>
                      </View>
                      <MobileStatusBadge
                        status={
                          item.status === "active"
                            ? "success"
                            : item.status === "draft"
                            ? "warning"
                            : "neutral"
                        }
                        label={item.status.toUpperCase()}
                        size="sm"
                      />
                    </View>

                    {/* Metadata tags */}
                    <View style={styles.metaRow}>
                      <View style={styles.tagItem}>
                        <Tag size={11} color="#64748b" />
                        <Text style={styles.tagItemText}>{item.categoryKey || "General"}</Text>
                      </View>
                      <View style={styles.tagItem}>
                        <Package size={11} color="#135bec" />
                        <Text style={[styles.tagItemText, { color: "#135bec", fontWeight: "700" }]}>
                          {typeLabel}
                        </Text>
                      </View>
                      {item.channels && item.channels.length > 0 && (
                        <View style={styles.tagItem}>
                          <Globe size={11} color="#64748b" />
                          <Text style={styles.tagItemText}>{item.channels.join(" · ")}</Text>
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

      {/* Bottom Sheet: Catalog Picker */}
      <MobileBottomSheet
        visible={catalogPickerOpen}
        onClose={() => setCatalogPickerOpen(false)}
        title="Seleccionar Catálogo ERP"
      >
        <View style={styles.sheetBody}>
          {catalogs.map((c) => {
            const isSelected = selectedCatalog?.id === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  setSelectedCatalog(c);
                  setCatalogPickerOpen(false);
                }}
                style={[styles.catalogChoice, isSelected && styles.catalogChoiceActive]}
              >
                <View>
                  <Text style={[styles.catalogChoiceName, isSelected && styles.catalogChoiceNameActive]}>
                    {c.name}
                  </Text>
                  <Text style={styles.catalogChoiceMeta}>
                    Tipo: {c.kind} · Moneda: {c.currency}
                  </Text>
                </View>
                {isSelected && <Check size={16} color="#135bec" />}
              </Pressable>
            );
          })}
        </View>
      </MobileBottomSheet>

      {/* Bottom Sheet: Item Detail */}
      <MobileBottomSheet
        visible={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        title={detailItem?.name || "Detalle del Producto"}
      >
        {detailItem && (
          <View style={styles.sheetBody}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>SKU / Clave:</Text>
              <Text style={styles.detailValue}>{detailItem.sku || detailItem.key}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tipo:</Text>
              <Text style={styles.detailValue}>
                {ITEM_TYPES.find((t) => t.key === detailItem.type)?.label || detailItem.type}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Categoría:</Text>
              <Text style={styles.detailValue}>{detailItem.categoryKey || "General"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estado:</Text>
              <MobileStatusBadge
                status={
                  detailItem.status === "active"
                    ? "success"
                    : detailItem.status === "draft"
                    ? "warning"
                    : "neutral"
                }
                label={detailItem.status.toUpperCase()}
                size="sm"
              />
            </View>
            {detailItem.description && (
              <View style={styles.descBox}>
                <Text style={styles.detailLabel}>Descripción:</Text>
                <Text style={styles.descText}>{detailItem.description}</Text>
              </View>
            )}

            {detailItem.status !== "archived" && (
              <View style={styles.detailActionRow}>
                <MobileButton
                  variant="destructive"
                  size="md"
                  icon={Archive}
                  onPress={() => setArchiveTargetItem(detailItem)}
                  minHeight={44}
                >
                  Archivar Producto
                </MobileButton>
              </View>
            )}
          </View>
        )}
      </MobileBottomSheet>

      {/* Bottom Sheet: Crear Producto */}
      <MobileBottomSheet
        visible={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        title="Nuevo Producto / Servicio"
      >
        <View style={styles.sheetBody}>
          <Text style={styles.formLabel}>NOMBRE DEL PRODUCTO *</Text>
          <TextInput
            placeholder="Ej. Servidor Blade Enterprise"
            placeholderTextColor="#94a3b8"
            value={newName}
            onChangeText={setNewName}
            style={styles.formInput}
          />

          <Text style={styles.formLabel}>SKU / CÓDIGO</Text>
          <TextInput
            placeholder="SRV-BLD-01"
            placeholderTextColor="#94a3b8"
            value={newSku}
            onChangeText={setNewSku}
            style={styles.formInput}
          />

          <Text style={styles.formLabel}>TIPO DE ÍTEM</Text>
          <View style={styles.typesRow}>
            {ITEM_TYPES.slice(0, 4).map((t) => {
              const isSelected = newType === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setNewType(t.key)}
                  style={[styles.typeChoice, isSelected && styles.typeChoiceActive]}
                >
                  <Text style={[styles.typeChoiceText, isSelected && styles.typeChoiceTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.formLabel}>DESCRIPCIÓN</Text>
          <TextInput
            placeholder="Especificaciones o notas comerciales..."
            placeholderTextColor="#94a3b8"
            value={newDescription}
            onChangeText={setNewDescription}
            multiline
            numberOfLines={2}
            style={[styles.formInput, { minHeight: 60, textAlignVertical: "top" }]}
          />

          <View style={styles.createBtnWrap}>
            <MobileButton
              variant="primary"
              size="md"
              onPress={handleCreateSubmit}
              minHeight={48}
            >
              Guardar en Catálogo
            </MobileButton>
          </View>
        </View>
      </MobileBottomSheet>

      {/* Confirm Dialog: Archivar */}
      <MobileConfirmDialog
        visible={Boolean(archiveTargetItem)}
        title="Archivar Producto"
        message={`¿Estás seguro de que deseas archivar "${archiveTargetItem?.name}"? Dejará de estar disponible para nuevas cotizaciones.`}
        confirmLabel="Archivar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTargetItem(null)}
      />
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  itemCard: {
    padding: 14,
  },
  cardPressableArea: {
    minHeight: 44,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  itemSku: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "monospace",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
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
  sheetBody: {
    paddingVertical: 12,
  },
  catalogChoice: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    marginBottom: 8,
    minHeight: 48,
  },
  catalogChoiceActive: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  catalogChoiceName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  catalogChoiceNameActive: {
    color: "#135bec",
  },
  catalogChoiceMeta: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  descBox: {
    marginTop: 10,
  },
  descText: {
    fontSize: 13,
    color: "#334155",
    marginTop: 4,
    lineHeight: 18,
  },
  detailActionRow: {
    marginTop: 20,
  },
  formLabel: {
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
  typesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChoice: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  typeChoiceActive: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  typeChoiceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  typeChoiceTextActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  createBtnWrap: {
    marginTop: 24,
    marginBottom: 12,
  },
});
