import { useState } from "react";
import { FileText, PackagePlus, Pencil, Plus, Upload, UserPlus } from "lucide-react";
import { DataCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import type { CRMContact, CRMLead, CRMOpportunity, CRMTask } from "@/loopdev/domains/crm/adapter";
import type { GlobalNoteRecord } from "@/loopdev/domains/notes";
import { Customer360CrmDetailsTab } from "./Customer360CrmDetailsTab";
import { Customer360DocumentsTab } from "./Customer360DocumentsTab";
import { Customer360ProductsTab } from "./Customer360ProductsTab";
import { Customer360SalesTab } from "./Customer360SalesTab";
import { Customer360WorkTab } from "./Customer360WorkTab";
import { contactActions } from "../../../../packages/contracts/src/contact-actions";

interface Customer360DetailTabsProps {
  contact: CRMContact;
  leads: CRMLead[];
  opportunities: CRMOpportunity[];
  tasks: CRMTask[];
  notes: GlobalNoteRecord[];
  onEdit: () => void;
  onNewNote?: () => void;
  onEditNote?: (note: GlobalNoteRecord) => void;
  onViewCatalog: () => void;
}

export function Customer360DetailTabs({ contact, leads, opportunities, tasks, notes, onEdit, onNewNote, onEditNote, onViewCatalog }: Customer360DetailTabsProps) {
  const t = useT();
  const [activeTab, setActiveTab] = useState("contact");
  const [documentUploadTrigger, setDocumentUploadTrigger] = useState<(() => void) | null>(null);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const tabs = [
    { value: "contact", label: t("crm.customer360.tabs.contactInfo") },
    { value: "sales", label: t("crm.customer360.tabs.sales"), count: leads.length + opportunities.length },
    { value: "work", label: t("crm.customer360.tabs.work"), count: tasks.filter((task) => task.status !== "completed").length + notes.length },
    { value: "documents", label: t("crm.customer360.tabs.documents") },
    { value: "products", label: t("crm.customer360.tabs.products") },
  ];
  const footer = {
    contact: <Button onClick={onEdit}><Pencil className="mr-1.5 h-3.5 w-3.5" />{contactActions.find((action) => action.id === "edit")?.label}</Button>,
    sales: <><Button><Plus className="mr-1.5 h-3.5 w-3.5" />New opportunity</Button><Button variant="outline"><UserPlus className="mr-1.5 h-3.5 w-3.5" />New lead</Button><Button variant="outline">View pipeline</Button></>,
    work: <><Button><Plus className="mr-1.5 h-3.5 w-3.5" />New task</Button><Button variant="outline" onClick={onNewNote}><FileText className="mr-1.5 h-3.5 w-3.5" />New note</Button></>,
    documents: <><Button onClick={() => documentUploadTrigger?.()}><Upload className="mr-1.5 h-3.5 w-3.5" />Upload document</Button><Button variant="outline"><FileText className="mr-1.5 h-3.5 w-3.5" />View all</Button></>,
    products: <><Button onClick={() => setProductSelectorOpen(true)}><PackagePlus className="mr-1.5 h-3.5 w-3.5" />Add product</Button><Button variant="outline" onClick={onViewCatalog}>View catalog</Button></>,
  }[activeTab as keyof typeof footer];
  return (
    <DataCard className="min-w-0 lg:col-span-2 h-[580px] max-h-[calc(100vh-8rem)]" bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0" title="Customer workspace" description="Everything we know about this relationship" headerContent={<div role="tablist" aria-label="Customer workspace sections" className="flex w-full gap-1 overflow-x-auto bg-card-muted p-1">
      {tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={activeTab === tab.value} onClick={() => setActiveTab(tab.value)} className={`shrink-0 rounded-md px-3 py-2 text-sm transition-colors ${activeTab === tab.value ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{tab.label}{tab.count !== undefined && <span className="ml-1 text-xs text-muted-foreground">{tab.count}</span>}</button>)}
    </div>}>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {activeTab === "contact" && <Customer360CrmDetailsTab contact={contact} />}
        {activeTab === "sales" && <Customer360SalesTab leads={leads} opportunities={opportunities} />}
        {activeTab === "work" && <Customer360WorkTab tasks={tasks} notes={notes} onEditNote={onEditNote} />}
        {activeTab === "documents" && (
          <Customer360DocumentsTab
            contact={contact}
            onUploadTriggerReady={(trigger) => setDocumentUploadTrigger(() => trigger)}
          />
        )}
        {activeTab === "products" && <Customer360ProductsTab contactId={contact.id} opportunities={opportunities} leads={leads} selectorOpen={productSelectorOpen} onSelectorOpenChange={setProductSelectorOpen} />}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-card px-5 py-4">{footer}</div>
    </DataCard>
  );
}
