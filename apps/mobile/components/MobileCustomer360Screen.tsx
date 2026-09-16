import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ContactCustomer360View } from "../../../packages/contracts/src/contact-port";
import type { NoteRecord } from "../../../packages/contracts/src/notes";
import type { TaskRecord } from "../../../packages/contracts/src/tasks";
import type { CRMActivity, CRMLead, CRMOpportunity } from "../adapters/crm";
import { mobileTasksAdapter } from "../adapters/tasks";
import { MobileCustomer360ProfileHeader } from "./customer360/MobileCustomer360ProfileHeader";
import { MobileCustomer360CrmDetails } from "./customer360/MobileCustomer360CrmDetails";
import { MobileCustomer360Sales } from "./customer360/MobileCustomer360Sales";
import { MobileCustomer360Work } from "./customer360/MobileCustomer360Work";
import { MobileCustomer360Documents } from "./customer360/MobileCustomer360Documents";
import { MobileCustomer360Products } from "./customer360/MobileCustomer360Products";
import { MobileCustomer360Timeline } from "./customer360/MobileCustomer360Timeline";
import type { MobileNoteDraft } from "./MobileNoteEditor";

type TabId = "contact" | "sales" | "work" | "documents" | "products";

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
  const [activeTab, setActiveTab] = useState<TabId>("contact");
  const [contactTasks, setContactTasks] = useState<TaskRecord[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [opportunities, setOpportunities] = useState<CRMOpportunity[]>([]);
  const [timeline, setTimeline] = useState<CRMActivity[]>([]);

  useEffect(() => {
    if (view) {
      setLeads(view.leads || []);
      setOpportunities(view.opportunities || []);
      setTimeline(view.timeline || []);
    }
  }, [view]);

  const loadTasks = async (contactId: string) => {
    try {
      const res = await mobileTasksAdapter.listTasks({
        organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
        suite: "crm",
        relation: { entityType: "contact", entityId: contactId },
      });
      setContactTasks(res.items);
    } catch {
      // fallback
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
      organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
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
      organizationId: "local-development-organization",
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
      organizationId: "local-development-organization",
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

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={16} color="#135bec" />
          <Text style={styles.backButtonText}>Contactos</Text>
        </Pressable>
        <View style={styles.stateCenter}>
          <Text style={styles.stateTitle}>Cargando Customer 360...</Text>
          <Text style={styles.stateSubtitle}>Obteniendo datos del CRM unificado.</Text>
        </View>
      </View>
    );
  }

  if (error || !view) {
    return (
      <View style={styles.stateContainer}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={16} color="#135bec" />
          <Text style={styles.backButtonText}>Contactos</Text>
        </Pressable>
        <View style={styles.stateCenter}>
          <Text style={styles.stateTitle}>No se pudo cargar el contacto</Text>
          <Text style={styles.stateSubtitle}>{error || "El contacto solicitado no existe o fue archivado."}</Text>
        </View>
      </View>
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
    { id: "contact", label: "Contact information" },
    { id: "sales", label: "Sales", count: salesCount },
    { id: "work", label: "Work", count: workCount },
    { id: "documents", label: "Documents" },
    { id: "products", label: "Products" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Back to Contacts Navigation */}
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <ArrowLeft size={16} color="#135bec" />
        <Text style={styles.backButtonText}>Volver a contactos</Text>
      </Pressable>

      {/* Top Profile Header Card */}
      <MobileCustomer360ProfileHeader
        contact={contact}
        onEdit={onEdit}
        onArchive={() => onArchive?.(contact)}
      />

      {/* Horizontal Scrollable Tab Bar with Active Underline */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {tab.count !== undefined && (
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
                {isActive && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Tab Workspace */}
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
        />
      )}

      {activeTab === "products" && (
        <MobileCustomer360Products
          contactId={contact.id}
        />
      )}

      {/* Customer 360 Activity & Timeline (mirroring Desktop layout) */}
      <View style={styles.timelineSection}>
        <MobileCustomer360Timeline
          timeline={timeline}
          contactId={contact.id}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  backButtonText: {
    color: "#135bec",
    fontSize: 13,
    fontWeight: "700",
  },
  tabBarContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
    overflow: "hidden",
  },
  tabBarContent: {
    flexDirection: "row",
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    position: "relative",
    gap: 6,
  },
  tabItemActive: {},
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  tabLabelActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  tabBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: "#eff6ff",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  tabBadgeTextActive: {
    color: "#135bec",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 14,
    right: 14,
    height: 3,
    backgroundColor: "#135bec",
    borderRadius: 3,
  },
  timelineSection: {
    marginTop: 16,
  },
  stateContainer: {
    flex: 1,
    padding: 20,
  },
  stateCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  stateSubtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },
});
