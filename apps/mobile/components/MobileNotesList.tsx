import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { NoteRecord } from "../../../packages/contracts/src/notes";
import { MobileNotesCard } from "./MobileNotesCard";

type Props = { notes: NoteRecord[]; loading?: boolean; forbidden?: boolean; onCreate: () => void; onOpen: (note: NoteRecord) => void; onDelete: (note: NoteRecord) => void };

export function MobileNotesList({ notes, loading, forbidden, onCreate, onOpen, onDelete }: Props) {
  if (loading) return <Text style={styles.state}>Loading notes...</Text>;
  if (forbidden) return <Text style={styles.state}>Notes are not available in this scope.</Text>;
  return <View>
    <View style={styles.header}><View><Text style={styles.title}>Notes</Text><Text style={styles.subtitle}>Related notes for this contact</Text></View><Pressable accessibilityRole="button" onPress={onCreate} style={styles.create}><Text style={styles.createText}>+ New note</Text></Pressable></View>
    {notes.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No notes yet</Text><Text style={styles.state}>Create the first note for this contact.</Text><Pressable accessibilityRole="button" onPress={onCreate} style={styles.emptyAction}><Text style={styles.createText}>Create note</Text></Pressable></View> : notes.map((note) => <MobileNotesCard key={note.id} note={note} onOpen={() => onOpen(note)} onActions={() => Alert.alert("Note actions", undefined, [{ text: "Edit note", onPress: () => onOpen(note) }, { text: "Copy link" }, { text: "Delete note", style: "destructive", onPress: () => onDelete(note) }, { text: "Cancel", style: "cancel" }])} />)}
  </View>;
}

const styles = StyleSheet.create({ header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }, title: { color: "#0f172a", fontSize: 21, fontWeight: "900" }, subtitle: { color: "#64748b", fontSize: 12, marginTop: 3 }, create: { backgroundColor: "#2563eb", borderRadius: 7, paddingHorizontal: 12, paddingVertical: 10 }, createText: { color: "#fff", fontSize: 12, fontWeight: "800" }, empty: { alignItems: "center", backgroundColor: "#fff", borderColor: "#d7dee8", borderRadius: 10, borderWidth: 1, padding: 22 }, emptyTitle: { color: "#0f172a", fontSize: 16, fontWeight: "800" }, emptyAction: { backgroundColor: "#2563eb", borderRadius: 7, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10 }, state: { color: "#64748b", fontSize: 13, lineHeight: 20 }, });
