import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ContactCustomer360View } from "../../../packages/contracts/src/contact-port";
import type { NoteRecord } from "../../../packages/contracts/src/notes";
import type { TaskRecord } from "../../../packages/contracts/src/tasks";
import type { CRMActivity, CRMLead, CRMOpportunity } from "../adapters/crm";
import { mobileTasksAdapter } from "../adapters/tasks";
import { flushOfflineMutations } from "../adapters/offlineQueue";
import { useT } from "../i18n";
import {
  MobilePageContainer,
  MobilePageTabs,
  MobileLoadingState,
  MobileEmptyState,
  MobileConfirmDialog,
  MobileBackLink,
} from "./ui";
import { mobileTheme } from "../theme/tokens";
import { MobileCustomer360ProfileHeader } from "./customer360/MobileCustomer360ProfileHeader";
import { MobileCustomer360CrmDetails } from "./customer360/MobileCustomer360CrmDetails";
import { MobileCustomer360Sales } from "./customer360/MobileCustomer360Sales";
import { MobileCustomer360Work } from "./customer360/MobileCustomer360Work";
import { MobileCustomer360Documents } from "./customer360/MobileCustomer360Documents";
import { MobileCustomer360Products } from "./customer360/MobileCustomer360Products";
import { MobileCustomer360Timeline } from "./customer360/MobileCustomer360Timeline";
import type { MobileNoteDraft } from "./MobileNoteEditor";

type TabId = "contact" | "sales" | "work" | "documents" | "products" | "activity";

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

export function MobileCustomer360Screen({
  view,
  loading,
  error,
  onBack,
  onEdit,
  onArchive,
  notes = [],
  notesLoading,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: Props) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<TabId>("contact");
  const [contactTasks, setContactTasks] = useState<TaskRecord[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [opportunities, setOpportunities] = useState<CRMOpportunity[]>([]);
  const [timeline, setTimeline] = useState<CRMActivity[]>([]);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    void flushOfflineMutations();
    if (typeof window !== "undefined") {
      window.addEventListener("online", flushOfflineMutations);
      return () => window.removeEventListener("online", flushOfflineMutations);
    }
  }, []);

  useEffect(() => {
    if (view) {
      setLeads((view.leads || []).map((item) => ({
        id: item.id,
        organizationId: view.contact.organizationId,
        contactId: view.contact.id,
        interest: item.name || item.summary || "",
        source: "customer360",
        status: "new" as const,
        ownerName: "",
        assignedUserId: "",
        score: null,
        createdAt: item.occurredAt || view.contact.createdAt,
        updatedAt: item.occurredAt || view.contact.updatedAt,
        lastActivityAt: item.occurredAt || null,
        nextActivityAt: null,
      })));
      setOpportunities((view.opportunities || []).map((item) => ({
        id: item.id,
        organizationId: view.contact.organizationId,
        contactId: view.contact.id,
        leadId: null,
        catalogItemId: null,
        productKey: null,
        name: item.name || item.summary || "Opportunity",
        amount: item.amount ?? null,
        currency: "EUR",
        stageKey: "prospecting" as const,
        origin: "manual" as const,
        ownerName: "",
        ownerId: "",
        expectedCloseAt: null,
        createdAt: item.occurredAt || view.contact.createdAt,
        updatedAt: item.occurredAt || view.contact.updatedAt,
      })));
      setTimeline((view.timeline || []).map((item) => ({
        id: item.id,
        sourceType: "note" as const,
        sourceId: item.id,
        type: "activity",
        summary: item.summary || item.name || "",
        occurredAt: item.occurredAt || view.contact.updatedAt,
        status: null,
      })));
    }
  }, [view]);

  const loadTasks = async (organizationId: string, contactId: string) => {
    try {
      const res = await mobileTasksAdapter.listTasks({
        organizationId,
        suite: "crm",
        relation: { entityType: "contact", entityId: contactId },
      });
      setContactTasks(res.items);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    if (view?.contact.id && view.contact.organizationId) {
      void loadTasks(view.contact.organizationId, view.contact.id);
    }
  }, [view?.contact.id]);

  const handleToggleTask = async (task: TaskRecord) => {
    const isCompleted = task.status === "completed";
    setContactTasks((curr) =>
      curr.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: isCompleted ? "open" : "completed",
              completedAt: isCompleted ? null : new Date().toISOString(),
            }
          : t,
      ),
    );
    if (isCompleted) {
      await mobileTasksAdapter.reopenTask(task.id);
    } else {
      await mobileTasksAdapter.completeTask(task.id);
    }
  };

  const handleCreateContactTask = async (
    title: string,
    priority: "normal" | "high" | "low",
    dueAt?: string,
  ) => {
    if (!view) return;
    const name = [view.contact.firstName, view.contact.lastName].filter(Boolean).join(" ");
    const res = await mobileTasksAdapter.createTask({
      organizationId: view.contact.organizationId,
      suite: "crm",
      title,
      priority,
      relation: { entityType: "contact", entityId: view.contact.id, label: name },
      dueAt: dueAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
    if (res.status === "success") {
      setContactTasks((curr) => [res.task, ...curr]);
    }
  };

  const handleCreateLead = async (lead: Partial<CRMLead>) => {
    const newLead: CRMLead = {
      id: `lead_${Date.now()}`,
      organizationId: view?.contact.organizationId || "",
      contactId: view?.contact.id || "",
      interest: lead.interest || "General",
      source: lead.source || "Direct",
      score: lead.score || 50,
      status: lead.status || "new",
      ownerName: lead.ownerName || "Alex Morgan",
      assignedUserId: "owner-alex",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      nextActivityAt: null,
    };
    setLeads((curr) => [newLead, ...curr]);
  };

  const handleCreateOpp = async (opp: Partial<CRMOpportunity>) => {
    const newOpp: CRMOpportunity = {
      id: `opp_${Date.now()}`,
      organizationId: view?.contact.organizationId || "",
      contactId: view?.contact.id || "",
      leadId: null,
      catalogItemId: null,
      productKey: null,
      name: opp.name || "Nueva Oportunidad",
      amount: opp.amount || 0,
      currency: opp.currency || "EUR",
      stageKey: opp.stageKey || "prospecting",
      origin: opp.origin || "manual",
      ownerName: opp.ownerName || "Alex Morgan",
      ownerId: "owner-alex",
      expectedCloseAt: opp.expectedCloseAt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOpportunities((curr) => [newOpp, ...curr]);
  };

  const handleExecuteArchive = async () => {
    if (!view || !onArchive) return;
    setArchiving(true);
    try {
      await onArchive(view.contact);
      setArchiveConfirmOpen(false);
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <MobilePageContainer>
        <MobileBackLink label={t("crm.contacts.back")} onPress={onBack} />
        <MobileLoadingState message={t("common.loading")} />
      </MobilePageContainer>
    );
  }

  if (error || !view) {
    return (
      <MobilePageContainer>
        <MobileBackLink label={t("crm.contacts.back")} onPress={onBack} />
        <MobileEmptyState
          title={t("crm.contacts.noContacts")}
          description={error || t("crm.contacts.noContacts")}
          actionLabel={t("crm.contacts.back")}
          onAction={onBack}
        />
      </MobilePageContainer>
    );
  }

  const { contact } = view;
  const fullName = [contact.preferredName || contact.firstName, contact.lastName, contact.secondLastName]
    .filter(Boolean)
    .join(" ");

  const openTasksCount = contactTasks.filter((t) => t.status !== "completed").length;
  const salesCount = leads.length + opportunities.length;
  const workCount = openTasksCount + notes.length;

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: "contact", label: t("crm.customer360.tabs.contactInfo") },
    { id: "sales", label: t("crm.customer360.tabs.sales"), count: salesCount },
    { id: "work", label: t("crm.customer360.tabs.work"), count: workCount },
    { id: "documents", label: t("crm.customer360.tabs.documents") },
    { id: "products", label: t("crm.customer360.tabs.products") },
    { id: "activity", label: t("crm.customer360.tabs.activity"), count: timeline.length },
  ];

  return (
    <MobilePageContainer>
      {/* Back to Contacts Navigation */}
      <MobileBackLink label={t("crm.contacts.back")} onPress={onBack} />

      {/* Top Profile Header Card with Avatar, Badge, SpeedDialBar, and Action buttons */}
      <MobileCustomer360ProfileHeader
        contact={contact}
        onEdit={onEdit}
        onArchive={onArchive ? () => setArchiveConfirmOpen(true) : undefined}
      />

      {/* Canonical Horizontal Page Tabs (No pills, 2.5px active indicator, badge counts) */}
      <View style={styles.tabContainer}>
        <MobilePageTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />
      </View>

      {/* Active Tab Workspace */}
      <View style={styles.tabContent}>
        {activeTab === "contact" && <MobileCustomer360CrmDetails contact={contact} />}

        {activeTab === "sales" && (
          <MobileCustomer360Sales
            leads={leads}
            opportunities={opportunities}
            contactId={contact.id}
            contactName={fullName}
            onCreateLead={handleCreateLead}
            onCreateOpportunity={handleCreateOpp}
          />
        )}

        {activeTab === "work" && (
          <MobileCustomer360Work
            tasks={contactTasks}
            notes={notes}
            contactId={contact.id}
            contactName={fullName}
            notesLoading={notesLoading}
            onToggleTask={handleToggleTask}
            onCreateTask={handleCreateContactTask}
            onCreateNote={onCreateNote}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote}
          />
        )}

        {activeTab === "documents" && (
          <MobileCustomer360Documents
            contactId={contact.id}
            contactName={fullName}
            organizationId={contact.organizationId}
          />
        )}

        {activeTab === "products" && (
          <MobileCustomer360Products
            contactId={contact.id}
            organizationId={contact.organizationId}
          />
        )}

        {activeTab === "activity" && (
          <MobileCustomer360Timeline
            timeline={timeline}
            contactId={contact.id}
          />
        )}
      </View>

      {/* Confirmation Dialog for Archiving */}
      <MobileConfirmDialog
        visible={archiveConfirmOpen}
        variant="destructive"
        title="¿Archivar contacto?"
        description={`¿Estás seguro de archivar a ${fullName}? Quedará registrado en la auditoría del sistema.`}
        confirmLabel="Archivar"
        cancelLabel="Cancelar"
        loading={archiving}
        onConfirm={handleExecuteArchive}
        onCancel={() => setArchiveConfirmOpen(false)}
      />
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    minHeight: 44,
  },
  backButtonText: {
    color: mobileTheme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  tabContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  tabContent: {
    paddingBottom: 24,
  },
});
