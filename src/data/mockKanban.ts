import type { KanbanColumn } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const BOARD = "board_1";
const COLS = [
  { title: "Backlog", color: "#94a3b8" },
  { title: "To do", color: "#3b82f6" },
  { title: "In progress", color: "#f59e0b" },
  { title: "Review", color: "#8b5cf6" },
  { title: "Done", color: "#10b981" },
];

export const mockKanbanColumns: KanbanColumn[] = COLS.map((c, i) => ({
  id: `kcol_${i + 1}`,
  boardId: BOARD,
  title: c.title,
  color: c.color,
  order: i,
  taskIds: [],
  createdAt: ago(60 - i),
  updatedAt: ago(5),
}));

export const kanbanColumnsStore = createLocalStore<KanbanColumn>({
  key: "data:kanban-columns",
  seed: mockKanbanColumns,
  idPrefix: "kcol",
});