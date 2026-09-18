import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, CheckSquare, Clock, Plus, StickyNote, Trash2 } from "lucide-react-native";
import type { TaskRecord } from "../../../../packages/contracts/src/tasks";
import type { NoteRecord } from "../../../../packages/contracts/src/notes";
import { MobileNoteEditor, type MobileNoteDraft } from "../MobileNoteEditor";
import { MobileNotesCard } from "../MobileNotesCard";
import { useT } from "../../i18n";
import {
  MobilePageTabs,
  MobileCard,
  MobileButton,
  MobileStatusBadge,
  MobileEmptyState,
} from "../ui";

interface Props {
  tasks: TaskRecord[];
  notes: NoteRecord[];
  contactId: string;
  contactName: string;
  notesLoading?: boolean;
  onToggleTask: (task: TaskRecord) => Promise<void>;
  onCreateTask: (title: string, priority: "normal" | "high" | "low", dueAt?: string) => Promise<void>;
  onCreateNote?: (draft: MobileNoteDraft) => Promise<void>;
  onUpdateNote?: (noteId: string, version: number, draft: MobileNoteDraft) => Promise<void>;
  onDeleteNote?: (note: NoteRecord) => Promise<void>;
}

export function MobileCustomer360Work({
  tasks,
  notes,
  contactId,
  contactName,
  notesLoading,
  onToggleTask,
  onCreateTask,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: Props) {
  const t = useT();
  const [activeSubTab, setActiveSubTab] = useState<string>("tasks");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"normal" | "high" | "low">("normal");

  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteRecord | undefined>();

  const openTasksCount = tasks.filter((t) => t.status !== "completed").length;

  const handleSaveTask = async () => {
    if (!newTaskTitle.trim()) return;
    await onCreateTask(newTaskTitle.trim(), newTaskPriority);
    setNewTaskTitle("");
    setCreateTaskOpen(false);
  };

  const workTabs = [
    { id: "tasks", label: "Tareas", count: openTasksCount },
    { id: "notes", label: "Notas", count: notes.length },
  ];

  const priorityTabs = [
    { id: "normal", label: "Normal" },
    { id: "high", label: "Alta" },
    { id: "low", label: "Baja" },
  ];

  return (
    <View style={styles.container}>
      {/* Sub-tab strip (Canonical MobilePageTabs, STRICTLY NO PILLS) */}
      <MobilePageTabs
        tabs={workTabs}
        activeTab={activeSubTab}
        onTabChange={setActiveSubTab}
      />

      {/* Tasks Section */}
      {activeSubTab === "tasks" && (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Tareas Pendientes ({openTasksCount})</Text>
            <MobileButton
              variant="primary"
              size="sm"
              icon={Plus}
              onPress={() => setCreateTaskOpen(true)}
              minHeight={36}
            >
              Nueva Tarea
            </MobileButton>
          </View>

          {createTaskOpen && (
            <MobileCard style={styles.inlineCreateCard}>
              <Text style={styles.inlineLabel}>TÍTULO DE LA TAREA *</Text>
              <TextInput
                style={styles.inlineInput}
                placeholder="Seguimiento con cliente..."
                placeholderTextColor="#94a3b8"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
              />

              <Text style={styles.inlineLabel}>PRIORIDAD</Text>
              <MobilePageTabs
                tabs={priorityTabs}
                activeTab={newTaskPriority}
                onTabChange={(p) => setNewTaskPriority(p as any)}
              />

              <View style={styles.inlineActionRow}>
                <MobileButton
                  variant="ghost"
                  size="sm"
                  onPress={() => setCreateTaskOpen(false)}
                  minHeight={44}
                >
                  Cancelar
                </MobileButton>
                <MobileButton
                  variant="primary"
                  size="sm"
                  onPress={handleSaveTask}
                  minHeight={44}
                >
                  Guardar Tarea
                </MobileButton>
              </View>
            </MobileCard>
          )}

          {tasks.length === 0 ? (
            <MobileEmptyState
              title="Sin tareas registradas"
              description="Crea la primera tarea para este contacto."
            />
          ) : (
            <View style={styles.tasksList}>
              {tasks.map((task) => {
                const isCompleted = task.status === "completed";
                const isOverdue = task.dueAt && new Date(task.dueAt).getTime() < Date.now();
                return (
                  <MobileCard key={task.id} style={styles.taskCard}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Marcar tarea ${task.title}`}
                      style={styles.taskCheckboxRow}
                      onPress={() => onToggleTask(task)}
                    >
                      <View style={[styles.taskCheckbox, isCompleted && styles.taskCheckboxCompleted]}>
                        {isCompleted && <Check size={14} color="#ffffff" />}
                      </View>
                      <View style={styles.taskInfo}>
                        <Text
                          style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}
                          numberOfLines={2}
                        >
                          {task.title}
                        </Text>
                        <View style={styles.taskMetaRow}>
                          <MobileStatusBadge
                            status={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "low"
                                ? "neutral"
                                : "info"
                            }
                            label={task.priority.toUpperCase()}
                            size="sm"
                          />
                          {task.dueAt && (
                            <View style={styles.dueDateBadge}>
                              <Clock size={11} color={isOverdue ? "#dc2626" : "#64748b"} />
                              <Text
                                style={[styles.dueDateText, isOverdue && { color: "#dc2626", fontWeight: "700" }]}
                              >
                                {new Date(task.dueAt).toLocaleDateString()}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  </MobileCard>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Notes Section */}
      {activeSubTab === "notes" && (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Notas del Cliente ({notes.length})</Text>
            {onCreateNote && (
              <MobileButton
                variant="primary"
                size="sm"
                icon={Plus}
                onPress={() => {
                  setSelectedNote(undefined);
                  setEditorOpen(true);
                }}
                minHeight={36}
              >
                Nueva Nota
              </MobileButton>
            )}
          </View>

          {notes.length === 0 ? (
            <MobileEmptyState
              title="Sin notas registradas"
              description="Añade notas internas o resúmenes de llamadas."
            />
          ) : (
            <View style={styles.notesList}>
              {notes.map((note) => (
                <MobileNotesCard
                  key={note.id}
                  note={note}
                  onPress={() => {
                    setSelectedNote(note);
                    setEditorOpen(true);
                  }}
                  onDelete={onDeleteNote ? () => onDeleteNote(note) : undefined}
                />
              ))}
            </View>
          )}

          {/* Note Editor Modal */}
          {editorOpen && (
            <MobileNoteEditor
              visible={editorOpen}
              onClose={() => {
                setEditorOpen(false);
                setSelectedNote(undefined);
              }}
              note={selectedNote}
              onSave={async (draft) => {
                if (selectedNote && onUpdateNote) {
                  await onUpdateNote(selectedNote.id, selectedNote.version, draft);
                } else if (onCreateNote) {
                  await onCreateNote(draft);
                }
                setEditorOpen(false);
                setSelectedNote(undefined);
              }}
              initialEntity={{
                type: "contact",
                id: contactId,
                name: contactName,
              }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  tabContent: {
    marginTop: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  inlineCreateCard: {
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#f8fafc",
  },
  inlineLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 6,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  inlineActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
  },
  tasksList: {
    gap: 8,
  },
  taskCard: {
    padding: 12,
  },
  taskCheckboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 44,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  taskCheckboxCompleted: {
    borderColor: "#16a34a",
    backgroundColor: "#16a34a",
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#94a3b8",
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dueDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dueDateText: {
    fontSize: 11,
    color: "#64748b",
  },
  notesList: {
    gap: 8,
  },
});
