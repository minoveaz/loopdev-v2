import React from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export function MobileSearchBar({
  value,
  onChangeText,
  placeholder = "Buscar...",
  onFilterPress,
  hasActiveFilters = false,
  onClearFilters,
  onClear,
  containerStyle,
  style,
}: MobileSearchBarProps) {
  return (
    <View style={[styles.toolbar, containerStyle, style]}>
      <View style={styles.searchBox}>
        <Search size={17} color={mobileTheme.colors.textMuted} />
        <TextInput
          accessibilityLabel={placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={mobileTheme.colors.textSubtle}
          style={styles.searchInput}
        />
        {value.length > 0 && (
          <Pressable
            accessibilityLabel="Borrar búsqueda"
            onPress={() => { onChangeText(""); onClear?.(); }}
            hitSlop={8}
          >
            <X size={16} color={mobileTheme.colors.textSubtle} />
          </Pressable>
        )}
      </View>

      {hasActiveFilters && onClearFilters ? (
        <Pressable
          accessibilityLabel="Limpiar filtros"
          accessibilityRole="button"
          onPress={onClearFilters}
          style={styles.clearButton}
        >
          <X size={15} color={mobileTheme.colors.textMuted} />
        </Pressable>
      ) : null}

      {onFilterPress ? (
        <Pressable
          accessibilityLabel="Abrir filtros"
          accessibilityRole="button"
          onPress={onFilterPress}
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
        >
          <SlidersHorizontal
            size={18}
            color={hasActiveFilters ? mobileTheme.colors.primary : mobileTheme.colors.textMuted}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 12,
    gap: 8,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: mobileTheme.colors.textMain,
    height: 42,
  },
  clearButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 44,
  },
  filterButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    width: 44,
    height: 44,
  },
  filterButtonActive: {
    borderColor: mobileTheme.colors.primary,
    backgroundColor: mobileTheme.colors.primarySoft,
  },
});
