import React, { useState, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Check, Search, X } from "lucide-react-native";
import { mobileTheme } from "../../theme/tokens";
import { MobileBottomSheet } from "./MobileBottomSheet";

export interface MobileSelectOption<T extends string = string> {
  id: T;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface MobileSelectSheetProps<T extends string = string> {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: MobileSelectOption<T>[];
  selectedId?: T | null;
  onSelect: (optionId: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function MobileSelectSheet<T extends string = string>({
  visible,
  onClose,
  title,
  subtitle,
  options,
  selectedId,
  onSelect,
  searchable = false,
  searchPlaceholder = "Buscar opción...",
}: MobileSelectSheetProps<T>) {
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const lower = query.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(lower))
    );
  }, [options, query, searchable]);

  return (
    <MobileBottomSheet
      visible={visible}
      onClose={() => {
        setQuery("");
        onClose();
      }}
      title={title}
      subtitle={subtitle}
      maxHeight={500}
    >
      {searchable ? (
        <View style={styles.searchBar}>
          <Search size={15} color={mobileTheme.colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={mobileTheme.colors.textSubtle}
            style={styles.searchInput}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={6}>
              <X size={14} color={mobileTheme.colors.textSubtle} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <ScrollView style={styles.list}>
        {filteredOptions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No se encontraron opciones.</Text>
          </View>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = selectedId === opt.id;
            return (
              <Pressable
                key={opt.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                disabled={opt.disabled}
                onPress={() => {
                  onSelect(opt.id);
                  setQuery("");
                  onClose();
                }}
                style={[
                  styles.optionItem,
                  isSelected && styles.optionItemSelected,
                  opt.disabled && styles.optionDisabled,
                ]}
              >
                {opt.icon ? <View style={styles.iconWrap}>{opt.icon}</View> : null}
                <View style={styles.textWrap}>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {opt.subtitle ? (
                    <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                  ) : null}
                </View>
                {isSelected ? (
                  <Check size={16} color={mobileTheme.colors.primary} strokeWidth={2.5} />
                ) : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </MobileBottomSheet>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderRadius: mobileTheme.radii.md,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: mobileTheme.colors.textHeading,
  },
  list: {
    maxHeight: 360,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: mobileTheme.radii.md,
    borderBottomWidth: 1,
    borderBottomColor: mobileTheme.colors.borderLight,
    gap: 12,
    minHeight: 48,
  },
  optionItemSelected: {
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: mobileTheme.colors.textHeading,
  },
  optionLabelSelected: {
    color: mobileTheme.colors.primary,
    fontWeight: "700",
  },
  optionSubtitle: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
    marginTop: 2,
  },
  empty: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: mobileTheme.colors.textMuted,
  },
});
