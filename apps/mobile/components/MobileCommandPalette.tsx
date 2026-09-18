import {
  BriefcaseBusiness,
  ClipboardList,
  ContactRound,
  CornerDownLeft,
  Handshake,
  MessageCircle,
  PackagePlus,
  Search,
  Target,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ContextualActionContext, SharedContextualAction } from "../../../packages/contracts/src/navigation";
import { getContextualActions } from "../../../packages/contracts/src/navigation";

type MobileCommandPaletteProps = {
  context: ContextualActionContext;
  visible: boolean;
  onClose: () => void;
  onAction: (action: SharedContextualAction) => void;
};

const icons: Record<string, LucideIcon> = {
  contact: ContactRound,
  conversation: MessageCircle,
  crm: BriefcaseBusiness,
  erp: PackagePlus,
  lead: Target,
  opportunity: Handshake,
  order: ClipboardList,
  product: PackagePlus,
};

const SPANISH_ACTION_TRANSLATIONS: Record<string, { label: string; description: string }> = {
  "open-crm": { label: "Abrir CRM", description: "Continuar trabajando con clientes y pipeline." },
  "open-erp": { label: "Abrir ERP", description: "Continuar trabajando con productos y operaciones." },
  "new-contact": { label: "Nuevo contacto", description: "Crear una persona o empresa en CRM." },
  "new-lead": { label: "Nuevo lead", description: "Añadir un cliente potencial al flujo de calificación." },
  "new-opportunity": { label: "Nueva oportunidad", description: "Iniciar el seguimiento de una oportunidad comercial." },
  "new-product": { label: "Nuevo producto", description: "Añadir un artículo al catálogo de productos." },
  "new-order": { label: "Nuevo pedido", description: "Iniciar una nueva orden operativa." },
  "new-conversation": { label: "Nueva conversación", description: "Iniciar un mensaje directo con un cliente o contacto." },
};

const CONTEXT_LABELS: Record<string, string> = {
  launchpad: "INICIO",
  crm: "CRM",
  erp: "ERP",
  conversations: "MENSAJES",
};

export function MobileCommandPalette({
  context,
  visible,
  onClose,
  onAction,
}: MobileCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const actions = useMemo(
    () => getContextualActions(context)
      .map((item) => {
        const trans = SPANISH_ACTION_TRANSLATIONS[item.id];
        return trans ? { ...item, label: trans.label, description: trans.description } : item;
      })
      .filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 5),
    [context, normalizedQuery],
  );

  function close() {
    setQuery("");
    onClose();
  }

  return (
    <Modal animationType="fade" onRequestClose={close} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Cerrar paleta de comandos" accessibilityRole="button" onPress={close} style={styles.backdrop} />
        <View style={styles.palette}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={styles.title}>Acción rápida</Text>
              <Text style={styles.context}>{CONTEXT_LABELS[context] || context.toUpperCase()}</Text>
            </View>
            <Pressable accessibilityLabel="Cerrar paleta de comandos" accessibilityRole="button" onPress={close} style={styles.close}>
              <X color="#64748b" size={18} />
            </Pressable>
          </View>
          <View style={styles.searchRow}>
            <Search color="#64748b" size={18} strokeWidth={2.2} />
            <TextInput
              accessibilityLabel="Buscar acciones contextuales"
              onChangeText={setQuery}
              placeholder="Buscar acciones..."
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={query}
            />
          </View>
          <Text style={styles.sectionLabel}>ACCIONES</Text>
          <View style={styles.actionList}>
            {actions.map((action) => <ActionRow key={action.id} action={action} onPress={() => onAction(action)} />)}
            {actions.length === 0 && <Text style={styles.empty}>No se encontraron acciones.</Text>}
          </View>
          <Text style={styles.hint}>Elige una acción para el contexto actual</Text>
        </View>
      </View>
    </Modal>
  );
}

function ActionRow({ action, onPress }: { action: SharedContextualAction; onPress: () => void }) {
  const Icon = icons[action.iconKey] ?? MessageCircle;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
      <View style={styles.icon}><Icon color="#135bec" size={19} strokeWidth={2.1} /></View>
      <View style={styles.copy}><Text style={styles.label}>{action.label}</Text><Text style={styles.description}>{action.description}</Text></View>
      <CornerDownLeft color="#94a3b8" size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 22 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(15,23,42,0.42)" },
  palette: { backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: 18, borderWidth: 1, boxShadow: "0px 8px 24px rgba(15,23,42,0.22)", elevation: 18, maxWidth: 420, padding: 16, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  heading: { flex: 1 },
  title: { color: "#111827", fontSize: 17, fontWeight: "800" },
  context: { color: "#64748b", fontSize: 9, fontWeight: "800", letterSpacing: 1.5, marginTop: 3 },
  close: { alignItems: "center", borderColor: "#e5e7eb", borderRadius: 15, borderWidth: 1, height: 30, justifyContent: "center", width: 30 },
  searchRow: { alignItems: "center", backgroundColor: "#f8fafc", borderColor: "#e5e7eb", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 46, paddingHorizontal: 12 },
  input: { color: "#111827", flex: 1, fontSize: 14, minHeight: 42 },
  sectionLabel: { color: "#64748b", fontSize: 9, fontWeight: "800", letterSpacing: 1.5, marginBottom: 5, marginTop: 18 },
  actionList: { gap: 3 },
  action: { alignItems: "center", borderRadius: 10, flexDirection: "row", minHeight: 58, paddingHorizontal: 5 },
  icon: { alignItems: "center", backgroundColor: "#eff6ff", borderRadius: 9, height: 36, justifyContent: "center", marginRight: 11, width: 36 },
  copy: { flex: 1, paddingRight: 8 },
  label: { color: "#111827", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  description: { color: "#64748b", fontSize: 11, lineHeight: 16 },
  arrow: { color: "#135bec", fontSize: 19, fontWeight: "700", paddingHorizontal: 5 },
  empty: { color: "#64748b", fontSize: 13, paddingVertical: 18, textAlign: "center" },
  hint: { borderTopColor: "#e5e7eb", borderTopWidth: 1, color: "#94a3b8", fontSize: 10, marginTop: 10, paddingTop: 10 },
});
