import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, CheckSquare, Clock, FileText, Lock, Paperclip, Plus, StickyNote, Trash2, Users } from "lucide-react-native";
import type { TaskRecord } from "../../../../packages/contracts/src/tasks";
import type { NoteRecord } from "../../../../packages/contracts/src/notes";
import { MobileNoteEditor, type MobileNoteDraft } from "../MobileNoteEditor";
import { MobileNotesList } from "../MobileNotesList";

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
  const [activeSubTab, setActiveSubTab] = useState<"tasks" | "notes">("tasks");
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

  return (
    <View style={styles.container}>
      {/* Sub-tab strip */}
      <View style={styles.tabStrip}>
        <Pressable
          style={[styles.tabButton, activeSubTab === "tasks" && styles.tabButtonActive]}
          onPress={() => setActiveSubTab("tasks")}
        >
          <CheckSquare size={14} color={activeSubTab === "tasks" ? "#ffffff" : "#64748b"} />
          <Text style={[styles.tabButtonText, activeSubTab === "tasks" && styles.tabButtonTextActive]}>
            Tareas ({openTasksCount} abiertas)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeSubTab === "notes" && styles.tabButtonActive]}
          onPress={() => setActiveSubTab("notes")}
        >
          <StickyNote size={14} color={activeSubTab === "notes" ? "#ffffff" : "#64748b"} />
          <Text style={[styles.tabButtonText, activeSubTab === "notes" && styles.tabButtonTextActive]}>
            Notas ({notes.length})
          </Text>
        </Pressable>
      </View>

      {/* Tasks Section */}
      {activeSubTab === "tasks" && (
        <View style={styles.contentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Tareas pendientes ({openTasksCount})</Text>
            <Pressable style={styles.addButton} onPress={() => setCreateTaskOpen(true)}>
              <Plus size={13} color="#135bec" />
              <Text style={styles.addButtonText}>Nueva Tarea</Text>
            </Pressable>
          </View>

          {createTaskOpen && (
            <View style={styles.inlineCreateBox}>
              <Text style={styles.inlineLabel}>Título de la tarea</Text>
              <TextInput
                style={styles.inlineInput}
                placeholder="Ej. Llamar para seguimiento de propuesta..."
                placeholderTextColor="#94a3b8"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
              />
              <View style={styles.priorityRow}>
                <Text style={styles.priorityLabel}>Prioridad:</Text>
                {(["low", "normal", "high"] as const).map((p) => (
                  <Pressable
                    key={p}
                    style={[styles.priorityPill, newTaskPriority === p && styles.priorityPillActive]}
                    onPress={() => setNewTaskPriority(p)}
                  >
                    <Text
                      style={[styles.priorityPillText, newTaskPriority === p && styles.priorityPillTextActive]}
                    >
                      {p === "high" ? "Alta" : p === "normal" ? "Normal" : "Baja"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.inlineActionRow}>
                <Pressable style={styles.inlineCancel} onPress={() => setCreateTaskOpen(false)}>
                  <Text style={styles.inlineCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.inlineSubmit} onPress={handleSaveTask}>
                  <Text style={styles.inlineSubmitText}>Guardar Tarea</Text>
                </Pressable>
              </View>
            </View>
          )}

          {tasks.length === 0 ? (
            <View style={styles.emptyBox}>
              <CheckSquare size={28} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Sin tareas pendientes</Text>
              <Text style={styles.emptySubtitle}>Agrega tareas de seguimiento para este cliente.</Text>
            </View>
          ) : (
            <View style={styles.taskList}>
              {tasks.map((task) => {
                const isDone = task.status === "completed";
                const isHigh = task.priority === "high";
                const isLow = task.priority === "low";
                return (
                  <View key={task.id} style={styles.taskRow}>
                    <Pressable hitSlop={8} style={styles.checkboxTarget} onPress={() => onToggleTask(task)}>
                      <View style={[styles.checkboxBox, isDone && styles.checkboxBoxDone]}>
                        {isDone && <Check size={12} color="#ffffff" strokeWidth={3} />}
                      </View>
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                        {task.title}
                      </Text>
                      <View style={styles.taskMetaRow}>
                        <View
                          style={[
                            styles.priorityTag,
                            isHigh ? styles.priorityHigh : isLow ? styles.priorityLow : styles.priorityNormal,
                          ]}
                        >
                          <Text
                            style={[
                              styles.priorityTagText,
                              isHigh ? styles.priorityTextHigh : isLow ? styles.priorityTextLow : styles.priorityTextNormal,
                            ]}
                          >
                            {task.priority.toUpperCase()}
                          </Text>
                        </View>
                        {task.dueAt && (
                          <Text style={styles.taskDueText}>
                            Vence: {new Date(task.dueAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Notes Section */}
      {activeSubTab === "notes" && (
        <View style={styles.contentCard}>
          {editorOpen && onCreateNote ? (
            <MobileNoteEditor
              initialNote={selectedNote}
              relationLabel={contactName}
              onCancel={() => {
                setEditorOpen(false);
                setSelectedNote(undefined);
              }}
              onSave={async (draft) => {
                if (selectedNote && onUpdateNote) {
                  await onUpdateNote(selectedNote.id, selectedNote.version, draft);
                } else {
                  await onCreateNote(draft);
                }
                setEditorOpen(false);
                setSelectedNote(undefined);
              }}
            />
          ) : (
            <MobileNotesList
              notes={notes}
              loading={notesLoading}
              onCreate={() => {
                setSelectedNote(undefined);
                setEditorOpen(true);
              }}
              onOpen={(note) => {
                setSelectedNote(note);
                setEditorOpen(true);
              }}
              onDelete={(note) => {
                if (onDeleteNote) void onDeleteNote(note);
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
    marginBottom: 16,
  },
  tabStrip: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 10,
  },
  tabButtonActive: {
    backgroundColor: "#135bec",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  tabButtonTextActive: {
    color: "#ffffff",
  },
  contentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  addButton: {
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
  addButtonText: {
    color: "#135bec",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  taskList: {
    gap: 8,
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
    width: 32,
    height: 32,
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
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  priorityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityHigh: { backgroundColor: "#fef2f2" },
  priorityNormal: { backgroundColor: "#eff6ff" },
  priorityLow: { backgroundColor: "#f1f5f9" },
  priorityTagText: { fontSize: 9, fontWeight: "800" },
  priorityTextHigh: { color: "#dc2626" },
  priorityTextNormal: { color: "#2563eb" },
  priorityTextLow: { color: "#64748b" },
  taskDueText: {
    fontSize: 11,
    color: "#64748b",
  },
  inlineCreateBox: {
    marginBottom: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    borderColor: "#cbd5e1",
    borderWidth: 1,
  },
  inlineLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  inlineInput: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0f172a",
  },
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  priorityLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  priorityPill: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityPillActive: {
    backgroundColor: "#135bec",
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  priorityPillTextActive: {
    color: "#ffffff",
  },
  inlineActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
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
