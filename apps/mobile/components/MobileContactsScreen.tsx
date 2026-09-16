import { Archive, Building2, CalendarDays, CheckSquare, Eye, FileText, Mail, MapPin, MessageCircle, MoreHorizontal, Pencil, Phone, Search, ShieldCheck, SlidersHorizontal, Sparkles, User, Users, X } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import { MobileModalSheet } from "./MobileModal";
import { MobileControlSheet } from "./ui/MobileControlSheet";
import { mobileTheme } from "../theme/tokens";
import { contactActions } from "../../../packages/contracts/src/contact-actions";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";
export type MobileContactPreview = ContactRecord;

export function MobileContactsScreen({ contacts, onCreate, onView, onEdit, onArchive, onDuplicates }: { contacts: MobileContactPreview[]; onCreate: () => void; onView?: (contact: MobileContactPreview) => void; onEdit?: (contact: MobileContactPreview) => void; onArchive?: (contact: MobileContactPreview) => void; onDuplicates?: () => void }) {
  const [query, setQuery] = useState("");
  const [identity, setIdentity] = useState<"all" | "verified" | "pending_identity_review">("all");
  const [channel, setChannel] = useState<"all" | "email" | "phone" | "whatsapp">("all");
  const [sort, setSort] = useState<"updated" | "name">("updated");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<MobileContactPreview | null>(null);

  const activeFilterCount = (identity !== "all" ? 1 : 0) + (channel !== "all" ? 1 : 0) + (sort !== "updated" ? 1 : 0);
  const hasActiveFilters = Boolean(query.trim()) || activeFilterCount > 0;
  const clearFilters = () => { setQuery(""); setIdentity("all"); setChannel("all"); setSort("updated"); };

  const filteredContacts = useMemo(() => contacts
    .filter((contact) => {
      const haystack = [contact.firstName, contact.lastName, contact.email, contact.phone, contact.companyName, contact.jobTitle, contact.city, contact.country].join(" ").toLocaleLowerCase();
      return (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase()))
        && (identity === "all" || contact.identityStatus === identity)
        && (channel === "all" || contact.preferredChannel === channel);
    })
    .sort((left, right) => sort === "name"
      ? `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`)
      : (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "")), [channel, contacts, identity, query, sort]);

  return <ScrollView contentContainerStyle={styles.content}><View style={styles.heading}><View><Text style={styles.eyebrow}>SALES CRM</Text><Text style={styles.title}>Contacts</Text><Text style={styles.subtitle}>{filteredContacts.length} of {contacts.length} relationship{contacts.length === 1 ? "" : "s"}</Text></View><View style={{ gap: 6 }}><Pressable accessibilityLabel="Create new contact" accessibilityRole="button" style={styles.button} onPress={onCreate}><Text style={styles.buttonText}>New contact</Text></Pressable><Pressable accessibilityRole="button" style={styles.reviewButton} onPress={onDuplicates}><Text style={styles.reviewButtonText}>Review duplicates</Text></Pressable></View></View>
    <View style={styles.toolbar}><View style={styles.search}><Search size={17} color="#64748b" /><TextInput accessibilityLabel="Search contacts" value={query} onChangeText={setQuery} placeholder="Search contacts" placeholderTextColor="#94a3b8" style={styles.searchInput} /></View>{hasActiveFilters ? <Pressable accessibilityLabel="Clear contact filters" accessibilityRole="button" onPress={clearFilters} style={filterActionStyles.clearButton}><X size={17} color="#475569" /><Text style={filterActionStyles.clearText}>Clear</Text></Pressable> : null}<Pressable accessibilityLabel="Open contact filters" accessibilityRole="button" onPress={() => setFiltersOpen(true)} style={[styles.filterButton, activeFilterCount > 0 && { backgroundColor: mobileTheme.colors.primarySoft, borderColor: mobileTheme.colors.primary }]}><SlidersHorizontal size={18} color={activeFilterCount > 0 ? mobileTheme.colors.primary : "#475569"} /></Pressable></View>
    {filteredContacts.map((contact, index) => <ContactCard key={contact.id} contact={contact} index={index + 1} onActions={() => setActionTarget(contact)} />)}
    {!filteredContacts.length && <Text style={styles.empty}>{contacts.length ? "No contacts match these filters." : "No contacts yet. Create the first one."}</Text>}

    {/* Universal HubSpot-Style Control Sheet for Contacts */}
    <MobileControlSheet
      visible={filtersOpen}
      onClose={() => setFiltersOpen(false)}
      title="Filtros de Contactos"
      eyebrow="Sales CRM · Contacts Center"
      activeFilterCount={activeFilterCount}
      resultCount={filteredContacts.length}
      onReset={clearFilters}
      onApply={() => setFiltersOpen(false)}
      presets={[
        {
          id: "verified",
          label: "Verificados",
          icon: ShieldCheck,
          active: identity === "verified",
          onSelect: () => setIdentity("verified"),
        },
        {
          id: "pending_review",
          label: "Por Revisar",
          icon: User,
          active: identity === "pending_identity_review",
          onSelect: () => setIdentity("pending_identity_review"),
        },
        {
          id: "whatsapp",
          label: "WhatsApp",
          icon: MessageCircle,
          active: channel === "whatsapp",
          onSelect: () => setChannel("whatsapp"),
        },
        {
          id: "email",
          label: "Email",
          icon: Mail,
          active: channel === "email",
          onSelect: () => setChannel("email"),
        },
        {
          id: "all",
          label: "Todos",
          icon: Users,
          active: activeFilterCount === 0,
          onSelect: clearFilters,
        },
      ]}
    >
      <View style={{ gap: 18 }}>
        {/* Section 1: Estado de Identidad */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: "#64748b", letterSpacing: 1.1 }}>ESTADO DE IDENTIDAD</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { id: "all", label: "Todas las identidades" },
              { id: "verified", label: "Identidad Verificada" },
              { id: "pending_identity_review", label: "Revisión Pendiente" },
            ].map((item) => {
              const selected = identity === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setIdentity(item.id as any)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 10,
                    borderWidth: 1,
                    backgroundColor: selected ? mobileTheme.colors.primary : "#f8fafc",
                    borderColor: selected ? mobileTheme.colors.primary : "#e2e8f0",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: selected ? "#ffffff" : "#1e293b" }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 2: Canal Preferido */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: "#64748b", letterSpacing: 1.1 }}>CANAL PREFERIDO</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
                  onPress={() => setChannel(item.id as any)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 10,
                    borderWidth: 1,
                    backgroundColor: selected ? mobileTheme.colors.primary : "#f8fafc",
                    borderColor: selected ? mobileTheme.colors.primary : "#e2e8f0",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: selected ? "#ffffff" : "#1e293b" }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 3: Ordenación */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: "#64748b", letterSpacing: 1.1 }}>ORDENAR POR</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { id: "updated", label: "Recientemente Actualizado" },
              { id: "name", label: "Nombre (A-Z)" },
            ].map((item) => {
              const selected = sort === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSort(item.id as any)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 10,
                    borderWidth: 1,
                    backgroundColor: selected ? mobileTheme.colors.primary : "#f8fafc",
                    borderColor: selected ? mobileTheme.colors.primary : "#e2e8f0",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: selected ? "#ffffff" : "#1e293b" }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </MobileControlSheet>

    <ContactActionsSheet contact={actionTarget} onClose={() => setActionTarget(null)} onView={() => { if (actionTarget && onView) onView(actionTarget); setActionTarget(null); }} onEdit={() => { if (actionTarget && onEdit) onEdit(actionTarget); setActionTarget(null); }} onArchive={() => { if (actionTarget && onArchive) onArchive(actionTarget); setActionTarget(null); }} />
  </ScrollView>;
}

function ContactCard({ contact, index, onActions }: { contact: MobileContactPreview; index: number; onActions: () => void }) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() || "Unnamed contact";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const verified = contact.identityStatus === "verified";
  return <View style={styles.card}><View style={styles.cardHeader}><View style={styles.identityRow}><View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View><View style={styles.identityText}><Text style={styles.name} numberOfLines={1}>{name}</Text><Text style={styles.record}>Contact #{index}</Text></View></View><Pressable accessibilityLabel={`Actions for ${name}`} accessibilityRole="button" hitSlop={8} onPress={onActions} style={styles.more}><MoreHorizontal size={21} color="#64748b" /></Pressable></View>
    <View style={styles.roleRow}><Building2 size={15} color="#64748b" /><Text style={styles.role} numberOfLines={1}>{[contact.companyName, contact.jobTitle].filter(Boolean).join(" · ") || "No company or role"}</Text></View>
    <View style={styles.divider} />
    <Detail icon={contact.preferredChannel === "email" ? Mail : contact.preferredChannel === "phone" ? Phone : MessageCircle} value={contact.preferredChannel ? `${labelChannel(contact.preferredChannel)} · ${contact.email || contact.phone || "No address"}` : contact.email || contact.phone || "No contact channel"} />
    <Detail icon={MapPin} value={[contact.city, contact.stateProvince, contact.country].filter(Boolean).join(", ") || "No location"} />
    <View style={styles.footer}><View style={[styles.status, verified ? styles.verified : styles.pending]}><ShieldCheck size={13} color={verified ? "#15803d" : "#b45309"} /><Text style={[styles.statusText, verified ? styles.verifiedText : styles.pendingText]}>{verified ? "Verified identity" : "Pending review"}</Text></View><View style={styles.updated}><CalendarDays size={13} color="#94a3b8" /><Text style={styles.updatedText}>{formatUpdated(contact.updatedAt)}</Text></View></View>
  </View>;
}

function ContactActionsSheet({ contact, onClose, onView, onEdit, onArchive }: { contact: MobileContactPreview | null; onClose: () => void; onView: () => void; onEdit: () => void; onArchive: () => void }) {
  const name = contact ? [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() || "contact" : "contact";
  return <MobileModalSheet visible={Boolean(contact)} onClose={onClose} title={`${name} actions`}>
    <Pressable accessibilityRole="button" onPress={onView} style={styles.actionItem}><EyeIcon /><Text style={styles.actionText}>{contactActions[0].label}</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={onEdit} style={styles.actionItem}><PencilIcon /><Text style={styles.actionText}>{contactActions[1].label}</Text></Pressable>
    <Pressable accessibilityRole="button" disabled style={[styles.actionItem, styles.disabledAction]}><NoteIcon /><Text style={styles.actionText}>{contactActions[2].label}</Text><Text style={styles.unavailableText}>Unavailable</Text></Pressable>
    <Pressable accessibilityRole="button" disabled style={[styles.actionItem, styles.disabledAction]}><TaskIcon /><Text style={styles.actionText}>{contactActions[3].label}</Text><Text style={styles.unavailableText}>Unavailable</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={onArchive} style={[styles.actionItem, styles.destructiveAction]}><ArchiveIcon /><Text style={[styles.actionText, styles.destructiveText]}>{contactActions[4].label}</Text></Pressable>
  </MobileModalSheet>;
}

function EyeIcon() { return <Eye color="#475569" size={18} />; }
function PencilIcon() { return <Pencil color="#475569" size={18} />; }
function ArchiveIcon() { return <Archive color="#475569" size={18} />; }
function NoteIcon() { return <FileText color="#475569" size={18} />; }
function TaskIcon() { return <CheckSquare color="#475569" size={18} />; }

function Detail({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  return <View style={styles.detail}><Icon size={15} color="#64748b" /><Text style={styles.detailText} numberOfLines={1}>{value}</Text></View>;
}
function labelChannel(value: string) { return value === "whatsapp" ? "WhatsApp" : value[0].toUpperCase() + value.slice(1); }
function formatUpdated(value?: string | null) { return value ? `Updated ${value.slice(0, 10)}` : "Not updated"; }

const webFilterStyles = StyleSheet.create({
  picker: { alignItems: "center", backgroundColor: "#f8fafc", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 48, paddingHorizontal: 12 },
  pickerText: { color: "#1e293b", fontSize: 15 },
  options: { backgroundColor: "#fff", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, marginTop: 4, overflow: "hidden" },
  option: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  selectedOption: { backgroundColor: "#eff6ff" },
  optionText: { color: "#334155", fontSize: 14 },
  selectedOptionText: { color: "#135bec", fontWeight: "700" },
});

const filterActionStyles = StyleSheet.create({
  clearButton: { alignItems: "center", flexDirection: "row", gap: 4, paddingHorizontal: 2 },
  clearText: { color: "#475569", fontSize: 12, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 10, marginTop: 10 },
  clearAllButton: { alignItems: "center", borderColor: "#cbd5e1", borderRadius: 11, borderWidth: 1, justifyContent: "center", paddingHorizontal: 16 },
  clearAllText: { color: "#475569", fontSize: 14, fontWeight: "800" },
  applyButton: { alignItems: "center", backgroundColor: "#135bec", borderRadius: 11, flex: 1, justifyContent: "center", padding: 14 },
  applyText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});

const styles = StyleSheet.create({
  content: { paddingBottom: 30, paddingHorizontal: 18, paddingTop: 14 }, heading: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 16, marginTop: 12 }, eyebrow: { color: "#135bec", fontSize: 10, fontWeight: "800", letterSpacing: 1.8 }, title: { color: "#111827", fontSize: 32, fontWeight: "800", marginTop: 5 }, subtitle: { color: "#64748b", fontSize: 12, marginTop: 4 }, button: { backgroundColor: "#135bec", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 }, buttonText: { color: "#fff", fontWeight: "800" }, toolbar: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 14 }, search: { alignItems: "center", backgroundColor: "#fff", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, flex: 1, flexDirection: "row", gap: 8, paddingHorizontal: 11 }, searchInput: { color: "#111827", flex: 1, fontSize: 15, minHeight: 42 }, clearButton: { alignItems: "center", flexDirection: "row", gap: 4, paddingHorizontal: 2 }, clearText: { color: "#475569", fontSize: 12, fontWeight: "800" }, filterButton: { alignItems: "center", backgroundColor: "#fff", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  reviewButton: { alignItems: "center", borderColor: "#bfdbfe", borderRadius: 9, borderWidth: 1, padding: 8 }, reviewButtonText: { color: "#135bec", fontSize: 11, fontWeight: "800" }, card: { backgroundColor: "#fff", borderColor: "#e2e8f0", borderRadius: 17, borderWidth: 1, boxShadow: "0px 2px 7px rgba(15,23,42,0.04)", elevation: 1, marginBottom: 12, padding: 16 }, cardHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }, identityRow: { alignItems: "center", flex: 1, flexDirection: "row", gap: 11 }, avatar: { alignItems: "center", backgroundColor: "#dbeafe", borderRadius: 24, height: 46, justifyContent: "center", width: 46 }, avatarText: { color: "#135bec", fontSize: 15, fontWeight: "800" }, identityText: { flex: 1 }, name: { color: "#111827", fontSize: 17, fontWeight: "800" }, record: { color: "#94a3b8", fontSize: 11, marginTop: 3 }, more: { padding: 2 }, actionItem: { alignItems: "center", borderBottomColor: "#e2e8f0", borderBottomWidth: 1, flexDirection: "row", gap: 12, minHeight: 54, paddingHorizontal: 4 }, actionIcon: { color: "#475569", fontSize: 18, width: 24 }, actionText: { color: "#1e293b", flex: 1, fontSize: 15, fontWeight: "700" }, destructiveAction: { borderBottomColor: "#fee2e2" }, destructiveText: { color: "#dc2626" }, disabledAction: { opacity: 0.45 }, unavailableText: { color: "#94a3b8", fontSize: 11 }, roleRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 14 }, role: { color: "#475569", flex: 1, fontSize: 13, fontWeight: "600" }, divider: { backgroundColor: "#f1f5f9", height: 1, marginVertical: 13 }, detail: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 9 }, detailText: { color: "#64748b", flex: 1, fontSize: 13 }, footer: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 4 }, status: { alignItems: "center", borderRadius: 99, flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 5 }, verified: { backgroundColor: "#f0fdf4" }, pending: { backgroundColor: "#fffbeb" }, statusText: { fontSize: 11, fontWeight: "700" }, verifiedText: { color: "#15803d" }, pendingText: { color: "#b45309" }, updated: { alignItems: "center", flexDirection: "row", gap: 4 }, updatedText: { color: "#94a3b8", fontSize: 11 }, filterSheet: { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20 }, modalOverlay: { flex: 1, justifyContent: "flex-end" }, modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(15,23,42,0.38)" }, sheetHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }, sheetTitle: { color: "#111827", fontSize: 20, fontWeight: "800" }, filterLabel: { color: "#64748b", fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" }, filterControl: { marginBottom: 12 }, pickerWrap: { backgroundColor: "#f8fafc", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, minHeight: 48, overflow: "hidden" }, picker: { color: "#1e293b", height: 48, width: "100%" }, applyButton: { alignItems: "center", backgroundColor: "#135bec", borderRadius: 11, marginTop: 10, padding: 14 }, applyText: { color: "#fff", fontSize: 15, fontWeight: "800" }, empty: { color: "#64748b", paddingVertical: 30, textAlign: "center" },
});
