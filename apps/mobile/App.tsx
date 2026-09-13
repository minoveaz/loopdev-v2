import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";
import {
  getBottomNavigationItems,
  getContextualActions,
  loopdevNavigationContract,
  type SharedContextualAction,
} from "../../packages/contracts/src/navigation";
import { launchpadSuites } from "../../packages/contracts/src/launchpad";
import { contactListFixtures } from "../../packages/contracts/src/contact-fixtures";
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
import { MobileContactsScreen, type MobileContactPreview } from "./components/MobileContactsScreen";
import { MobileCreateContactScreen } from "./components/MobileCreateContactScreen";

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
  const [contacts, setContacts] = useState<MobileContactPreview[]>(() => contactListFixtures.map((contact) => {
    const [firstName, ...lastNameParts] = contact.name.split(" ");
    return {
      id: contact.id,
      firstName,
      lastName: lastNameParts.join(" "),
      companyName: contact.companyName,
      jobTitle: contact.jobTitle,
      preferredChannel: contact.preferredChannel,
      identityStatus: contact.identityStatus,
      city: contact.city,
      stateProvince: "",
      country: contact.country,
      email: contact.email,
      phone: contact.phone,
      updatedAt: contact.updatedAt,
    };
  }));
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
    if (currentPath === "/app/sales-crm/contacts") return <MobileContactsScreen contacts={contacts} onCreate={() => navigate("/app/sales-crm/contacts/new")} onView={(contact) => navigate(`/app/sales-crm/contacts/${contact.id}`)} onArchive={(contact) => setContacts((current) => current.filter((item) => item.id !== contact.id))} />;
    if (currentPath === "/app/sales-crm/contacts/new") return <MobileCreateContactScreen onCancel={() => navigate("/app/sales-crm/contacts")} onCreated={(contact) => { setContacts((current) => [...current, contact]); navigate("/app/sales-crm/contacts"); }} />;
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
