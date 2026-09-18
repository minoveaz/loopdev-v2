import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Package } from "lucide-react-native";
import { MobileBottomSheet } from "../ui/MobileBottomSheet";
import { MobileInput } from "../ui/MobileInput";
import { mobileTheme } from "../../theme/tokens";
import { mobileCatalogAdapter, type CatalogItem } from "../../adapters/catalog";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: CatalogItem) => void;
}

export function MobileCatalogItemPickerSheet({ visible, onClose, onSelect }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      void mobileCatalogAdapter
        .listCatalogItems({ includeArchived: false })
        .then((res: CatalogItem[]) => {
          setItems(res.filter((it: CatalogItem) => it.status === "active"));
        })
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        it.key.toLowerCase().includes(q) ||
        (it.description && it.description.toLowerCase().includes(q)),
    );
  }, [items, search]);

  return (
    <MobileBottomSheet
      visible={visible}
      onClose={onClose}
      title="Insertar Producto del Catálogo"
    >
      <View style={styles.container}>
        <MobileInput
          label="Buscar Producto o Servicio"
          placeholder="Ej. Plan Cloud, Conector ERP..."
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.list}>
          {filtered.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.itemCard, pressed && styles.itemCardPressed]}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Insertar ${item.name}`}
            >
              <View style={styles.iconWrap}>
                <Package size={20} color={mobileTheme.colors.primary} />
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemKey}>{item.key}</Text>
                {item.description ? (
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}

          {filtered.length === 0 && !loading && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No se encontraron productos coincidentes.</Text>
            </View>
          )}
        </View>
      </View>
    </MobileBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 20,
    gap: 12,
  },
  list: {
    gap: 8,
    marginTop: 8,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radii.card,
    padding: 12,
    gap: 12,
  },
  itemCardPressed: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: mobileTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.textMain,
  },
  itemKey: {
    fontSize: 11,
    fontWeight: "600",
    color: mobileTheme.colors.primary,
    marginTop: 1,
  },
  itemDesc: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  empty: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: mobileTheme.colors.textMuted,
  },
});
