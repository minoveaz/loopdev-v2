import type { CRMLead, CRMOpportunity } from "@/loopdev/domains/crm/adapter";
import { Customer360LeadsCard, Customer360OpportunitiesCard } from "./Customer360ActivityCards";

export function Customer360SalesTab({ leads, opportunities }: { leads: CRMLead[]; opportunities: CRMOpportunity[] }) {
  return <div className="grid gap-6 lg:grid-cols-2"><Customer360LeadsCard leads={leads} /><Customer360OpportunitiesCard opportunities={opportunities} /></div>;
}
