import { MoreHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NoteRecord } from "../../../packages/contracts/src/notes";

type Props = { note: NoteRecord; onOpen: () => void; onActions: () => void };

export function MobileNotesCard({ note, onOpen, onActions }: Props) {
  return <View style={styles.card}>
    <View style={styles.top}><Pressable accessibilityRole="button" onPress={onOpen} style={styles.titleButton}><Text style={styles.title}>{note.plainTextPreview.split("\n")[0].slice(0, 48)}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Note actions" onPress={onActions} style={styles.action}><MoreHorizontal size={18} color="#334155" /></Pressable></View>
    <Pressable accessibilityRole="button" onPress={onOpen}><Text numberOfLines={3} style={styles.preview}>{note.plainTextPreview}</Text></Pressable>
    <View style={styles.chips}><Text style={styles.relation}>{note.relations[0]?.label ?? "Related record"}</Text><Text style={styles.visibility}>{note.visibility}</Text></View>
    <View style={styles.divider} />
    <View style={styles.meta}><View style={styles.avatar}><Text style={styles.avatarText}>{(note.authorName ?? "U").slice(0, 1).toUpperCase()}</Text></View><View><Text style={styles.author}>{note.authorName ?? "You"}</Text><Text style={styles.updated}>{note.mode === "rich" ? "Rich note" : "Quick note"} · {new Date(note.updatedAt).toLocaleDateString()}</Text></View><Text style={styles.open}>Open</Text></View>
  </View>;
}

const styles = StyleSheet.create({ card: { backgroundColor: "#fff", borderColor: "#d7dee8", borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 16 }, top: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, titleButton: { flex: 1 }, title: { color: "#0f172a", fontSize: 16, fontWeight: "800" }, action: { alignItems: "center", backgroundColor: "#f8fafc", borderColor: "#d7dee8", borderRadius: 18, borderWidth: 1, height: 36, justifyContent: "center", width: 36 }, preview: { color: "#334155", fontSize: 14, lineHeight: 21, marginTop: 13 }, chips: { flexDirection: "row", gap: 8, marginTop: 13 }, relation: { backgroundColor: "#eff6ff", borderRadius: 13, color: "#1d4ed8", fontSize: 11, fontWeight: "700", overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6 }, visibility: { backgroundColor: "#f1f5f9", borderRadius: 13, color: "#475569", fontSize: 11, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6 }, divider: { backgroundColor: "#e5eaf0", height: 1, marginVertical: 14 }, meta: { alignItems: "center", flexDirection: "row", gap: 9 }, avatar: { alignItems: "center", backgroundColor: "#dbeafe", borderRadius: 14, height: 28, justifyContent: "center", width: 28 }, avatarText: { color: "#1d4ed8", fontSize: 11, fontWeight: "800" }, author: { color: "#334155", fontSize: 12, fontWeight: "700" }, updated: { color: "#64748b", fontSize: 11, marginTop: 2 }, open: { color: "#64748b", fontSize: 11, marginLeft: "auto" }, });
