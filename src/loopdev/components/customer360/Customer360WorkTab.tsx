import type { CRMNote, CRMTask } from "@/loopdev/domains/crm/adapter";
import { Customer360NotesCard, Customer360TasksCard } from "./Customer360ActivityCards";

export function Customer360WorkTab({ tasks, notes }: { tasks: CRMTask[]; notes: CRMNote[] }) {
  return <div className="grid gap-6 lg:grid-cols-2"><Customer360TasksCard tasks={tasks} /><Customer360NotesCard notes={notes} /></div>;
}
