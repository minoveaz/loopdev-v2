import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NoteMode, NoteRecord, NoteVisibility, TipTapDocument } from "../../../packages/contracts/src/notes";
import { mobileTheme } from "../theme/tokens";
import { MobileRichNoteEditor } from "./MobileRichNoteEditor";
import { MobileModalSheet } from "./MobileModal";

export type MobileNoteDraft = {
  mode: NoteMode;
  title: string;
  body: string;
  visibility: NoteVisibility;
  content: TipTapDocument;
};

type Props = {
  initialNote?: NoteRecord;
  relationLabel: string;
  onCancel: () => void;
  onSave: (draft: MobileNoteDraft) => Promise<void>;
};

const visibilityOptions: NoteVisibility[] = ["private", "team", "organization"];
const visibilityLabels: Record<NoteVisibility, string> = { private: "Private", team: "Team", organization: "Organization" };

export function MobileNoteEditor({ initialNote, relationLabel, onCancel, onSave }: Props) {
  const [mode, setMode] = useState<NoteMode>(initialNote?.mode ?? "quick");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(initialNote?.plainTextPreview ?? "");
  const [richContent, setRichContent] = useState<TipTapDocument>(initialNote?.content ?? { type: "doc", content: [{ type: "paragraph", content: [] }] });
  const [visibility, setVisibility] = useState<NoteVisibility>(initialNote?.visibility ?? "team");
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!body.trim()) {
      setError("Add some content before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        mode,
        title: title.trim(),
        body: body.trim(),
        visibility,
        content: mode === "rich" ? richContent : { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: body.trim() }] }] },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save note.");
    } finally {
      setSaving(false);
    }
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>{initialNote ? "EDIT NOTE" : "NEW NOTE"}</Text><Text style={styles.title}>{mode === "rich" ? "New rich note" : "New quick note"}</Text><Text style={styles.relation}>Related to {relationLabel}</Text></View><Pressable accessibilityRole="button" onPress={onCancel}><X size={20} color="#64748b" /></Pressable></View>
    <View accessibilityRole="tablist" style={styles.modeSwitch}>
      {(["quick", "rich"] as NoteMode[]).map((option) => <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected: mode === option }} onPress={() => setMode(option)} style={[styles.modeButton, mode === option && styles.modeButtonSelected]}><Text style={[styles.modeText, mode === option && styles.modeTextSelected]}>{option === "quick" ? "Quick note" : "Rich note"}</Text></Pressable>)}
    </View>
    <Text style={styles.label}>Title (optional)</Text><TextInput value={title} onChangeText={setTitle} placeholder="Give this note a useful title" style={styles.input} />
    <Text style={styles.label}>Content</Text>{mode === "rich" ? <MobileRichNoteEditor key={initialNote?.id ?? "new-note"} initialContent={richContent} onChange={({ content, plainTextPreview }) => { setRichContent(content); setBody(plainTextPreview); }} /> : <TextInput multiline value={body} onChangeText={setBody} placeholder="Write a quick note..." textAlignVertical="top" style={styles.editor} />}
    <View style={visibilityStyles.field}><Text style={styles.label}>Visibility</Text><Pressable accessibilityLabel="Visibility" accessibilityRole="button" accessibilityState={{ expanded: visibilityOpen }} onPress={() => setVisibilityOpen(true)} style={visibilityStyles.trigger}><Text style={visibilityStyles.value}>{visibilityLabels[visibility]}</Text><ChevronDown size={16} color="#64748b" /></Pressable></View>
    <View style={styles.footer}><Pressable onPress={onCancel} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable disabled={saving} onPress={() => void save()} style={styles.save}><Text style={styles.saveText}>{saving ? "Saving..." : "Save note"}</Text></Pressable></View>
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <MobileModalSheet visible={visibilityOpen} onClose={() => setVisibilityOpen(false)} title="Note visibility">
      <Text style={visibilityStyles.sheetDescription}>Choose who can access this note.</Text>
      {visibilityOptions.map((option) => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ selected: option === visibility }} onPress={() => { setVisibility(option); setVisibilityOpen(false); }} style={[visibilityStyles.sheetOption, option === visibility && visibilityStyles.sheetOptionSelected]}><View><Text style={[visibilityStyles.optionText, option === visibility && visibilityStyles.selectedOptionText]}>{visibilityLabels[option]}</Text><Text style={visibilityStyles.optionDescription}>{option === "private" ? "Only you" : option === "team" ? "Members of your team" : "Everyone in the organization"}</Text></View>{option === visibility ? <Check size={18} color={mobileTheme.colors.primary} /> : null}</Pressable>)}
    </MobileModalSheet>
  </ScrollView>;
}

const visibilityStyles = StyleSheet.create({
  field: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  trigger: { alignItems: "center", backgroundColor: "#f8fafc", borderColor: "#cbd5e1", borderRadius: 9, borderWidth: 1, flex: 1, flexDirection: "row", height: 44, justifyContent: "space-between", marginLeft: 16, paddingHorizontal: 12 },
  value: { color: "#1e293b", fontSize: 14, fontWeight: "600" },
  sheetDescription: { color: "#64748b", fontSize: 14, marginBottom: 12 },
  sheetOption: { alignItems: "center", borderBottomColor: "#e2e8f0", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 58, paddingVertical: 10 },
  sheetOptionSelected: { backgroundColor: "#eff6ff", borderRadius: 9, paddingHorizontal: 12 },
  optionText: { color: "#334155", fontSize: 14 },
  selectedOptionText: { color: "#135bec", fontWeight: "700" },
  optionDescription: { color: "#64748b", fontSize: 12, marginTop: 3 },
  check: { color: "#135bec", fontSize: 18, fontWeight: "800" },
});

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  content: { padding: 18, paddingBottom: 42 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  eyebrow: { color: "#64748b", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#0f172a", fontSize: 22, fontWeight: "900", marginTop: 4 },
  relation: { color: "#64748b", fontSize: 12, marginTop: 5 },
  close: { color: "#64748b", fontSize: 28, lineHeight: 28 },
  modeSwitch: { backgroundColor: "#f1f5f9", borderColor: "#cbd5e1", borderRadius: 8, borderWidth: 1, flexDirection: "row", marginBottom: 18, padding: 3 },
  modeButton: { borderRadius: 6, flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  modeButtonSelected: { backgroundColor: "#fff" },
  modeText: { color: "#64748b", fontSize: 12, textAlign: "center" },
  modeTextSelected: { color: "#0f172a", fontWeight: "800" },
  label: { color: "#475569", fontSize: 11, fontWeight: "800", marginBottom: 6 },
  input: { borderColor: "#94a3b8", borderRadius: 7, borderWidth: 1, color: "#0f172a", marginBottom: 16, paddingHorizontal: 12, paddingVertical: 10 },
  toolbar: { alignItems: "center", backgroundColor: "#f1f5f9", borderColor: "#cbd5e1", borderRadius: 7, borderWidth: 1, flexDirection: "row", gap: 16, marginBottom: 10, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 11 },
  tool: { color: "#334155", fontSize: 12 },
  toolBold: { color: "#334155", fontSize: 13, fontWeight: "900" },
  toolItalic: { color: "#334155", fontSize: 13, fontStyle: "italic" },
  toolUnderline: { color: "#334155", fontSize: 13, textDecorationLine: "underline" },
  editor: { borderColor: "#94a3b8", borderRadius: 7, borderWidth: 1, color: "#334155", minHeight: 140, marginBottom: 16, padding: 12 },
  richEditor: { minHeight: 180 },
  visibilityRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 20 },
  visibility: { backgroundColor: "#f8fafc", borderColor: "#cbd5e1", borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 7 },
  visibilitySelected: { backgroundColor: "#eff6ff", borderColor: "#2563eb" },
  visibilityText: { color: "#475569", fontSize: 11 },
  footer: { flexDirection: "row", gap: 9, justifyContent: "flex-end" },
  cancel: { borderRadius: 7, paddingHorizontal: 16, paddingVertical: 12 },
  cancelText: { color: "#475569", fontWeight: "700" },
  save: { backgroundColor: "#2563eb", borderRadius: 7, paddingHorizontal: 18, paddingVertical: 12 },
  saveText: { color: "#fff", fontWeight: "800" },
  error: { color: "#b91c1c", fontSize: 13, marginTop: 12 },
});
