import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { NoteRecord } from "../../../packages/contracts/src/notes";
import { MobileNotesCard } from "./MobileNotesCard";
import { useMobileI18n } from "../i18n";

type Props = { notes: NoteRecord[]; loading?: boolean; forbidden?: boolean; onCreate: () => void; onOpen: (note: NoteRecord) => void; onDelete: (note: NoteRecord) => void };

export function MobileNotesList({ notes, loading, forbidden, onCreate, onOpen, onDelete }: Props) {
  const { lang } = useMobileI18n();
  if (loading) return <Text style={styles.state}>{lang === "es" ? "Cargando notas..." : "Loading notes..."}</Text>;
  if (forbidden) return <Text style={styles.state}>{lang === "es" ? "Las notas no están disponibles en este alcance." : "Notes are not available in this scope."}</Text>;
  return <View>
    <View style={styles.header}><View><Text style={styles.title}>{lang === "es" ? "Notas" : "Notes"}</Text><Text style={styles.subtitle}>{lang === "es" ? "Notas relacionadas con este contacto" : "Notes related to this contact"}</Text></View><Pressable accessibilityRole="button" onPress={onCreate} style={styles.create}><Text style={styles.createText}>{lang === "es" ? "+ Nueva nota" : "+ New note"}</Text></Pressable></View>
    {notes.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>{lang === "es" ? "Sin notas aún" : "No notes yet"}</Text><Text style={styles.state}>{lang === "es" ? "Crea la primera nota para este contacto." : "Create the first note for this contact."}</Text><Pressable accessibilityRole="button" onPress={onCreate} style={styles.emptyAction}><Text style={styles.createText}>{lang === "es" ? "Crear nota" : "Create note"}</Text></Pressable></View> : notes.map((note) => <MobileNotesCard key={note.id} note={note} onOpen={() => onOpen(note)} onActions={() => Alert.alert(lang === "es" ? "Acciones de la nota" : "Note actions", undefined, [{ text: lang === "es" ? "Editar nota" : "Edit note", onPress: () => onOpen(note) }, { text: lang === "es" ? "Copiar enlace" : "Copy link" }, { text: lang === "es" ? "Eliminar nota" : "Delete note", style: "destructive", onPress: () => onDelete(note) }, { text: lang === "es" ? "Cancelar" : "Cancel", style: "cancel" }])} />)}
  </View>;
}

const styles = StyleSheet.create({ header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }, title: { color: "#0f172a", fontSize: 21, fontWeight: "900" }, subtitle: { color: "#64748b", fontSize: 12, marginTop: 3 }, create: { backgroundColor: "#2563eb", borderRadius: 7, paddingHorizontal: 12, paddingVertical: 10 }, createText: { color: "#fff", fontSize: 12, fontWeight: "800" }, empty: { alignItems: "center", backgroundColor: "#fff", borderColor: "#d7dee8", borderRadius: 10, borderWidth: 1, padding: 22 }, emptyTitle: { color: "#0f172a", fontSize: 16, fontWeight: "800" }, emptyAction: { backgroundColor: "#2563eb", borderRadius: 7, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10 }, state: { color: "#64748b", fontSize: 13, lineHeight: 20 }, });

