import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Package, Plus, Check } from "lucide-react-native";
import { mobileCatalogAdapter as localCatalogAdapter, type CatalogItem } from "../../adapters/catalog";
import { mobileCrmAdapter as loopdevAdapter, type CRMCustomerProduct } from "../../adapters/crm";
import { useT } from "../../i18n";
import {
  MobileCard,
  MobileButton,
  MobileStatusBadge,
  MobileEmptyState,
  MobileBottomSheet,
  MobileSearchBar,
  MobilePageTabs,
} from "../ui";

interface Props {
  contactId: string;
  onViewCatalog?: () => void;
}

export function MobileCustomer360Products({ contactId, onViewCatalog }: Props) {
  const t = useT();
  const [customerProducts, setCustomerProducts] = useState<CRMCustomerProduct[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, setLoading] = useState(false);

  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitAmount, setUnitAmount] = useState("");
  const [status, setStatus] = useState<string>("interested");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cp, cat] = await Promise.all([
        loopdevAdapter.listCustomerProducts(contactId),
        localCatalogAdapter.listCatalogItems({
          organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
          includeArchived: false,
        }),
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
        status: status as any,
      });
      setCustomerProducts((curr) => [created, ...curr]);
      setSheetOpen(false);
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

  const statusTabs = [
    { id: "interested", label: "Interesado" },
    { id: "active", label: "Activo" },
    { id: "churned", label: "Baja" },
  ];

  return (
    <View style={styles.container}>
      {/* Header with Associate Button */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Productos & Servicios ({customerProducts.length})</Text>
          <Text style={styles.cardSubtitle}>Catálogo contratado y soluciones de interés.</Text>
        </View>
        <MobileButton
          variant="primary"
          size="sm"
          icon={Plus}
          onPress={() => setSheetOpen(true)}
          minHeight={36}
        >
          Asociar
        </MobileButton>
      </View>

      {/* Product List */}
      <View style={styles.productsContainer}>
        {customerProducts.length === 0 ? (
          <MobileEmptyState
            title="Sin productos asociados"
            description="Este contacto no tiene productos o licencias contratadas."
            actionLabel="Asociar del Catálogo"
            onAction={() => setSheetOpen(true)}
          />
        ) : (
          <View style={styles.productsList}>
            {customerProducts.map((p) => {
              const catalogItem = catalogItemMap.get(p.catalogItemId);
              return (
                <MobileCard key={p.id} style={styles.productCard}>
                  <View style={styles.productTopRow}>
                    <View style={styles.productIconBox}>
                      <Package size={18} color="#135bec" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {catalogItem?.name || p.catalogItemId}
                      </Text>
                      <Text style={styles.productSku}>SKU: {catalogItem?.key || "N/A"}</Text>
                    </View>
                    <MobileStatusBadge
                      status={
                        p.status === "active"
                          ? "success"
                          : p.status === "interested"
                          ? "warning"
                          : "neutral"
                      }
                      label={p.status.toUpperCase()}
                      size="sm"
                    />
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.quantityText}>Cantidad: {p.quantity}</Text>
                    <Text style={styles.priceText}>
                      {p.totalAmount != null
                        ? `${p.totalAmount.toLocaleString()} ${p.currency || "EUR"}`
                        : "Sin importe fijado"}
                    </Text>
                  </View>
                </MobileCard>
              );
            })}
          </View>
        )}
      </View>

      {/* Bottom Sheet: Associate Product */}
      <MobileBottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Asociar Producto del Catálogo"
      >
        <View style={styles.sheetBody}>
          <Text style={styles.inputLabel}>BUSCAR EN EL CATÁLOGO</Text>
          <MobileSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre o SKU..."
            onClear={() => setSearchQuery("")}
          />

          <Text style={styles.inputLabel}>SELECCIONA UN PRODUCTO *</Text>
          <ScrollView style={styles.catalogScroll} showsVerticalScrollIndicator={false}>
            {filteredCatalog.slice(0, 6).map((item) => {
              const isSelected = item.id === selectedCatalogId;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.catalogChoice, isSelected && styles.catalogChoiceActive]}
                  onPress={() => setSelectedCatalogId(item.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.catalogChoiceTitle, isSelected && styles.catalogChoiceTitleActive]}>
                      {item.name}
                    </Text>
                    <Text style={styles.catalogChoiceSku}>SKU: {item.key}</Text>
                  </View>
                  {isSelected && <Check size={16} color="#135bec" />}
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.inputLabel}>ESTADO DE LA ASOCIACIÓN</Text>
          <MobilePageTabs
            tabs={statusTabs}
            activeTab={status}
            onTabChange={setStatus}
          />

          <View style={styles.amountQtyRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>CANTIDAD</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>IMPORTE UNITARIO (€)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={unitAmount}
                onChangeText={setUnitAmount}
                placeholder="499"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.saveBtnWrap}>
            <MobileButton
              variant="primary"
              size="md"
              disabled={!selectedCatalogId || saving}
              onPress={handleAssociateProduct}
              minHeight={48}
            >
              {saving ? "Asociando..." : "Asociar al Contacto"}
            </MobileButton>
          </View>
        </View>
      </MobileBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  productsContainer: {
    marginTop: 8,
  },
  productsList: {
    gap: 10,
  },
  productCard: {
    padding: 14,
  },
  productTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  productIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  productSku: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "monospace",
    marginTop: 1,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
  },
  quantityText: {
    fontSize: 12,
    color: "#64748b",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  sheetBody: {
    paddingVertical: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 6,
  },
  catalogScroll: {
    maxHeight: 180,
    marginVertical: 4,
  },
  catalogChoice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    marginBottom: 6,
    minHeight: 44,
  },
  catalogChoiceActive: {
    borderColor: "#135bec",
    backgroundColor: "#eff6ff",
  },
  catalogChoiceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  catalogChoiceTitleActive: {
    color: "#135bec",
  },
  catalogChoiceSku: {
    fontSize: 11,
    color: "#64748b",
  },
  amountQtyRow: {
    flexDirection: "row",
    marginTop: 6,
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
  saveBtnWrap: {
    marginTop: 20,
    marginBottom: 12,
  },
});
