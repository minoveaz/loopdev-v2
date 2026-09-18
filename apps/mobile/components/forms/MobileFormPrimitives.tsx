import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from "react-native";
import { Building2, Check, ChevronDown, ChevronLeft, ChevronRight, Contact, MapPin, Search, UserRound } from "lucide-react-native";
import type { ContactFormSectionDefinition, ContactSectionStatus } from "../../../../packages/contracts/src/contact-form";

const icons = { user: UserRound, contact: Contact, building: Building2, "map-pin": MapPin } as const;
export type MobileOption = { code: string; label: string };

export const SPANISH_CONTACT_FORM: Record<string, string> = {
  Identity: "Identidad",
  Address: "Dirección",
  Organization: "Organización",
  Channels: "Canales",
  "How this person should be identified in CRM.": "Cómo se identifica a esta persona en el CRM.",
  "Optional location information.": "Información opcional de ubicación.",
  "Professional context for the relationship.": "Contexto profesional de la relación.",
  "Direct communication channels and preferences.": "Canales de comunicación directa y preferencias.",
  "First name": "Nombre",
  "Last name": "Primer apellido",
  "Second last name": "Segundo apellido",
  "Preferred name": "Nombre preferido",
  "Document type": "Tipo de documento",
  "Document number": "Número de documento",
  "Birth date": "Fecha de nacimiento",
  Gender: "Género",
  Country: "País",
  City: "Ciudad",
  "State / province": "Estado / provincia",
  "Postal code": "Código postal",
  "Address line 1": "Dirección línea 1",
  "Address line 2": "Dirección línea 2",
  Company: "Empresa",
  "Job title": "Cargo o puesto",
  Department: "Departamento",
  Email: "Correo electrónico",
  "Secondary email": "Correo secundario",
  Phone: "Teléfono",
  "Secondary phone": "Teléfono secundario",
  "Preferred channel": "Canal preferido",
  "Preferred language": "Idioma preferido",
};

export function MobileFormSection({ definition, completed, total, status, onLayout, children }: { definition: ContactFormSectionDefinition; completed: number; total: number; status: ContactSectionStatus; onLayout?: (event: LayoutChangeEvent) => void; children: ReactNode }) {
  const Icon = icons[definition.iconKey];
  const sectionTitle = SPANISH_CONTACT_FORM[definition.label] || definition.label;
  const description = SPANISH_CONTACT_FORM[definition.description] || definition.description;
  return <View onLayout={onLayout} style={styles.section}><View style={styles.sectionHeader}><Icon size={19} color="#135bec" /><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{sectionTitle}</Text><Text style={styles.description}>{description}</Text></View><Text accessibilityLabel={`${completed} de ${total} campos completos`} style={[styles.progress, status === "error" && styles.progressError]}>{completed}/{total}</Text></View>{children}</View>;
}

export function MobileFormTabs({ sections, activeId, completedIds = [], onSelect }: { sections: readonly ContactFormSectionDefinition[]; activeId: string; completedIds?: readonly string[]; onSelect: (id: ContactFormSectionDefinition["id"]) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{sections.map((section) => { const active = activeId === section.id; const complete = completedIds.includes(section.id); const label = SPANISH_CONTACT_FORM[section.label] || section.label; return <Pressable key={section.id} accessibilityLabel={`Sección ${label}`} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onSelect(section.id)} style={[styles.tab, active && styles.activeTab, complete && styles.completeTab]}><Text style={[styles.tabText, active && styles.activeTabText, complete && styles.completeTabText]}>{label}</Text></Pressable>; })}</ScrollView>;
}

export function MobileFormField({ label, value, onChangeText, error, required, keyboardType = "default", type }: { label: string; value: string; onChangeText: (value: string) => void; error?: string; required?: boolean; keyboardType?: "default" | "email-address" | "phone-pad"; type?: "text" | "email" | "phone" | "date" | "select" | "combobox" }) {
  const displayLabel = SPANISH_CONTACT_FORM[label] || label;
  if (type === "date") return <MobileDateField label={displayLabel} value={value} onChange={onChangeText} error={error} required={required} />;
  return <View style={styles.field}><Text style={styles.label}>{displayLabel}{required ? " *" : ""}</Text><TextInput accessibilityLabel={displayLabel} accessibilityHint={required ? "Campo requerido" : undefined} style={[styles.input, error && styles.invalid]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"} />{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</View>;
}

export function MobileSelectField({ label, value, options, onChange, error, required, searchable = false }: { label: string; value: string; options: readonly MobileOption[]; onChange: (value: string) => void; error?: string; required?: boolean; searchable?: boolean }) {
  const [open, setOpen] = useState(false);
  const displayLabel = SPANISH_CONTACT_FORM[label] || label;
  const selected = options.find((option) => option.code === value);
  return <><View style={styles.field}><Text style={styles.label}>{displayLabel}{required ? " *" : ""}</Text><Pressable accessibilityLabel={displayLabel} accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} style={[styles.input, styles.selectInput, error && styles.invalid]}><Text style={selected ? styles.selectedText : styles.placeholder}>{selected?.label ?? `Seleccionar ${displayLabel.toLowerCase()}`}</Text><ChevronDown size={18} color="#64748b" /></Pressable>{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</View><MobileOptionSheet label={displayLabel} options={options} value={value} visible={open} searchable={searchable} onClose={() => setOpen(false)} onChange={(next) => { onChange(next); setOpen(false); }} /></>;
}

export function MobileComboboxField(props: Omit<React.ComponentProps<typeof MobileSelectField>, "searchable">) {
  return <MobileSelectField {...props} searchable />;
}

function MobileOptionSheet({ label, options, value, visible, searchable, onClose, onChange }: { label: string; options: readonly MobileOption[]; value: string; visible: boolean; searchable: boolean; onClose: () => void; onChange: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const [draftValue, setDraftValue] = useState(value);
  useEffect(() => {
    if (visible) {
      setDraftValue(value);
      setQuery("");
    }
  }, [value, visible]);
  const filtered = useMemo(() => options.filter((option) => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [options, query]);
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={styles.modalOverlay}><Pressable style={styles.modalBackdrop} onPress={onClose} /><View onStartShouldSetResponder={() => true} style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><Pressable accessibilityLabel={`Cancelar selección de ${label}`} onPress={onClose} style={styles.headerAction}><Text style={styles.cancelText}>Cancelar</Text></Pressable><Text style={styles.sheetTitle}>{label}</Text><Pressable accessibilityLabel={`Aplicar selección de ${label}`} onPress={() => onChange(draftValue)} style={styles.headerAction}><Text style={styles.doneText}>Listo</Text></Pressable></View><Text style={styles.sheetSummary}>{draftValue ? options.find((option) => option.code === draftValue)?.label ?? "Seleccionado" : `Elige ${label.toLowerCase()}`}</Text>{searchable ? <View style={styles.search}><Search size={17} color="#64748b" /><TextInput autoFocus accessibilityLabel={`Buscar ${label}`} value={query} onChangeText={setQuery} placeholder={`Buscar ${label.toLowerCase()}...`} placeholderTextColor="#94a3b8" style={styles.searchInput} /></View> : null}<FlatList style={styles.optionsList} data={filtered} keyboardShouldPersistTaps="handled" keyExtractor={(item) => item.code} ListEmptyComponent={<Text style={styles.emptyOptions}>No se encontraron opciones.</Text>} renderItem={({ item }) => { const selected = item.code === draftValue; return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => setDraftValue(item.code)} style={[styles.option, selected && styles.selectedOption]}><View style={styles.optionCopy}><Text style={[styles.optionText, selected && styles.selectedOptionText]}>{item.label}</Text>{selected ? <Text style={styles.selectedLabel}>SELECCIONADO</Text> : null}</View>{selected ? <View style={styles.check}><Check size={16} color="#fff" strokeWidth={3} /></View> : <View style={styles.emptyCheck} />}</Pressable>; }} /></View></View></Modal>;
}

function MobileDateField({ label, value, onChange, error, required }: { label: string; value: string; onChange: (value: string) => void; error?: string; required?: boolean }) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const pickerValue = parseDate(value);
  return <><View style={styles.field}><Text style={styles.label}>{label}{required ? " *" : ""}</Text><Pressable accessibilityLabel={label} accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => { setDraftValue(value); setOpen(true); }} style={[styles.input, styles.selectInput, error && styles.invalid]}><Text style={value ? styles.selectedText : styles.placeholder}>{value || "Elegir fecha"}</Text><Text style={styles.calendarHint}>Calendario</Text></Pressable>{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</View><Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}><Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}><View onStartShouldSetResponder={() => true} style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><Pressable accessibilityLabel={`Cancelar selección de ${label}`} onPress={() => setOpen(false)} style={styles.headerAction}><Text style={styles.cancelText}>Cancelar</Text></Pressable><Text style={styles.sheetTitle}>{label}</Text><Pressable accessibilityLabel={`Aplicar selección de ${label}`} onPress={() => { onChange(draftValue); setOpen(false); }} style={styles.headerAction}><Text style={styles.doneText}>Listo</Text></Pressable></View><Text style={styles.sheetSummary}>{draftValue ? formatDateLabel(pickerValue) : "Elige una fecha del calendario"}</Text><View style={styles.calendar}>{Platform.OS === "web" ? <MobileCalendar value={pickerValue} onChange={(nextDate) => setDraftValue(formatDate(nextDate))} /> : <DateTimePicker accessibilityLabel={`Calendario de ${label}`} value={pickerValue} mode="date" display="inline" maximumDate={new Date()} onChange={(_, nextDate) => { if (nextDate) setDraftValue(formatDate(nextDate)); }} />}</View></View></Pressable></Modal></>;
}

function MobileCalendar({ value, onChange }: { value: Date; onChange: (value: Date) => void }) {
  const [month, setMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const today = new Date();
  const firstDay = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
  const isSameDay = (left: Date, right: Date) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  return <View accessibilityLabel="Calendario" style={styles.webCalendar}><View style={styles.calendarHeader}><Pressable accessibilityLabel="Mes anterior" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.monthButton}><ChevronLeft size={20} color="#475569" /></Pressable><Text style={styles.monthTitle}>{month.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</Text><Pressable accessibilityLabel="Mes siguiente" disabled={month.getFullYear() === today.getFullYear() && month.getMonth() >= today.getMonth()} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={styles.monthButton}><ChevronRight size={20} color="#475569" /></Pressable></View><View style={styles.weekRow}>{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}</View><View style={styles.calendarGrid}>{cells.map((day, index) => { const disabled = !day || day > today; const selected = day ? isSameDay(day, value) : false; return <Pressable key={index} accessibilityLabel={day ? day.toLocaleDateString("es-ES") : "Celda de calendario vacía"} accessibilityRole={day ? "button" : undefined} disabled={disabled} onPress={() => day && onChange(day)} style={[styles.calendarDay, selected && styles.calendarDaySelected, disabled && styles.calendarDayDisabled]}>{day ? <Text style={[styles.calendarDayText, selected && styles.calendarDaySelectedText, disabled && styles.calendarDayDisabledText]}>{day.getDate()}</Text> : null}</Pressable>; })}</View></View>;
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(1990, 0, 1);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(value: Date) {
  return value.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

const styles = StyleSheet.create({
  tabs: { borderBottomColor: "#e2e8f0", borderBottomWidth: 1, gap: 4, minWidth: "100%" }, tab: { borderBottomColor: "transparent", borderBottomWidth: 3, paddingHorizontal: 14, paddingVertical: 13 }, activeTab: { borderBottomColor: "#135bec" }, completeTab: { borderBottomColor: "#2563eb" }, tabText: { color: "#64748b", fontSize: 13, fontWeight: "700" }, activeTabText: { color: "#135bec" }, completeTabText: { color: "#2563eb" },
  section: { backgroundColor: "#fff", borderColor: "#e5e7eb", borderRadius: 16, borderWidth: 1, marginBottom: 14, padding: 16 }, sectionHeader: { alignItems: "flex-start", flexDirection: "row", gap: 10, marginBottom: 14 }, sectionHeading: { flex: 1 }, sectionTitle: { color: "#111827", fontSize: 18, fontWeight: "800" }, description: { color: "#64748b", fontSize: 12, marginTop: 3 }, progress: { color: "#64748b", fontSize: 12, fontWeight: "700" }, progressError: { color: "#b91c1c" },
  field: { marginBottom: 12 }, label: { color: "#475569", fontSize: 12, fontWeight: "700", marginBottom: 6 }, input: { backgroundColor: "#f8fafc", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, color: "#111827", fontSize: 16, minHeight: 44, paddingHorizontal: 12 }, selectInput: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingVertical: 11 }, selectedText: { color: "#111827", flex: 1, fontSize: 16 }, placeholder: { color: "#94a3b8", flex: 1, fontSize: 16 }, invalid: { borderColor: "#dc2626" }, error: { color: "#b91c1c", fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" }, modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(15,23,42,0.42)" }, sheet: { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, height: "92%", padding: 20 }, sheetHandle: { alignSelf: "center", backgroundColor: "#cbd5e1", borderRadius: 99, height: 4, marginBottom: 16, width: 38 }, sheetHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }, headerAction: { minWidth: 68, paddingVertical: 8 }, cancelText: { color: "#475569", fontSize: 15, fontWeight: "600" }, doneText: { color: "#135bec", fontSize: 15, fontWeight: "800", textAlign: "right" }, sheetTitle: { color: "#111827", fontSize: 18, fontWeight: "800" }, sheetSummary: { color: "#64748b", fontSize: 13, marginBottom: 14, textAlign: "center" }, search: { alignItems: "center", backgroundColor: "#f8fafc", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 8, marginBottom: 10, paddingHorizontal: 12 }, searchInput: { color: "#111827", flex: 1, fontSize: 16, minHeight: 42 }, optionsList: { flex: 1 }, option: { alignItems: "center", borderBottomColor: "#e5e7eb", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 52, paddingHorizontal: 10, paddingVertical: 10 }, selectedOption: { backgroundColor: "#eff6ff", borderBottomColor: "#dbeafe", borderRadius: 10, marginBottom: 4 }, optionCopy: { flex: 1 }, optionText: { color: "#1e293b", fontSize: 16, fontWeight: "600" }, selectedOptionText: { color: "#135bec" }, selectedLabel: { color: "#60a5fa", fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginTop: 3 }, check: { alignItems: "center", backgroundColor: "#135bec", borderRadius: 99, height: 24, justifyContent: "center", width: 24 }, emptyCheck: { borderColor: "#cbd5e1", borderRadius: 99, borderWidth: 1.5, height: 24, width: 24 }, emptyOptions: { color: "#64748b", padding: 18, textAlign: "center" }, calendarHint: { color: "#64748b", fontSize: 12, fontWeight: "700" }, calendar: { alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 16, padding: 12 }, webCalendar: { alignSelf: "stretch", backgroundColor: "#fff", borderColor: "#e2e8f0", borderRadius: 16, borderWidth: 1, padding: 16 }, calendarHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 }, monthButton: { alignItems: "center", borderRadius: 99, height: 36, justifyContent: "center", width: 36 }, monthTitle: { color: "#111827", fontSize: 18, fontWeight: "800" }, weekRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 8 }, weekDay: { color: "#94a3b8", flex: 1, fontSize: 11, fontWeight: "800", textAlign: "center" }, calendarGrid: { flexDirection: "row", flexWrap: "wrap" }, calendarDay: { alignItems: "center", borderRadius: 99, height: 42, justifyContent: "center", marginBottom: 4, width: "14.2857%" }, calendarDaySelected: { backgroundColor: "#135bec" }, calendarDayDisabled: { opacity: 0.35 }, calendarDayText: { color: "#1e293b", fontSize: 15, fontWeight: "600" }, calendarDaySelectedText: { color: "#fff", fontWeight: "800" }, calendarDayDisabledText: { color: "#94a3b8" },
});
