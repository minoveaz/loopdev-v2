import { useEffect, useState } from "react";
import { Archive, ArrowLeft, BriefcaseBusiness, Check, CheckSquare, Clock, Clock3, Mail, MapPin, Phone, Plus, ShieldCheck, StickyNote, Users, X } from "lucide-react-native";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { contactActions } from "../../../packages/contracts/src/contact-actions";
import type { ContactCustomer360View } from "../../../packages/contracts/src/contact-port";
import type { NoteRecord } from "../../../packages/contracts/src/notes";
import type { TaskRecord } from "../../../packages/contracts/src/tasks";
import { mobileTasksAdapter } from "../adapters/tasks";
import { MobileNoteEditor, type MobileNoteDraft } from "./MobileNoteEditor";
import { MobileNotesList } from "./MobileNotesList";

type Props = {
  view?: ContactCustomer360View;
  loading?: boolean;
  error?: string | null;
  onBack: () => void;
  onEdit?: () => void;
  onArchive?: (contact: ContactCustomer360View["contact"]) => void;
  notes?: NoteRecord[];
  notesLoading?: boolean;
  onCreateNote?: (draft: MobileNoteDraft) => Promise<void>;
  onUpdateNote?: (noteId: string, version: number, draft: MobileNoteDraft) => Promise<void>;
  onDeleteNote?: (note: NoteRecord) => Promise<void>;
};

export function MobileCustomer360Screen({ view, loading, error, onBack, onEdit, onArchive, notes = [], notesLoading, onCreateNote, onUpdateNote, onDeleteNote }: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteRecord | undefined>();
  const [contactTasks, setContactTasks] = useState<TaskRecord[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const loadTasks = async (contactId: string) => {
    setTasksLoading(true);
    try {
      const res = await mobileTasksAdapter.listTasks({
        organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
        suite: "crm",
        relation: { entityType: "contact", entityId: contactId },
      });
      setContactTasks(res.items);
    } catch {
      // fallback
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (view?.contact.id) {
      void loadTasks(view.contact.id);
    }
  }, [view?.contact.id]);

  const handleToggleTask = async (task: TaskRecord) => {
    const isCompleted = task.status === "completed";
    setContactTasks((curr) =>
      curr.map((t) =>
        t.id === task.id
          ? { ...t, status: isCompleted ? "open" : "completed", completedAt: isCompleted ? null : new Date().toISOString() }
          : t,
      ),
    );
    if (isCompleted) {
      await mobileTasksAdapter.reopenTask(task.id);
    } else {
      await mobileTasksAdapter.completeTask(task.id);
    }
  };

  const handleCreateContactTask = async () => {
    if (!newTaskTitle.trim() || !view) return;
    const res = await mobileTasksAdapter.createTask({
      organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
      suite: "crm",
      title: newTaskTitle.trim(),
      priority: "normal",
      relation: { entityType: "contact", entityId: view.contact.id, label: name },
      dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
    if (res.status === "success") {
      setContactTasks((curr) => [res.task, ...curr]);
      setNewTaskTitle("");
      setCreateTaskOpen(false);
    }
  };

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
    
    {/* Interactive Tasks Section */}
    <Section
      title={`Tasks (${contactTasks.length})`}
      icon={<CheckSquare size={18} color="#135bec" />}
      action={
        <Pressable
          style={c360TaskStyles.addTaskButton}
          onPress={() => setCreateTaskOpen(true)}
        >
          <Plus size={13} color="#135bec" />
          <Text style={c360TaskStyles.addTaskButtonText}>Nueva tarea</Text>
        </Pressable>
      }
    >
      {contactTasks.map((t) => {
        const isDone = t.status === "completed";
        return (
          <View key={t.id} style={c360TaskStyles.taskRow}>
            <Pressable
              hitSlop={8}
              style={c360TaskStyles.checkboxTarget}
              onPress={() => handleToggleTask(t)}
            >
              <View style={[c360TaskStyles.checkboxBox, isDone && c360TaskStyles.checkboxBoxDone]}>
                {isDone && <Check size={12} color="#ffffff" strokeWidth={3} />}
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[c360TaskStyles.taskTitle, isDone && c360TaskStyles.taskTitleDone]}>
                {t.title}
              </Text>
              {t.dueAt && (
                <Text style={c360TaskStyles.taskDue}>
                  Vence: {new Date(t.dueAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        );
      })}
      {contactTasks.length === 0 && !tasksLoading && (
        <Text style={styles.stateDetail}>No tasks associated with this contact.</Text>
      )}

      {createTaskOpen && (
        <View style={c360TaskStyles.inlineCreateBox}>
          <TextInput
            style={c360TaskStyles.inlineInput}
            placeholder="Título de la nueva tarea..."
            placeholderTextColor="#94a3b8"
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
          />
          <View style={c360TaskStyles.inlineActionRow}>
            <Pressable
              style={c360TaskStyles.inlineCancel}
              onPress={() => setCreateTaskOpen(false)}
            >
              <Text style={c360TaskStyles.inlineCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={c360TaskStyles.inlineSubmit}
              onPress={handleCreateContactTask}
            >
              <Text style={c360TaskStyles.inlineSubmitText}>Guardar Tarea</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Section>

    <Section title="Notes" icon={<StickyNote size={18} color="#135bec" />}>
      {editorOpen && onCreateNote ? <MobileNoteEditor
        initialNote={selectedNote}
        relationLabel={name}
        onCancel={() => { setEditorOpen(false); setSelectedNote(undefined); }}
        onSave={async (draft) => {
          if (selectedNote && onUpdateNote) await onUpdateNote(selectedNote.id, selectedNote.version, draft);
          else await onCreateNote(draft);
          setEditorOpen(false);
          setSelectedNote(undefined);
        }}
      /> : <MobileNotesList
        notes={notes}
        loading={notesLoading}
        onCreate={() => { setSelectedNote(undefined); setEditorOpen(true); }}
        onOpen={(note) => { setSelectedNote(note); setEditorOpen(true); }}
        onDelete={(note) => { if (onDeleteNote) void onDeleteNote(note); }}
      />}
    </Section>
    <Section title="Activity & timeline" icon={<Clock3 size={18} color="#135bec" />}><ListState count={view.timeline.length} label="activity" />{view.timeline.slice(0, 5).map((item: any) => <Row key={item.id} label={item.summary} value={new Date(item.occurredAt).toLocaleDateString()} />)}</Section>
    <Section title="Relations & sales summary" icon={<Users size={18} color="#135bec" />}><Row label="Open opportunities" value={String(view.opportunities.length)} /><Row label="Preferred channel" value={contact.preferredChannel || "Not provided"} /><Row label="Contact ID" value={contact.id} /></Section>
  </ScrollView>;
}

function StateScreen({ title, detail, onBack }: { title: string; detail: string; onBack: () => void }) { return <View style={styles.content}><Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><ArrowLeft size={17} color="#135bec" /><Text style={styles.backText}>Back to contacts</Text></Pressable><View style={styles.state}><Text style={styles.stateTitle}>{title}</Text><Text style={styles.stateDetail}>{detail}</Text></View></View>; }
function Section({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) { return <View style={styles.section}><View style={styles.sectionHeader}><View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>{icon}<Text style={styles.sectionTitle}>{title}</Text></View>{action}</View>{children}</View>; }
function ListState({ count, label }: { count: number; label: string }) { return <Text style={styles.stateDetail}>{count ? `${count} ${label}${count === 1 ? "" : "s"} from the shared CRM boundary.` : `No ${label}s associated with this contact.`}</Text>; }
function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <View style={styles.detail}>{icon}<View><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View></View>; }
function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>; }

const c360TaskStyles = StyleSheet.create({
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addTaskButtonText: {
    color: "#135bec",
    fontSize: 11,
    fontWeight: "700",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
  },
  checkboxTarget: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderColor: "#94a3b8",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBoxDone: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  taskTitleDone: {
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  taskDue: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  inlineCreateBox: {
    marginTop: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    borderColor: "#cbd5e1",
    borderWidth: 1,
  },
  inlineInput: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#111827",
  },
  inlineActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  inlineCancel: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineCancelText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  inlineSubmit: {
    backgroundColor: "#135bec",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inlineSubmitText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});

const styles = StyleSheet.create({
  content: { paddingBottom: 30, paddingHorizontal: 18, paddingTop: 14 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  backText: { color: "#135bec", fontSize: 13, fontWeight: "700" },
  hero: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#135bec", fontSize: 18, fontWeight: "800" },
  heroCopy: { flex: 1 },
  eyebrow: { color: "#135bec", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: "#111827", fontSize: 22, fontWeight: "800", marginTop: 2 },
  subtitle: { color: "#64748b", fontSize: 13, marginTop: 2 },
  verified: { flexDirection: "row", alignItems: "center", gap: 4, color: "#15803d", fontSize: 12, fontWeight: "700", marginTop: 4 },
  actions: { flexDirection: "row", gap: 10, marginBottom: 16 },
  edit: { flex: 1, backgroundColor: "#135bec", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  editText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  archive: { flexDirection: "row", alignItems: "center", gap: 6, borderColor: "#fecaca", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  archiveText: { color: "#dc2626", fontSize: 13, fontWeight: "700" },
  section: { backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: "#111827", fontSize: 15, fontWeight: "800" },
  state: { paddingVertical: 40, alignItems: "center" },
  stateTitle: { color: "#111827", fontSize: 18, fontWeight: "800" },
  stateDetail: { color: "#64748b", fontSize: 13, marginTop: 4 },
  detail: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  detailLabel: { color: "#64748b", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  detailValue: { color: "#111827", fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomColor: "#f1f5f9", borderBottomWidth: 1 },
  rowLabel: { color: "#64748b", fontSize: 13 },
  rowValue: { color: "#111827", fontSize: 13, fontWeight: "600" },
});

