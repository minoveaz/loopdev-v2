import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import {
  getBottomNavigationItems,
  getContextualActions,
  loopdevNavigationContract,
  type SharedContextualAction,
} from "../../packages/contracts/src/navigation";
import { launchpadSuites } from "../../packages/contracts/src/launchpad";
// The runtime bridge is intentionally loaded at runtime so Expo can share the
// canonical local adapter without compiling the desktop-only dependency graph.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contactPort } = require("../../src/loopdev/domains/crm/adapter") as { contactPort: any };
type CRMContact = any;
type Customer360View = any;
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
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [customer360, setCustomer360] = useState<Customer360View | null>(null);
  const [editingContact, setEditingContact] = useState<CRMContact | null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<any[]>([]);
  const [duplicateContact, setDuplicateContact] = useState<CRMContact | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  useEffect(() => {
    void contactPort.listContacts({ organizationId: "local-development-organization", limit: 100, cursor: null })
      .then((page: any) => setContacts(page.items))
      .catch((cause: unknown) => setContactError(cause instanceof Error ? cause.message : "Unable to load contacts."));
  }, []);
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
      crm: "/app/sales-crm/overview",
      erp: "/app/erp/overview",
      more: morePath,
    };
    const path = paths[tab];
    if (path) navigate(path);
  }

  function renderContent() {
    if (currentPath === morePath) return <MobileAccountScreen />;
    if (currentPath === "/app/sales-crm/contacts") return <MobileContactsScreen contacts={contacts} onCreate={() => { setEditingContact(null); navigate("/app/sales-crm/contacts/new"); }} onView={(contact) => { void contactPort.getCustomer360(contact.id).then(setCustomer360); navigate(`/app/sales-crm/contacts/${contact.id}`); }} onEdit={(contact) => { setEditingContact(contact); navigate(`/app/sales-crm/contacts/${contact.id}/edit`); }} onDuplicates={() => { const source = contacts[0]; if (!source) return; setDuplicateContact(source); void contactPort.findPotentialDuplicates(source.id).then(setDuplicateCandidates); navigate(`/app/sales-crm/contacts/${source.id}/duplicates`); }} onArchive={async (contact) => { const result = await contactPort.archiveContact(contact.id, contact.updatedAt); if (result.status === "success") setContacts((current) => current.filter((item) => item.id !== contact.id)); }} />;
    if (currentPath === "/app/sales-crm/contacts/new") return <MobileCreateContactScreen onCancel={() => navigate("/app/sales-crm/contacts")} onCreated={(contact) => { setContacts((current) => [...current, contact]); navigate("/app/sales-crm/contacts"); }} />;
    const editMatch = currentPath.match(/^\/app\/sales-crm\/contacts\/([^/]+)\/edit$/);
    if (editMatch) {
      const contact = editingContact ?? contacts.find((item) => item.id === decodeURIComponent(editMatch[1]));
      return <MobileCreateContactScreen editingContact={contact} onCancel={() => navigate(`/app/sales-crm/contacts/${editMatch[1]}`)} onUpdated={(updated) => { setContacts((current) => current.map((item) => item.id === updated.id ? updated : item)); void contactPort.getCustomer360(updated.id).then(setCustomer360); navigate(`/app/sales-crm/contacts/${updated.id}`); }} />;
    }
    const duplicateMatch = currentPath.match(/^\/app\/sales-crm\/contacts\/([^/]+)\/duplicates$/);
    if (duplicateMatch) return <MobileDuplicateReviewScreen contact={duplicateContact ?? contacts.find((item) => item.id === decodeURIComponent(duplicateMatch[1]))} candidates={duplicateCandidates} onBack={() => navigate("/app/sales-crm/contacts")} onDismiss={(candidate) => Alert.alert("Confirm dismissal", "This action will be recorded in the duplicate-review audit trail.", [{ text: "Cancel", style: "cancel" }, { text: "Dismiss", onPress: () => { void contactPort.dismissDuplicateReview(decodeURIComponent(duplicateMatch[1]), candidate.id, "DISMISS_DUPLICATE_REVIEW").then(() => contactPort.findPotentialDuplicates(decodeURIComponent(duplicateMatch[1])).then(setDuplicateCandidates)); } }])} />;
    const contactMatch = currentPath.match(/^\/app\/sales-crm\/contacts\/([^/]+)$/);
    if (contactMatch) {
      const contact = contacts.find((item) => item.id === decodeURIComponent(contactMatch[1]));
      if (!customer360 || customer360.contact.id !== contact?.id) {
        if (contact) void contactPort.getCustomer360(contact.id).then(setCustomer360);
        return <MobileCustomer360Screen loading={!contactError} error={contactError} onBack={() => navigate("/app/sales-crm/contacts")} />;
      }
      return <MobileCustomer360Screen view={customer360} onBack={() => navigate("/app/sales-crm/contacts")} onEdit={() => { setEditingContact(contact); navigate(`/app/sales-crm/contacts/${contact.id}/edit`); }} onArchive={async (target) => { const result = await contactPort.archiveContact(target.id, target.updatedAt); if (result.status === "success") { setContacts((current) => current.filter((item) => item.id !== target.id)); navigate("/app/sales-crm/contacts"); } }} />;
    }
    if (activeSuite) {
      return <MobileWorkspaceScreen suite={activeSuite} onBack={() => navigate(launchpadPath)} />;
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
      <MobileAccountSheet onClose={() => setAccountSheetOpen(false)} visible={accountSheetOpen} />
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
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  sectionLabel: { color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  sectionCount: { color: "#64748b", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
});
