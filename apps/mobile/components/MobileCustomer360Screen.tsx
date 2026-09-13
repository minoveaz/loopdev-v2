import { Archive, ArrowLeft, BriefcaseBusiness, CheckSquare, Clock3, Mail, MapPin, Phone, ShieldCheck, StickyNote, Users } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { contactActions } from "../../../packages/contracts/src/contact-actions";
type Customer360View = any;

type Props = {
  view?: Customer360View;
  loading?: boolean;
  error?: string | null;
  onBack: () => void;
  onEdit?: () => void;
  onArchive?: (contact: Customer360View["contact"]) => void;
};

export function MobileCustomer360Screen({ view, loading, error, onBack, onEdit, onArchive }: Props) {
  if (loading) return <StateScreen title="Loading Customer 360" detail="Reading the shared CRM boundary." onBack={onBack} />;
  if (error) return <StateScreen title="Unable to load contact" detail={error} onBack={onBack} />;
  if (!view) return <StateScreen title="Contact not found" detail="This contact may have been archived." onBack={onBack} />;
  const { contact } = view;
  const name = [contact.preferredName || contact.firstName, contact.lastName, contact.secondLastName].filter(Boolean).join(" ");
  return <ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><ArrowLeft size={17} color="#135bec" /><Text style={styles.backText}>Back to contacts</Text></Pressable>
    <View style={styles.hero}><View style={styles.avatar}><Text style={styles.avatarText}>{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</Text></View><View style={styles.heroCopy}><Text style={styles.eyebrow}>CUSTOMER 360 · {contact.id}</Text><Text style={styles.title}>{name}</Text><Text style={styles.subtitle}>{[contact.jobTitle, contact.companyName].filter(Boolean).join(" · ") || "No role or company recorded"}</Text><Text style={styles.verified}><ShieldCheck size={14} color="#15803d" /> {contact.identityStatus === "verified" ? "Verified identity" : "Pending review"}</Text></View></View>
    <View style={styles.actions}><Pressable accessibilityRole="button" onPress={onEdit} style={styles.edit}><Text style={styles.editText}>Edit contact</Text></Pressable><Pressable accessibilityRole="button" onPress={() => onArchive?.(contact)} style={styles.archive}><Archive size={16} color="#b91c1c" /><Text style={styles.archiveText}>{contactActions[4].label}</Text></Pressable></View>
    <Section title="Profile & identity" icon={<Users size={18} color="#135bec" />}><Detail icon={<Mail size={15} color="#64748b" />} label="Email" value={contact.email || "Not provided"} /><Detail icon={<Phone size={15} color="#64748b" />} label="Phone" value={contact.phone || "Not provided"} /><Detail icon={<MapPin size={15} color="#64748b" />} label="Location" value={[contact.city, contact.stateProvince, contact.country].filter(Boolean).join(", ") || "Not provided"} /></Section>
    <Section title="Leads" icon={<Users size={18} color="#135bec" />}><ListState count={view.leads.length} label="lead" /></Section>
    <Section title="Opportunities" icon={<BriefcaseBusiness size={18} color="#135bec" />}><ListState count={view.opportunities.length} label="opportunity" />{view.opportunities.map((item: any) => <Row key={item.id} label={item.name} value={`${item.stageKey} · ${item.amount ?? "—"}`} />)}</Section>
    <Section title="Tasks" icon={<CheckSquare size={18} color="#135bec" />}><ListState count={view.tasks.length} label="task" /></Section>
    <Section title="Notes" icon={<StickyNote size={18} color="#135bec" />}><ListState count={view.notes.length} label="note" /></Section>
    <Section title="Activity & timeline" icon={<Clock3 size={18} color="#135bec" />}><ListState count={view.timeline.length} label="activity" />{view.timeline.slice(0, 5).map((item: any) => <Row key={item.id} label={item.summary} value={new Date(item.occurredAt).toLocaleDateString()} />)}</Section>
    <Section title="Relations & sales summary" icon={<Users size={18} color="#135bec" />}><Row label="Open opportunities" value={String(view.opportunities.length)} /><Row label="Preferred channel" value={contact.preferredChannel || "Not provided"} /><Row label="Contact ID" value={contact.id} /></Section>
  </ScrollView>;
}

function StateScreen({ title, detail, onBack }: { title: string; detail: string; onBack: () => void }) { return <View style={styles.content}><Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><ArrowLeft size={17} color="#135bec" /><Text style={styles.backText}>Back to contacts</Text></Pressable><View style={styles.state}><Text style={styles.stateTitle}>{title}</Text><Text style={styles.stateDetail}>{detail}</Text></View></View>; }
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <View style={styles.section}><View style={styles.sectionHeader}>{icon}<Text style={styles.sectionTitle}>{title}</Text></View>{children}</View>; }
function ListState({ count, label }: { count: number; label: string }) { return <Text style={styles.stateDetail}>{count ? `${count} ${label}${count === 1 ? "" : "s"} from the shared CRM boundary.` : `No ${label}s associated with this contact.`}</Text>; }
function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <View style={styles.detail}>{icon}<View><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View></View>; }
function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>; }
const styles = StyleSheet.create({ content: { padding: 18, paddingBottom: 40 }, back: { alignItems: "center", flexDirection: "row", gap: 7, marginBottom: 18, paddingVertical: 5 }, backText: { color: "#135bec", fontWeight: "800" }, hero: { alignItems: "center", flexDirection: "row", gap: 14, marginBottom: 16 }, avatar: { alignItems: "center", backgroundColor: "#dbeafe", borderRadius: 34, height: 68, justifyContent: "center", width: 68 }, avatarText: { color: "#135bec", fontSize: 22, fontWeight: "900" }, heroCopy: { flex: 1 }, eyebrow: { color: "#135bec", fontSize: 10, fontWeight: "800", letterSpacing: 1 }, title: { color: "#111827", fontSize: 27, fontWeight: "900" }, subtitle: { color: "#64748b", marginTop: 3 }, verified: { alignItems: "center", color: "#15803d", flexDirection: "row", fontSize: 12, marginTop: 7 }, actions: { flexDirection: "row", gap: 8, marginBottom: 14 }, edit: { backgroundColor: "#dbeafe", borderRadius: 10, padding: 11 }, editText: { color: "#135bec", fontWeight: "800" }, archive: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "#fff1f2", borderRadius: 10, flexDirection: "row", gap: 7, padding: 11 }, archiveText: { color: "#b91c1c", fontWeight: "800" }, section: { backgroundColor: "#fff", borderColor: "#e2e8f0", borderRadius: 15, borderWidth: 1, marginBottom: 12, padding: 15 }, sectionHeader: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 12 }, sectionTitle: { color: "#1e293b", fontSize: 16, fontWeight: "800" }, detail: { alignItems: "center", flexDirection: "row", gap: 9, marginBottom: 11 }, detailLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "700", textTransform: "uppercase" }, detailValue: { color: "#334155", fontSize: 14, marginTop: 2 }, row: { borderBottomColor: "#f1f5f9", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 9 }, rowLabel: { color: "#64748b", flex: 1 }, rowValue: { color: "#334155", fontWeight: "800", maxWidth: "55%", textAlign: "right" }, state: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 14 }, stateTitle: { color: "#475569", fontSize: 15, fontWeight: "800" }, stateDetail: { color: "#64748b", fontSize: 13, lineHeight: 18 } });
