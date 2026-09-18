import React, { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  Eye,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  SlidersHorizontal,
  Trash2,
  Users,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobilePageTabs,
  MobileSearchBar,
  MobileCard,
  MobileButton,
  MobileStatusBadge,
  MobileAvatar,
  MobileEmptyState,
  MobileBottomSheet,
  MobileConfirmDialog,
  MobileSpeedDialBar,
} from "./ui";
import { mobileTheme } from "../theme/tokens";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";

export type MobileContactPreview = ContactRecord;

interface MobileContactsScreenProps {
  contacts: MobileContactPreview[];
  onCreate: () => void;
  onView?: (contact: MobileContactPreview) => void;
  onEdit?: (contact: MobileContactPreview) => void;
  onArchive?: (contact: MobileContactPreview) => void;
  onDuplicates?: () => void;
}

type IdentityTab = "all" | "verified" | "pending_identity_review";
type ChannelFilter = "all" | "whatsapp" | "email" | "phone";
type SortOption = "updated" | "name";

export function MobileContactsScreen({
  contacts,
  onCreate,
  onView,
  onEdit,
  onArchive,
  onDuplicates,
}: MobileContactsScreenProps) {
  const [query, setQuery] = useState("");
  const [identityTab, setIdentityTab] = useState<IdentityTab>("all");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [sort, setSort] = useState<SortOption>("updated");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<MobileContactPreview | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<MobileContactPreview | null>(null);
  const [archiving, setArchiving] = useState(false);

  // Counts for tabs
  const verifiedCount = useMemo(
    () => contacts.filter((c) => c.identityStatus === "verified").length,
    [contacts]
  );
  const pendingCount = useMemo(
    () => contacts.filter((c) => c.identityStatus === "pending_identity_review").length,
    [contacts]
  );

  const tabs = [
    { id: "all", label: "Todos", count: contacts.length },
    { id: "verified", label: "Verificados", count: verifiedCount },
    { id: "pending_identity_review", label: "Por Revisar", count: pendingCount },
  ];

  const activeSecondaryFilterCount = (channel !== "all" ? 1 : 0) + (sort !== "updated" ? 1 : 0);
  const hasActiveFilters = Boolean(query.trim()) || identityTab !== "all" || activeSecondaryFilterCount > 0;

  const clearFilters = () => {
    setQuery("");
    setIdentityTab("all");
    setChannel("all");
    setSort("updated");
  };

  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        const haystack = [
          contact.firstName,
          contact.lastName,
          contact.email,
          contact.phone,
          contact.companyName,
          contact.jobTitle,
          contact.city,
          contact.country,
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!query.trim() || haystack.includes(query.trim().toLowerCase())) &&
          (identityTab === "all" || contact.identityStatus === identityTab) &&
          (channel === "all" || contact.preferredChannel === channel)
        );
      })
      .sort((left, right) => {
        if (sort === "name") {
          return `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`);
        }
        return (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "");
      });
  }, [channel, contacts, identityTab, query, sort]);

  const handleConfirmArchive = async () => {
    if (!archiveTarget || !onArchive) return;
    setArchiving(true);
    try {
      await onArchive(archiveTarget);
      setArchiveTarget(null);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <MobilePageContainer>
      {/* Canonical Header */}
      <MobilePageHeader
        eyebrow="SALES CRM"
        title="Contactos"
        subtitle={`${filteredContacts.length} de ${contacts.length} relaciones`}
        primaryAction={{
          label: "Nuevo",
          onPress: onCreate,
        }}
      />

      {/* Top quick action row */}
      {onDuplicates ? (
        <View style={styles.topActionsRow}>
          <MobileButton
            variant="outline"
            size="sm"
            label="Revisar duplicados"
            icon={<Users size={14} color={mobileTheme.colors.primary} />}
            onPress={onDuplicates}
          />
        </View>
      ) : null}

      {/* Canonical horizontal tabs (strictly NO pills, 2.5px active indicator, badge counts) */}
      <MobilePageTabs
        tabs={tabs}
        activeTab={identityTab}
        onTabChange={(id) => setIdentityTab(id as IdentityTab)}
      />

      {/* Canonical Search Bar with Clear and Filter button */}
      <View style={styles.searchRow}>
        <MobileSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre, email o empresa..."
          onClear={() => setQuery("")}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtros avanzados de contactos"
          onPress={() => setFiltersOpen(true)}
          style={[
            styles.filterButton,
            activeSecondaryFilterCount > 0 && styles.filterButtonActive,
          ]}
        >
          <SlidersHorizontal
            size={18}
            color={activeSecondaryFilterCount > 0 ? mobileTheme.colors.primary : "#64748b"}
          />
          {activeSecondaryFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeSecondaryFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Contacts Cards List */}
      {filteredContacts.length > 0 ? (
        <View style={styles.list}>
          {filteredContacts.map((contact, index) => {
            const fullName =
              [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() ||
              "Contacto sin nombre";
            const roleAndCompany = [contact.jobTitle, contact.companyName]
              .filter(Boolean)
              .join(" · ");
            const location = [contact.city, contact.stateProvince, contact.country]
              .filter(Boolean)
              .join(", ");
            const isVerified = contact.identityStatus === "verified";

            return (
              <MobileCard key={contact.id}>
                {/* Card Header with Avatar & Actions */}
                <View style={styles.cardHeader}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ver perfil de ${fullName}`}
                    onPress={() => onView?.(contact)}
                    style={styles.avatarRow}
                  >
                    <MobileAvatar name={fullName} size="md" />
                    <View style={styles.headerTextWrap}>
                      <Text style={styles.contactName} numberOfLines={1}>
                        {fullName}
                      </Text>
                      <Text style={styles.contactRecord}>Contacto #{index + 1}</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Opciones para ${fullName}`}
                    onPress={() => setActionTarget(contact)}
                    style={styles.moreButton}
                  >
                    <MoreHorizontal size={20} color="#64748b" />
                  </Pressable>
                </View>

                {/* Company / Role */}
                {roleAndCompany ? (
                  <View style={styles.metaRow}>
                    <Building2 size={14} color="#64748b" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {roleAndCompany}
                    </Text>
                  </View>
                ) : null}

                {/* Location */}
                {location ? (
                  <View style={styles.metaRow}>
                    <MapPin size={14} color="#64748b" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {location}
                    </Text>
                  </View>
                ) : null}

                {/* Status and Last Updated */}
                <View style={styles.statusAndDateRow}>
                  <MobileStatusBadge
                    tone={isVerified ? "success" : "warning"}
                    label={isVerified ? "Verificado" : "Por revisar"}
                    dot
                  />
                  {contact.updatedAt ? (
                    <View style={styles.dateWrap}>
                      <CalendarDays size={12} color="#94a3b8" />
                      <Text style={styles.dateText}>
                        {contact.updatedAt.slice(0, 10)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Direct Speed Dial Communication Bar */}
                <View style={styles.dialBarWrapper}>
                  <MobileSpeedDialBar
                    phone={contact.phone || undefined}
                    email={contact.email || undefined}
                    whatsapp={contact.phone || undefined}
                    contactName={fullName}
                  />
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.cardFooterActions}>
                  <MobileButton
                    variant="ghost"
                    size="sm"
                    label="Ver Perfil"
                    icon={<Eye size={14} color={mobileTheme.colors.primary} />}
                    onPress={() => onView?.(contact)}
                  />
                  <MobileButton
                    variant="ghost"
                    size="sm"
                    label="Editar"
                    icon={<Pencil size={14} color="#475569" />}
                    onPress={() => onEdit?.(contact)}
                  />
                </View>
              </MobileCard>
            );
          })}
        </View>
      ) : (
        <MobileEmptyState
          icon={<Users size={32} color={mobileTheme.colors.primary} />}
          title={contacts.length ? "Sin resultados" : "No hay contactos"}
          description={
            contacts.length
              ? "No se encontraron contactos que coincidan con los filtros actuales."
              : "Comienza registrando tu primer cliente o prospecto comercial."
          }
          actionLabel={contacts.length ? "Limpiar filtros" : "Crear contacto"}
          onAction={contacts.length ? clearFilters : onCreate}
        />
      )}

      {/* Advanced Filter Bottom Sheet */}
      <MobileBottomSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros de Contactos"
        footer={
          <View style={styles.filterSheetFooter}>
            <MobileButton
              variant="outline"
              label="Limpiar filtros"
              onPress={clearFilters}
              style={{ flex: 1 }}
            />
            <MobileButton
              variant="primary"
              label="Aplicar"
              onPress={() => setFiltersOpen(false)}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <View style={styles.sheetSection}>
          <Text style={styles.sheetSectionTitle}>CANAL PREFERIDO</Text>
          <View style={styles.sheetOptionsGrid}>
            {[
              { id: "all", label: "Todos los canales" },
              { id: "whatsapp", label: "WhatsApp" },
              { id: "email", label: "Email" },
              { id: "phone", label: "Teléfono" },
            ].map((item) => {
              const selected = channel === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setChannel(item.id as ChannelFilter)}
                  style={[styles.sheetOptionChip, selected && styles.sheetOptionChipSelected]}
                >
                  <Text
                    style={[
                      styles.sheetOptionText,
                      selected && styles.sheetOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sheetSection}>
          <Text style={styles.sheetSectionTitle}>ORDENAR POR</Text>
          <View style={styles.sheetOptionsGrid}>
            {[
              { id: "updated", label: "Recientemente Actualizado" },
              { id: "name", label: "Nombre (A-Z)" },
            ].map((item) => {
              const selected = sort === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSort(item.id as SortOption)}
                  style={[styles.sheetOptionChip, selected && styles.sheetOptionChipSelected]}
                >
                  <Text
                    style={[
                      styles.sheetOptionText,
                      selected && styles.sheetOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </MobileBottomSheet>

      {/* Contact Quick Actions Sheet */}
      <MobileBottomSheet
        visible={actionTarget !== null}
        onClose={() => setActionTarget(null)}
        title={
          actionTarget
            ? [actionTarget.firstName, actionTarget.lastName].filter(Boolean).join(" ").trim() ||
              "Contacto"
            : "Contacto"
        }
      >
        {actionTarget && (
          <View style={styles.actionsList}>
            <Pressable
              accessibilityRole="button"
              style={styles.actionItem}
              onPress={() => {
                const target = actionTarget;
                setActionTarget(null);
                onView?.(target);
              }}
            >
              <Eye size={18} color="#475569" />
              <Text style={styles.actionItemText}>Ver Customer 360</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={styles.actionItem}
              onPress={() => {
                const target = actionTarget;
                setActionTarget(null);
                onEdit?.(target);
              }}
            >
              <Pencil size={18} color="#475569" />
              <Text style={styles.actionItemText}>Editar información</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={[styles.actionItem, styles.actionItemDestructive]}
              onPress={() => {
                const target = actionTarget;
                setActionTarget(null);
                setArchiveTarget(target);
              }}
            >
              <Trash2 size={18} color={mobileTheme.colors.destructive} />
              <Text style={[styles.actionItemText, styles.actionItemTextDestructive]}>
                Archivar contacto
              </Text>
            </Pressable>
          </View>
        )}
      </MobileBottomSheet>

      {/* Canonical Confirmation Dialog for Archiving */}
      <MobileConfirmDialog
        visible={archiveTarget !== null}
        variant="destructive"
        title="¿Archivar contacto?"
        description={`¿Deseas archivar a ${
          archiveTarget
            ? [archiveTarget.firstName, archiveTarget.lastName].filter(Boolean).join(" ")
            : "este contacto"
        }? Esta acción quedará registrada en el historial de auditoría.`}
        confirmLabel="Archivar"
        cancelLabel="Cancelar"
        loading={archiving}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  topActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: mobileTheme.radii.input,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterButtonActive: {
    borderColor: mobileTheme.colors.primary,
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: mobileTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  list: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "700",
    color: mobileTheme.colors.textPrimary,
  },
  contactRecord: {
    fontSize: 12,
    color: mobileTheme.colors.textSecondary,
    marginTop: 2,
  },
  moreButton: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: mobileTheme.colors.textSecondary,
    flex: 1,
  },
  statusAndDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
  },
  dateWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: mobileTheme.colors.textSecondary,
  },
  dialBarWrapper: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
  },
  cardFooterActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 6,
  },
  filterSheetFooter: {
    flexDirection: "row",
    gap: 10,
  },
  sheetSection: {
    marginBottom: 20,
  },
  sheetSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: mobileTheme.colors.textSecondary,
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  sheetOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sheetOptionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: mobileTheme.radii.input,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.background,
    minHeight: 44,
    justifyContent: "center",
  },
  sheetOptionChipSelected: {
    backgroundColor: mobileTheme.colors.primary,
    borderColor: mobileTheme.colors.primary,
  },
  sheetOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: mobileTheme.colors.textPrimary,
  },
  sheetOptionTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  actionsList: {
    gap: 2,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: mobileTheme.radii.input,
  },
  actionItemDestructive: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
    paddingTop: 10,
  },
  actionItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: mobileTheme.colors.textPrimary,
  },
  actionItemTextDestructive: {
    color: mobileTheme.colors.destructive,
  },
});
