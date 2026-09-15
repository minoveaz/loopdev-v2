import { TextInput, StyleSheet, Text, View } from "react-native";
import type { TipTapDocument } from "../../../packages/contracts/src/notes";

type Props = {
  initialContent: TipTapDocument;
  disabled?: boolean;
  onChange: (value: { content: TipTapDocument; plainTextPreview: string }) => void;
};

export function MobileRichNoteEditor({ initialContent, disabled, onChange }: Props) {
  const initialText = initialContent.content.flatMap((node) => node.content ?? []).map((node) => node.text ?? "").join(" ");
  return <View style={styles.container}>
    <View accessibilityLabel="Rich note formatting tools" style={styles.toolbar}><Text style={styles.tool}>H2</Text><Text style={styles.tool}>B</Text><Text style={styles.tool}>I</Text><Text style={styles.tool}>U</Text><Text style={styles.tool}>•</Text><Text style={styles.tool}>1.</Text><Text style={styles.tool}>☑</Text><Text style={styles.tool}>↶</Text><Text style={styles.tool}>↷</Text></View>
    <TextInput multiline defaultValue={initialText} editable={!disabled} onChangeText={(plainTextPreview) => onChange({ plainTextPreview, content: { type: "doc", content: [{ type: "paragraph", content: plainTextPreview ? [{ type: "text", text: plainTextPreview }] : [] }] } })} placeholder="Write a rich note..." textAlignVertical="top" style={styles.editor} />
  </View>;
}

const styles = StyleSheet.create({ container: { borderColor: "#94a3b8", borderRadius: 7, borderWidth: 1, overflow: "hidden" }, toolbar: { alignItems: "center", backgroundColor: "#f1f5f9", borderBottomColor: "#cbd5e1", borderBottomWidth: 1, flexDirection: "row", gap: 16, padding: 11 }, tool: { color: "#334155", fontSize: 12 }, editor: { color: "#334155", minHeight: 160, padding: 12 }, });
