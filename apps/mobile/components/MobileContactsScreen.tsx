import { Building2, CalendarDays, Mail, MapPin, MessageCircle, MoreHorizontal, Phone, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import { Picker } from "@react-native-picker/picker";
import type { ReactNode } from "react";

export type MobileContactPreview = {
  id: string; firstName: string; lastName?: string; companyName?: string; jobTitle?: string;
  preferredChannel?: string; identityStatus?: string; city?: string; stateProvince?: string; country?: string;
  email?: string; phone?: string; updatedAt?: string;
};

export function MobileContactsScreen({ contacts, onCreate }: { contacts: MobileContactPreview[]; onCreate: () => void }) {
  const [query, setQuery] = useState("");
  const [identity, setIdentity] = useState<"all" | "verified" | "pending_identity_review">("all");
  const [channel, setChannel] = useState<"all" | "email" | "phone" | "whatsapp">("all");
  const [sort, setSort] = useState<"updated" | "name">("updated");
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  return <ScrollView contentContainerStyle={styles.content}><View style={styles.heading}><View><Text style={styles.eyebrow}>SALES CRM</Text><Text style={styles.title}>Contacts</Text><Text style={styles.subtitle}>{filteredContacts.length} of {contacts.length} relationship{contacts.length === 1 ? "" : "s"}</Text></View><Pressable accessibilityLabel="Create new contact" accessibilityRole="button" style={styles.button} onPress={onCreate}><Text style={styles.buttonText}>New contact</Text></Pressable></View>
    <View style={styles.toolbar}><View style={styles.search}><Search size={17} color="#64748b" /><TextInput accessibilityLabel="Search contacts" value={query} onChangeText={setQuery} placeholder="Search contacts" placeholderTextColor="#94a3b8" style={styles.searchInput} /></View><Pressable accessibilityLabel="Open contact filters" accessibilityRole="button" onPress={() => setFiltersOpen(true)} style={styles.filterButton}><SlidersHorizontal size={18} color="#475569" /></Pressable></View>
    {filteredContacts.map((contact, index) => <ContactCard key={contact.id} contact={contact} index={index + 1} />)}
    {!filteredContacts.length && <Text style={styles.empty}>{contacts.length ? "No contacts match these filters." : "No contacts yet. Create the first one."}</Text>}
    <FilterSheet visible={filtersOpen} identity={identity} channel={channel} sort={sort} onClose={() => setFiltersOpen(false)} onIdentityChange={setIdentity} onChannelChange={setChannel} onSortChange={setSort} />
  </ScrollView>;
}

function FilterSheet({ visible, identity, channel, sort, onClose, onIdentityChange, onChannelChange, onSortChange }: { visible: boolean; identity: "all" | "verified" | "pending_identity_review"; channel: "all" | "email" | "phone" | "whatsapp"; sort: "updated" | "name"; onClose: () => void; onIdentityChange: (value: "all" | "verified" | "pending_identity_review") => void; onChannelChange: (value: "all" | "email" | "phone" | "whatsapp") => void; onSortChange: (value: "updated" | "name") => void }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.modalBackdrop} onPress={onClose}><View onStartShouldSetResponder={() => true} style={styles.filterSheet}><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Filter contacts</Text><Pressable accessibilityLabel="Close contact filters" onPress={onClose}><X size={22} color="#475569" /></Pressable></View><FilterSelect label="Identity" value={identity} onChange={onIdentityChange}><Picker.Item label="All identities" value="all" /><Picker.Item label="Verified" value="verified" /><Picker.Item label="Pending review" value="pending_identity_review" /></FilterSelect><FilterSelect label="Channel" value={channel} onChange={onChannelChange}><Picker.Item label="All channels" value="all" /><Picker.Item label="Email" value="email" /><Picker.Item label="Phone" value="phone" /><Picker.Item label="WhatsApp" value="whatsapp" /></FilterSelect><FilterSelect label="Sort by" value={sort} onChange={onSortChange}><Picker.Item label="Recently updated" value="updated" /><Picker.Item label="Name" value="name" /></FilterSelect><Pressable style={styles.applyButton} onPress={onClose}><Text style={styles.applyText}>Apply filters</Text></Pressable></View></Pressable></Modal>;
}

function FilterSelect<T extends string>({ label, value, onChange, children }: { label: string; value: T; onChange: (value: T) => void; children: ReactNode }) {
  return <View style={styles.filterControl}><Text style={styles.filterLabel}>{label}</Text><View style={styles.pickerWrap}><Picker accessibilityLabel={label} selectedValue={value} onValueChange={onChange} style={styles.picker}>{children}</Picker></View></View>;
}

function ContactCard({ contact, index }: { contact: MobileContactPreview; index: number }) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() || "Unnamed contact";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const verified = contact.identityStatus === "verified";
  return <View style={styles.card}><View style={styles.cardHeader}><View style={styles.identityRow}><View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View><View style={styles.identityText}><Text style={styles.name} numberOfLines={1}>{name}</Text><Text style={styles.record}>Contact #{index}</Text></View></View><Pressable accessibilityLabel={`Actions for ${name}`} accessibilityRole="button" hitSlop={8} style={styles.more}><MoreHorizontal size={21} color="#64748b" /></Pressable></View>
    <View style={styles.roleRow}><Building2 size={15} color="#64748b" /><Text style={styles.role} numberOfLines={1}>{[contact.companyName, contact.jobTitle].filter(Boolean).join(" · ") || "No company or role"}</Text></View>
    <View style={styles.divider} />
    <Detail icon={contact.preferredChannel === "email" ? Mail : contact.preferredChannel === "phone" ? Phone : MessageCircle} value={contact.preferredChannel ? `${labelChannel(contact.preferredChannel)} · ${contact.email || contact.phone || "No address"}` : contact.email || contact.phone || "No contact channel"} />
    <Detail icon={MapPin} value={[contact.city, contact.stateProvince, contact.country].filter(Boolean).join(", ") || "No location"} />
    <View style={styles.footer}><View style={[styles.status, verified ? styles.verified : styles.pending]}><ShieldCheck size={13} color={verified ? "#15803d" : "#b45309"} /><Text style={[styles.statusText, verified ? styles.verifiedText : styles.pendingText]}>{verified ? "Verified identity" : "Pending review"}</Text></View><View style={styles.updated}><CalendarDays size={13} color="#94a3b8" /><Text style={styles.updatedText}>{formatUpdated(contact.updatedAt)}</Text></View></View>
  </View>;
}

function Detail({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  return <View style={styles.detail}><Icon size={15} color="#64748b" /><Text style={styles.detailText} numberOfLines={1}>{value}</Text></View>;
}
function labelChannel(value: string) { return value === "whatsapp" ? "WhatsApp" : value[0].toUpperCase() + value.slice(1); }
function formatUpdated(value?: string) { return value ? `Updated ${value}` : "Not updated"; }

const styles = StyleSheet.create({
  content: { paddingBottom: 30, paddingHorizontal: 18, paddingTop: 14 }, heading: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 16, marginTop: 12 }, eyebrow: { color: "#135bec", fontSize: 10, fontWeight: "800", letterSpacing: 1.8 }, title: { color: "#111827", fontSize: 32, fontWeight: "800", marginTop: 5 }, subtitle: { color: "#64748b", fontSize: 12, marginTop: 4 }, button: { backgroundColor: "#135bec", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 }, buttonText: { color: "#fff", fontWeight: "800" }, toolbar: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 14 }, search: { alignItems: "center", backgroundColor: "#fff", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, flex: 1, flexDirection: "row", gap: 8, paddingHorizontal: 11 }, searchInput: { color: "#111827", flex: 1, fontSize: 15, minHeight: 42 }, filterButton: { alignItems: "center", backgroundColor: "#fff", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  card: { backgroundColor: "#fff", borderColor: "#e2e8f0", borderRadius: 17, borderWidth: 1, marginBottom: 12, padding: 16, shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 7, shadowOffset: { height: 2, width: 0 }, elevation: 1 }, cardHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }, identityRow: { alignItems: "center", flex: 1, flexDirection: "row", gap: 11 }, avatar: { alignItems: "center", backgroundColor: "#dbeafe", borderRadius: 24, height: 46, justifyContent: "center", width: 46 }, avatarText: { color: "#135bec", fontSize: 15, fontWeight: "800" }, identityText: { flex: 1 }, name: { color: "#111827", fontSize: 17, fontWeight: "800" }, record: { color: "#94a3b8", fontSize: 11, marginTop: 3 }, more: { padding: 2 }, roleRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 14 }, role: { color: "#475569", flex: 1, fontSize: 13, fontWeight: "600" }, divider: { backgroundColor: "#f1f5f9", height: 1, marginVertical: 13 }, detail: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 9 }, detailText: { color: "#64748b", flex: 1, fontSize: 13 }, footer: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 4 }, status: { alignItems: "center", borderRadius: 99, flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 5 }, verified: { backgroundColor: "#f0fdf4" }, pending: { backgroundColor: "#fffbeb" }, statusText: { fontSize: 11, fontWeight: "700" }, verifiedText: { color: "#15803d" }, pendingText: { color: "#b45309" }, updated: { alignItems: "center", flexDirection: "row", gap: 4 }, updatedText: { color: "#94a3b8", fontSize: 11 }, filterSheet: { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20 }, modalBackdrop: { backgroundColor: "rgba(15,23,42,0.38)", flex: 1, justifyContent: "flex-end" }, sheetHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }, sheetTitle: { color: "#111827", fontSize: 20, fontWeight: "800" }, filterControl: { marginBottom: 12 }, filterLabel: { color: "#64748b", fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" }, pickerWrap: { backgroundColor: "#f8fafc", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, minHeight: 48, overflow: "hidden" }, picker: { color: "#1e293b", height: 48, width: "100%" }, applyButton: { alignItems: "center", backgroundColor: "#135bec", borderRadius: 11, marginTop: 10, padding: 14 }, applyText: { color: "#fff", fontSize: 15, fontWeight: "800" }, empty: { color: "#64748b", paddingVertical: 30, textAlign: "center" },
});
