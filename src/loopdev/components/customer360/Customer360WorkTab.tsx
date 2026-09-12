import type { CRMTask } from "@/loopdev/domains/crm/adapter";
import type { GlobalNoteRecord } from "@/loopdev/domains/notes";
import { Customer360NotesCard, Customer360TasksCard } from "./Customer360ActivityCards";

export function Customer360WorkTab({ tasks, notes, onEditNote }: { tasks: CRMTask[]; notes: GlobalNoteRecord[]; onEditNote?: (note: GlobalNoteRecord) => void }) {
  return <div className="grid gap-6 lg:grid-cols-2"><Customer360TasksCard tasks={tasks} /><Customer360NotesCard notes={notes} onEditNote={onEditNote} /></div>;
}
