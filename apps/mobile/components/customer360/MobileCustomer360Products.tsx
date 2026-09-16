import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ChevronRight, Package, PackagePlus, Plus, Search, Tag, X } from "lucide-react-native";
import { mobileCatalogAdapter as localCatalogAdapter, type CatalogItem } from "../../adapters/catalog";
import { mobileCrmAdapter as loopdevAdapter, type CRMCustomerProduct } from "../../adapters/crm";
import { useT } from "../../i18n";

interface Props {
  contactId: string;
  onViewCatalog?: () => void;
}

export function MobileCustomer360Products({ contactId, onViewCatalog }: Props) {
  const t = useT();
  const [customerProducts, setCustomerProducts] = useState<CRMCustomerProduct[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitAmount, setUnitAmount] = useState("");
  const [status, setStatus] = useState<CRMCustomerProduct["status"]>("interested");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cp, cat] = await Promise.all([
        loopdevAdapter.listCustomerProducts(contactId),
        localCatalogAdapter.listCatalogItems({ organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7", includeArchived: false }),
      ]);
      setCustomerProducts(cp);
      setCatalogItems(cat);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [contactId]);

  const handleAssociateProduct = async () => {
    if (!selectedCatalogId) return;
    const qty = parseInt(quantity, 10) || 1;
    const price = unitAmount.trim() ? parseFloat(unitAmount) : null;

    setSaving(true);
    try {
      const created = await loopdevAdapter.createCustomerProduct({
        organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
        contactId,
        catalogItemId: selectedCatalogId,
        offerId: null,
        variantId: null,
        quantity: qty,
        unitAmount: price,
        totalAmount: price !== null ? price * qty : null,
        currency: "EUR",
        sourceOpportunityId: null,
        sourceLeadId: null,
        status,
      });
      setCustomerProducts((curr) => [created, ...curr]);
      setModalOpen(false);
      setSelectedCatalogId("");
      setQuantity("1");
      setUnitAmount("");
      setSearchQuery("");
    } catch (err) {
      console.warn("Error associating product:", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredCatalog = catalogItems.filter(
    (item) =>
      !searchQuery.trim() ||
      `${item.name} ${item.key} ${item.description || ""}`.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const catalogItemMap = new Map(catalogItems.map((c) => [c.id, c]));

  return (
    <View style={styles.container}>
      {/* Header with Associate Button */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{t("crm.customer360.products.title")} ({customerProducts.length})</Text>
          <Text style={styles.cardSubtitle}>{t("crm.customer360.products.subtitle")}</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => setModalOpen(true)}>
          <Plus size={13} color="#135bec" />
          <Text style={styles.addButtonText}>{t("crm.customer360.products.associate")}</Text>
        </Pressable>
      </View>

      {/* Product List */}
      <View style={styles.contentCard}>
        {customerProducts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Package size={28} color="#94a3b8" />
            <Text style={styles.emptyTitle}>{t("crm.customer360.products.noProducts")}</Text>
            <Text style={styles.emptySubtitle}>
              {t("crm.customer360.products.noProductsDesc")}
            </Text>
          </View>
        ) : (
          <View style={styles.productsList}>
            {customerProducts.map((p) => {
              const catalogItem = catalogItemMap.get(p.catalogItemId);
              const isInterested = p.status === "interested";
              const isActive = p.status === "active";
              return (
                <View key={p.id} style={styles.productCard}>
                  <View style={styles.productTopRow}>
                    <View style={styles.productIconBox}>
                      <Package size={18} color="#135bec" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {catalogItem?.name || p.catalogItemId}
                      </Text>
                      <Text style={styles.productSku}>
                        SKU: {catalogItem?.key || "N/A"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        isActive ? styles.badgeActive : isInterested ? styles.badgeInterested : styles.badgeChurned,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isActive ? styles.badgeTextActive : isInterested ? styles.badgeTextInterested : styles.badgeTextChurned,
                        ]}
                      >
                        {p.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.quantityText}>Qty: {p.quantity}</Text>
                    <Text style={styles.priceText}>
                      {p.totalAmount != null ? `${p.totalAmount.toLocaleString()} ${p.currency || "EUR"}` : t("crm.customer360.fields.notRegistered")}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Modal: Associate Product */}
      <Modal visible={modalOpen} animationType="fade" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asociar Producto del Catálogo</Text>
              <Pressable onPress={() => setModalOpen(false)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Buscar producto</Text>
              <View style={styles.searchBar}>
                <Search size={14} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Nombre o SKU del producto..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <Text style={styles.inputLabel}>Selecciona un item *</Text>
              <View style={styles.catalogList}>
                {filteredCatalog.slice(0, 5).map((item) => {
                  const isSelected = item.id === selectedCatalogId;
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.catalogItemRow, isSelected && styles.catalogItemRowSelected]}
                      onPress={() => setSelectedCatalogId(item.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.catalogItemName, isSelected && styles.catalogItemNameSelected]}>
                          {item.name}
                        </Text>
                        <Text style={styles.catalogItemDesc} numberOfLines={1}>
                          {item.key} · {item.description || "Sin descripción"}
                        </Text>
                      </View>
                      {isSelected && <Tag size={15} color="#135bec" />}
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>Cantidad</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>Precio Unitario (€)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    value={unitAmount}
                    onChangeText={setUnitAmount}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Estado comercial</Text>
              <View style={styles.statusPillsRow}>
                {(["interested", "active", "churned"] as const).map((st) => (
                  <Pressable
                    key={st}
                    style={[styles.statusPill, status === st && styles.statusPillActive]}
                    onPress={() => setStatus(st)}
                  >
                    <Text style={[styles.statusPillText, status === st && styles.statusPillTextActive]}>
                      {st === "interested" ? "Interesado" : st === "active" ? "Activo" : "Cancelado"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancel} onPress={() => setModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmit, (!selectedCatalogId || saving) && { opacity: 0.5 }]}
                disabled={!selectedCatalogId || saving}
                onPress={handleAssociateProduct}
              >
                <Text style={styles.modalSubmitText}>{saving ? "Guardando..." : "Asociar"}</Text>
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
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
  contentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
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
  productsList: {
    gap: 8,
  },
  productCard: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  productTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  productIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  productSku: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeActive: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  badgeInterested: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  badgeChurned: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  badgeText: { fontSize: 10, fontWeight: "800" },
  badgeTextActive: { color: "#15803d" },
  badgeTextInterested: { color: "#1d4ed8" },
  badgeTextChurned: { color: "#b91c1c" },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  quantityText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
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
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalScroll: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginTop: 8,
    marginBottom: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 13,
    color: "#0f172a",
  },
  catalogList: {
    gap: 6,
    maxHeight: 160,
  },
  catalogItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  catalogItemRowSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#135bec",
  },
  catalogItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  catalogItemNameSelected: {
    color: "#135bec",
  },
  catalogItemDesc: {
    fontSize: 11,
    color: "#64748b",
  },
  formRow: {
    flexDirection: "row",
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: "#0f172a",
  },
  statusPillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  statusPill: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusPillActive: {
    backgroundColor: "#135bec",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  statusPillTextActive: {
    color: "#ffffff",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
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
