import React from "react";
import { MoreHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NoteRecord } from "../../../packages/contracts/src/notes";
import { useMobileI18n, type MobileLangCode } from "../i18n";

type Props = {
  note: NoteRecord;
  onOpen: () => void;
  onActions: () => void;
};

const VISIBILITY_LABELS: Record<MobileLangCode, Record<string, string>> = {
  es: {
    private: "Privada",
    team: "Equipo",
    organization: "Organización",
  },
  en: {
    private: "Private",
    team: "Team",
    organization: "Organization",
  },
};

export function MobileNotesCard({ note, onOpen, onActions }: Props) {
  const { lang } = useMobileI18n();
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" onPress={onOpen} style={styles.titleButton}>
          <Text style={styles.title} numberOfLines={1}>
            {note.plainTextPreview.split("\n")[0].slice(0, 48) || (lang === "es" ? "Nota" : "Note")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={lang === "es" ? "Acciones de la nota" : "Note actions"}
          onPress={onActions}
          style={styles.action}
          hitSlop={8}
        >
          <MoreHorizontal size={16} color="#64748b" />
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" onPress={onOpen}>
        <Text numberOfLines={2} style={styles.preview}>
          {note.plainTextPreview}
        </Text>
      </Pressable>

      <View style={styles.chips}>
        <View style={styles.relationBadge}>
          <Text style={styles.relationText}>{note.relations[0]?.label ?? (lang === "es" ? "Relacionado" : "Related")}</Text>
        </View>
        <View style={styles.visibilityBadge}>
          <Text style={styles.visibilityText}>{VISIBILITY_LABELS[lang]?.[note.visibility] || note.visibility}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.meta}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(note.authorName ?? "U").slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{note.authorName ?? (lang === "es" ? "Tú" : "You")}</Text>
          <Text style={styles.updated}>
            {note.mode === "rich" ? (lang === "es" ? "Nota enriquecida" : "Rich note") : (lang === "es" ? "Nota rápida" : "Quick note")} · {new Date(note.updatedAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US")}
          </Text>
        </View>
        <Pressable onPress={onOpen}>
          <Text style={styles.open}>{lang === "es" ? "Ver" : "View"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  top: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleButton: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
  },
  action: {
    padding: 4,
  },
  preview: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  chips: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  relationBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  relationText: {
    color: "#1d4ed8",
    fontSize: 10,
    fontWeight: "700",
  },
  visibilityBadge: {
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  visibilityText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  divider: {
    backgroundColor: "#e2e8f0",
    height: 1,
    marginVertical: 10,
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  avatarText: {
    color: "#1d4ed8",
    fontSize: 10,
    fontWeight: "800",
  },
  author: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
  },
  updated: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 1,
  },
  open: {
    color: "#135bec",
    fontSize: 11,
    fontWeight: "700",
  },
});
