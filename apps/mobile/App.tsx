import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import {
  getBottomNavigationItems,
  getContextualActions,
  loopdevNavigationContract,
  type SharedContextualAction,
} from "../../packages/contracts/src/navigation";
import { launchpadSuites } from "../../packages/contracts/src/launchpad";
import { contactNavigationRoutes, matchContactRoute } from "../../packages/contracts/src/contact-capability";
import type { ContactCustomer360View, ContactRecord, PotentialContactDuplicate } from "../../packages/contracts/src/contact-port";
import type { NoteRecord } from "../../packages/contracts/src/notes";
import { mobileContactAdapter } from "./adapters/contact";
import { mobileNotesAdapter } from "./adapters/notes";
import { MobileAccountScreen } from "./components/MobileAccountScreen";
import { MobileAccountSheet } from "./components/MobileAccountSheet";
import { MobileAppShell } from "./components/MobileAppShell";
import { MobileBottomNav, type MobileTab } from "./components/MobileBottomNav";
import { MobileCommandPalette } from "./components/MobileCommandPalette";
import { MobileHeader } from "./components/MobileHeader";
import { MobileNavigationDrawer } from "./components/MobileNavigationDrawer";
import { MobileRouteScreen } from "./components/MobileRouteScreen";
import { MobileSuiteCard } from "./components/MobileSuiteCard";
import { MobileWorkspaceScreen } from "./components/MobileWorkspaceScreen";
import { MobileContactsScreen } from "./components/MobileContactsScreen";
import { MobileCreateContactScreen } from "./components/MobileCreateContactScreen";
import { MobileCustomer360Screen } from "./components/MobileCustomer360Screen";
import { MobileDuplicateReviewScreen } from "./components/MobileDuplicateReviewScreen";
import { MobileLoginScreen } from "./components/MobileLoginScreen";
import { MobileForgotPasswordScreen } from "./components/MobileForgotPasswordScreen";
import { MobileLogoSpinner } from "./components/MobileLogoSpinner";
import { MobileTasksScreen } from "./components/MobileTasksScreen";
import { MobileDocumentIntelligenceScreen } from "./components/MobileDocumentIntelligenceScreen";
import { MobileLeadsScreen } from "./components/MobileLeadsScreen";
import { MobileLeadDetailScreen } from "./components/MobileLeadDetailScreen";
import { MobileCreateLeadScreen } from "./components/MobileCreateLeadScreen";
import MobilePipelineScreen from "./components/MobilePipelineScreen";
import { MobileOpportunityDetailScreen } from "./components/MobileOpportunityDetailScreen";
import { MobileCrmOperationsScreen } from "./components/MobileCrmOperationsScreen";
import { MobileProductCatalogScreen } from "./components/MobileProductCatalogScreen";
import { MobileCommunicationsScreen } from "./components/communications/MobileCommunicationsScreen";
import { MobileConversationScreen } from "./components/communications/MobileConversationScreen";
import { mobileAuthAdapter, mobileTenantContextAdapter } from "./adapters/auth";
import type { AuthSession, TenantContextSnapshot } from "../../packages/contracts/src/auth-port";
import type { MobileNoteDraft } from "./components/MobileNoteEditor";

const launchpadPath = loopdevNavigationContract.launchpad.path;
const morePath = getBottomNavigationItems().find((item) => item.slot === "more")!.path;
const initialPath = typeof window !== "undefined" && window.location.pathname.startsWith("/app/")
  ? window.location.pathname
  : launchpadPath;

export default function App() {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantContext, setTenantContext] = useState<TenantContextSnapshot | null>(() =>
    mobileTenantContextAdapter.getTenantContext(),
  );
  const [authMode, setAuthMode] = useState<"login" | "forgot_password">("login");
  const [authChecked, setAuthChecked] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [switchingOrg, setSwitchingOrg] = useState<{ isSwitching: boolean; orgName: string } | null>(null);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [customer360, setCustomer360] = useState<ContactCustomer360View | null>(null);
  const [editingContact, setEditingContact] = useState<ContactRecord | null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<PotentialContactDuplicate[]>([]);
  const [duplicateContact, setDuplicateContact] = useState<ContactRecord | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [mobileNotes, setMobileNotes] = useState<NoteRecord[]>([]);
  const [mobileNotesLoading, setMobileNotesLoading] = useState(false);

  useEffect(() => {
    void mobileAuthAdapter.getSession().then((sess) => {
      setSession(sess);
      setTenantContext(mobileTenantContextAdapter.getTenantContext());
      setAuthChecked(true);
    });
    const unsubAuth = mobileAuthAdapter.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT") {
        setSigningOut(true);
        setTimeout(() => {
          setSession(null);
          setTenantContext(null);
          setSigningOut(false);
          setAuthChecked(true);
        }, 650);
      } else if (event === "SIGNED_IN") {
        setSigningIn(true);
        setTimeout(() => {
          setSession(nextSession);
          setTenantContext(mobileTenantContextAdapter.getTenantContext());
          setSigningIn(false);
          setAuthChecked(true);
        }, 750);
      } else {
        setSession(nextSession);
        setTenantContext(mobileTenantContextAdapter.getTenantContext());
        setAuthChecked(true);
      }
    });
    const unsubTenant = mobileTenantContextAdapter.onTenantContextChange((nextCtx) => {
      setTenantContext(nextCtx);
    });
    return () => {
      unsubAuth();
      unsubTenant();
    };
  }, []);

  const activeOrgId = tenantContext?.activeOrganizationId || "80fce911-57c5-4a83-809f-78df6a3736f7";

  useEffect(() => {
    if (!session) {
      setContacts([]);
      return;
    }
    setContactError(null);
    void mobileContactAdapter.listContacts({ organizationId: activeOrgId, limit: 100, cursor: null })
      .then((page) => setContacts(page.items))
      .catch((cause: unknown) => setContactError(cause instanceof Error ? cause.message : "Unable to load contacts."));
  }, [session, activeOrgId]);

  useEffect(() => {
    const contactMatch = matchContactRoute(contactNavigationRoutes.detail, currentPath);
    if (!contactMatch) return;
    const contact = contacts.find((item) => item.id === contactMatch.contactId);
    if (!contact || customer360?.contact.id === contact.id) return;
    void mobileContactAdapter.getCustomer360(contact.id).then(setCustomer360);
    loadMobileNotes(contact.id);
  }, [contacts, currentPath, customer360]);

  function loadMobileNotes(contactId: string) {
    setMobileNotesLoading(true);
    void mobileNotesAdapter.listNotes({ scope: { organizationId: activeOrgId, workspaceId: null }, relation: { type: "contact", id: contactId }, limit: 25 })
      .then((result) => {
        if (result.status === "success") setMobileNotes(result.data.items);
      })
      .finally(() => setMobileNotesLoading(false));
  }

  function noteRelation(contact: ContactRecord) {
    const scope = { organizationId: activeOrgId, workspaceId: null };
    return { type: "contact" as const, id: contact.id, label: [contact.preferredName || contact.firstName, contact.lastName].filter(Boolean).join(" "), scope };
  }

  async function createMobileNote(contact: ContactRecord, draft: MobileNoteDraft) {
    const scope = { organizationId: activeOrgId, workspaceId: null };
    const result = await mobileNotesAdapter.createNote({
      scope,
      authorId: session?.user.id || "local-development-user",
      mode: draft.mode,
      content: draft.content,
      plainTextPreview: draft.body,
      visibility: draft.visibility,
      relations: [noteRelation(contact)],
      idempotencyKey: `mobile-${Date.now()}`,
    });
    if (result.status === "error") throw new Error(result.error.message);
    loadMobileNotes(contact.id);
  }

  async function updateMobileNote(noteId: string, version: number, contact: ContactRecord, draft: MobileNoteDraft) {
    const result = await mobileNotesAdapter.updateNote(noteId, {
      mode: draft.mode,
      content: draft.content,
      plainTextPreview: draft.body,
      visibility: draft.visibility,
      expectedVersion: version,
      idempotencyKey: `mobile-update-${Date.now()}`,
    });
    if (result.status === "error") throw new Error(result.error.message);
    loadMobileNotes(contact.id);
  }

  async function deleteMobileNote(note: NoteRecord, contact: ContactRecord) {
    const result = await mobileNotesAdapter.deleteNote(note.id, {
      expectedVersion: note.version,
      idempotencyKey: `mobile-delete-${Date.now()}`,
    });
    if (result.status === "error") throw new Error(result.error.message);
    loadMobileNotes(contact.id);
  }
  const activeSuite = useMemo(
    () => launchpadSuites.find((suite) => suite.entryPath && currentPath.startsWith(suite.entryPath)),
    [currentPath],
  );
  const context = currentPath.startsWith("/app/sales-crm")
    ? "crm"
    : currentPath.startsWith("/app/erp")
      ? "erp"
      : "launchpad";
  const activeTab: MobileTab = currentPath === morePath ? "more" : context;
  const actionContext = currentPath.startsWith("/app/conversations") ? "conversations" : context;

  function navigate(path: string) {
    setCurrentPath(path);
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setNavigationOpen(false);
  }

  function handleTabPress(tab: MobileTab) {
    const paths: Partial<Record<MobileTab, string>> = {
      launchpad: launchpadPath,
      conversations: "/app/conversations",
      crm: "/app/sales-crm/tasks",
      erp: "/app/erp/overview",
      more: morePath,
    };
    const path = paths[tab];
    if (path) navigate(path);
  }

  function renderContent() {
    if (currentPath === morePath) return <MobileAccountScreen />;
    if (currentPath === contactNavigationRoutes.list) return <MobileContactsScreen contacts={contacts} onCreate={() => { setEditingContact(null); navigate(contactNavigationRoutes.create); }} onView={(contact) => { void mobileContactAdapter.getCustomer360(contact.id).then(setCustomer360); loadMobileNotes(contact.id); navigate(contactNavigationRoutes.detail.replace(":contactId", encodeURIComponent(contact.id))); }} onEdit={(contact) => { setEditingContact(contact); navigate(contactNavigationRoutes.edit.replace(":contactId", encodeURIComponent(contact.id))); }} onDuplicates={() => { const source = contacts[0]; if (!source) return; setDuplicateContact(source); void mobileContactAdapter.findPotentialDuplicates(source.id).then(setDuplicateCandidates); navigate(contactNavigationRoutes.duplicates.replace(":contactId", encodeURIComponent(source.id))); }} onArchive={async (contact) => { const result = await mobileContactAdapter.archiveContact(contact.id, contact.updatedAt); if (result.status === "success") setContacts((current) => current.filter((item) => item.id !== contact.id)); }} />;
    if (currentPath === contactNavigationRoutes.create) return <MobileCreateContactScreen onCancel={() => navigate(contactNavigationRoutes.list)} onCreated={(contact) => { setContacts((current) => [...current, contact]); navigate(contactNavigationRoutes.list); }} />;
    const editMatch = matchContactRoute(contactNavigationRoutes.edit, currentPath);
    if (editMatch) {
      const contact = editingContact ?? contacts.find((item) => item.id === editMatch.contactId);
      return <MobileCreateContactScreen editingContact={contact} onCancel={() => navigate(contactNavigationRoutes.detail.replace(":contactId", encodeURIComponent(editMatch.contactId)))} onUpdated={(updated) => { setContacts((current) => current.map((item) => item.id === updated.id ? updated : item)); void mobileContactAdapter.getCustomer360(updated.id).then(setCustomer360); navigate(contactNavigationRoutes.detail.replace(":contactId", encodeURIComponent(updated.id))); }} />;
    }
    const duplicateMatch = matchContactRoute(contactNavigationRoutes.duplicates, currentPath);
    if (duplicateMatch) return <MobileDuplicateReviewScreen contact={duplicateContact ?? contacts.find((item) => item.id === duplicateMatch.contactId)} candidates={duplicateCandidates} onBack={() => navigate(contactNavigationRoutes.list)} onDismiss={(candidate) => Alert.alert("Confirm dismissal", "This action will be recorded in the duplicate-review audit trail.", [{ text: "Cancel", style: "cancel" }, { text: "Dismiss", onPress: () => { void mobileContactAdapter.dismissDuplicateReview(duplicateMatch.contactId, candidate.id, "DISMISS_DUPLICATE_REVIEW").then(() => mobileContactAdapter.findPotentialDuplicates(duplicateMatch.contactId).then(setDuplicateCandidates)); } }])} />;
    const contactMatch = matchContactRoute(contactNavigationRoutes.detail, currentPath);
    if (contactMatch) {
      const contact = contacts.find((item) => item.id === contactMatch.contactId);
      if (!customer360 || customer360.contact.id !== contact?.id) {
        return <MobileCustomer360Screen loading={!contactError} error={contactError} onBack={() => navigate(contactNavigationRoutes.list)} />;
      }
      return <MobileCustomer360Screen view={customer360} notes={mobileNotes} notesLoading={mobileNotesLoading} onCreateNote={(draft) => createMobileNote(contact, draft)} onUpdateNote={(noteId, version, draft) => updateMobileNote(noteId, version, contact, draft)} onDeleteNote={(note) => deleteMobileNote(note, contact)} onBack={() => navigate(contactNavigationRoutes.list)} onEdit={() => { setEditingContact(contact); navigate(contactNavigationRoutes.edit.replace(":contactId", encodeURIComponent(contact.id))); }} onArchive={async (target) => { const result = await mobileContactAdapter.archiveContact(target.id, target.updatedAt); if (result.status === "success") { setContacts((current) => current.filter((item) => item.id !== target.id)); navigate(contactNavigationRoutes.list); } }} />;
    }
    if (
      currentPath === "/app/sales-crm/tasks" ||
      currentPath === "/app/sales-crm/tasks/calendar" ||
      currentPath === "/app/tasks" ||
      currentPath === "/tasks" ||
      currentPath === "/crm/tasks"
    ) {
      return (
        <MobileTasksScreen
          onBack={() => navigate("/app/sales-crm/overview")}
          onNavigateToContact={(contactId) => {
            navigate(contactNavigationRoutes.detail.replace(":contactId", encodeURIComponent(contactId)));
          }}
        />
      );
    }
    if (currentPath.startsWith("/app/tools/document-intelligence")) {
      return (
        <MobileDocumentIntelligenceScreen
          onBack={() => navigate(launchpadPath)}
          onNavigateToContact={(contactId) => {
            navigate(contactNavigationRoutes.detail.replace(":contactId", encodeURIComponent(contactId)));
          }}
        />
      );
    }
    if (currentPath === "/app/sales-crm/leads") {
      return (
        <MobileLeadsScreen
          onViewLead={(lead) => navigate(`/app/sales-crm/leads/${lead.id}`)}
          onCreateLead={() => navigate("/app/sales-crm/leads/new")}
          onNavigateToContact={(contactId) => {
            navigate(contactNavigationRoutes.detail.replace(":contactId", encodeURIComponent(contactId)));
          }}
        />
      );
    }
    if (currentPath === "/app/sales-crm/leads/new") {
      return (
        <MobileCreateLeadScreen
          onCancel={() => navigate("/app/sales-crm/leads")}
          onCreated={(lead) => {
            navigate(`/app/sales-crm/leads/${lead.id}`);
          }}
        />
      );
    }
    if (currentPath.startsWith("/app/sales-crm/leads/")) {
      const leadId = currentPath.replace("/app/sales-crm/leads/", "");
      return (
        <MobileLeadDetailScreen
          leadId={leadId}
          onBack={() => navigate("/app/sales-crm/leads")}
          onNavigateToContact={(contactId) => {
            navigate(contactNavigationRoutes.detail.replace(":contactId", encodeURIComponent(contactId)));
          }}
        />
      );
    }
    if (currentPath === "/app/sales-crm/pipeline" || currentPath === "/app/sales-crm/opportunities") {
      return (
        <MobilePipelineScreen
          onBack={() => navigate("/app/sales-crm/overview")}
          onNavigate={(path) => navigate(path)}
        />
      );
    }
    if (currentPath.startsWith("/app/sales-crm/opportunities/")) {
      const oppId = currentPath.replace("/app/sales-crm/opportunities/", "");
      return (
        <MobileOpportunityDetailScreen
          opportunityId={oppId}
          onBack={() => navigate("/app/sales-crm/pipeline")}
          onNavigateToContact={(contactId) => {
            navigate(contactNavigationRoutes.detail.replace(":contactId", encodeURIComponent(contactId)));
          }}
        />
      );
    }
    if (
      currentPath === "/app/sales-crm/operations" ||
      currentPath === "/app/settings/crm/operations" ||
      currentPath === "/app/settings/data/operations"
    ) {
      return (
        <MobileCrmOperationsScreen
          onBack={() => navigate("/app/sales-crm/overview")}
          onNavigateToContact={(contactId) => {
            navigate(contactNavigationRoutes.detail.replace(":contactId", encodeURIComponent(contactId)));
          }}
        />
      );
    }
    if (
      currentPath === "/app/erp/product-catalog" ||
      currentPath === "/app/erp" ||
      currentPath === "/app/erp/overview" ||
      currentPath.startsWith("/app/erp/product-catalog/")
    ) {
      const catalogId = currentPath.startsWith("/app/erp/product-catalog/")
        ? currentPath.replace("/app/erp/product-catalog/", "")
        : undefined;
      return (
        <MobileProductCatalogScreen
          catalogId={catalogId}
          onBack={() => navigate(launchpadPath)}
        />
      );
    }
    if (
      currentPath === "/app/sales-crm/communications" ||
      currentPath === "/crm/communications" ||
      currentPath === "/communications"
    ) {
      return (
        <MobileCommunicationsScreen
          onSelectConversation={(id) => navigate(`/app/sales-crm/communications/${id}`)}
          onBack={() => navigate("/app/sales-crm/overview")}
          onNavigateToContact={(contactId) => {
            navigate(contactNavigationRoutes.detail.replace(":contactId", encodeURIComponent(contactId)));
          }}
        />
      );
    }
    if (currentPath.startsWith("/app/sales-crm/communications/")) {
      const convId = currentPath.replace("/app/sales-crm/communications/", "");
      return (
        <MobileConversationScreen
          conversationId={convId}
          onBack={() => navigate("/app/sales-crm/communications")}
          onNavigateToContact={(contactId) => {
            navigate(contactNavigationRoutes.detail.replace(":contactId", encodeURIComponent(contactId)));
          }}
        />
      );
    }
    if (activeSuite) {
      return <MobileWorkspaceScreen suite={activeSuite} onBack={() => navigate(launchpadPath)} onNavigate={(path) => navigate(path)} />;
    }
    if (currentPath !== launchpadPath) {
      const item = loopdevNavigationContract.groups.flatMap((group) => group.items).find((entry) => entry.path === currentPath);
      const action = (["launchpad", "crm", "erp", "conversations"] as const)
        .flatMap((actionContextKey) => getContextualActions(actionContextKey))
        .find((entry) => entry.path === currentPath);
      return <MobileRouteScreen label={item?.label ?? action?.label ?? "Workspace"} path={currentPath} />;
    }

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.eyebrow}><View style={styles.liveDot} /><Text style={styles.eyebrowText}>WORKSPACE LAUNCHER</Text></View>
        <Text style={styles.title}>Welcome, <Text style={styles.titleAccent}>Admin</Text>{`\n`}choose your next work context.</Text>
        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>AVAILABLE SUITES</Text><Text style={styles.sectionCount}>{launchpadSuites.filter((suite) => suite.status === "ready").length} ACTIVE</Text></View>
        {launchpadSuites.map((suite) => (
          <MobileSuiteCard
            key={suite.id}
            title={suite.title}
            description={suite.description}
            version={suite.version}
            kind={suite.illustration}
            status={suite.status}
            onPress={suite.status === "ready" && suite.entryPath ? () => navigate(suite.entryPath!) : undefined}
          />
        ))}
      </ScrollView>
    );
  }

  if (!authChecked) {
    return null;
  }

  if (signingOut) {
    return (
      <MobileAppShell>
        <View style={styles.logoutTransitionContainer}>
          <MobileLogoSpinner size={72} />
          <Text style={styles.transitionTitle}>Signing out of LoopDev</Text>
          <Text style={styles.transitionSubtitle}>Clearing session &amp; cached workspace context...</Text>
        </View>
      </MobileAppShell>
    );
  }

  if (signingIn) {
    return (
      <MobileAppShell>
        <View style={styles.logoutTransitionContainer}>
          <MobileLogoSpinner size={72} />
          <Text style={styles.transitionTitle}>Entering LoopDev Mobile</Text>
          <Text style={styles.transitionSubtitle}>Setting up workspace and permissions...</Text>
        </View>
      </MobileAppShell>
    );
  }

  if (switchingOrg) {
    return (
      <MobileAppShell>
        <View style={styles.logoutTransitionContainer}>
          <MobileLogoSpinner size={72} />
          <Text style={styles.transitionTitle}>Switching to {switchingOrg.orgName}</Text>
          <Text style={styles.transitionSubtitle}>Clearing local caches &amp; reloading workspace launcher...</Text>
        </View>
      </MobileAppShell>
    );
  }

  if (!session) {
    if (authMode === "forgot_password") {
      return (
        <MobileAppShell>
          <MobileForgotPasswordScreen
            onBackToLogin={() => setAuthMode("login")}
          />
        </MobileAppShell>
      );
    }
    return (
      <MobileAppShell>
        <MobileLoginScreen
          onLoginSuccess={() => {
            navigate(launchpadPath);
          }}
          onForgotPassword={() => setAuthMode("forgot_password")}
        />
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell>
      <MobileHeader
        onAccountPress={() => setAccountSheetOpen(true)}
        onLogoPress={() => navigate(launchpadPath)}
        onMenuPress={() => setNavigationOpen(true)}
      />
      <View style={styles.main}>{renderContent()}</View>
      <MobileBottomNav
        context={context}
        activeTab={activeTab}
        onActionPress={() => setActionsSheetOpen(true)}
        onTabPress={handleTabPress}
      />
      <MobileAccountSheet
        onClose={() => setAccountSheetOpen(false)}
        onSwitchOrg={(orgName) => {
          setAccountSheetOpen(false);
          setSwitchingOrg({ isSwitching: true, orgName });
          setCurrentPath(launchpadPath);
          if (typeof window !== "undefined" && window.location.pathname !== launchpadPath) {
            window.history.pushState({}, "", launchpadPath);
          }
          setTimeout(() => {
            setSwitchingOrg(null);
          }, 750);
        }}
        visible={accountSheetOpen}
      />
      <MobileCommandPalette
        context={actionContext}
        onAction={(action: SharedContextualAction) => {
          setActionsSheetOpen(false);
          navigate(action.path);
        }}
        onClose={() => setActionsSheetOpen(false)}
        visible={actionsSheetOpen}
      />
      <MobileNavigationDrawer
        activePath={currentPath}
        onClose={() => setNavigationOpen(false)}
        onNavigate={navigate}
        visible={navigationOpen}
      />
    </MobileAppShell>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 22, paddingTop: 32 },
  eyebrow: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 24 },
  liveDot: { backgroundColor: "#135bec", borderRadius: 5, height: 8, width: 8 },
  eyebrowText: { color: "#135bec", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  title: { color: "#111827", fontSize: 34, fontWeight: "700", letterSpacing: -1, lineHeight: 43, marginBottom: 14 },
  titleAccent: { color: "#135bec", fontWeight: "900" },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 16, marginTop: 14 },
  sectionLabel: { color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 1.4 },
  sectionCount: { color: "#135bec", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  logoutTransitionContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brandIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#135bec",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  infinityTextLarge: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 40,
  },
  transitionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 8,
    letterSpacing: -0.4,
  },
  transitionSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
});
