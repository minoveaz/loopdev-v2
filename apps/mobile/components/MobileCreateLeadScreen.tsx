import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  ChevronDown,
  Sparkles,
  User,
} from "lucide-react-native";
import { mobileCrmAdapter, type CRMLead } from "../adapters/crm";
import { mobileContactAdapter } from "../adapters/contact";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";
import { useT } from "../i18n";
import {
  MobilePageContainer,
  MobileCard,
  MobileButton,
  MobileInput,
  MobileTextArea,
  MobileSelectSheet,
  MobilePageTabs,
  MobileBackLink,
} from "./ui";
import { mobileTheme } from "../theme/tokens";

interface Props {
  onCancel: () => void;
  onCreated: (lead: CRMLead) => void;
}

const SOURCES = ["Website", "Referral", "Partner", "Social", "Event", "Direct"];
const OWNERS = [
  { id: "owner-maya", name: "Maya Chen" },
  { id: "owner-jon", name: "Jon Bell" },
  { id: "owner-lee", name: "Lee Okafor" },
];

export function MobileCreateLeadScreen({ onCancel, onCreated }: Props) {
  const t = useT();
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [ownerPickerOpen, setOwnerPickerOpen] = useState(false);

  const [interest, setInterest] = useState("");
  const [source, setSource] = useState("Website");
  const [estimatedValue, setEstimatedValue] = useState("25000");
  const [currency, setCurrency] = useState("USD");
  const [need, setNeed] = useState("");
  const [timeline, setTimeline] = useState("1–3 months");
  const [assignedOwner, setAssignedOwner] = useState(OWNERS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void mobileContactAdapter
      .listContacts({
        organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
        limit: 100,
      })
      .then((res) => {
        const list = res.items || [];
        setContacts(list);
        if (list.length > 0) {
          setSelectedContactId(list[0].id);
        }
      });
  }, []);

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  const handleSave = async () => {
    if (!selectedContactId) {
      Alert.alert(t("common.error"), t("crm.leads.selectContactError"));
      return;
    }
    if (!interest.trim()) {
      Alert.alert(t("common.error"), t("crm.leads.interestRequiredError"));
      return;
    }

    setSaving(true);
    try {
      const created = await mobileCrmAdapter.createLead({
        organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
        contactId: selectedContactId,
        interest: interest.trim(),
        source,
        score: 75,
        status: "new",
        ownerName: assignedOwner.name,
        assignedUserId: assignedOwner.id,
        estimatedValue: estimatedValue ? Number(estimatedValue) : null,
        estimatedCurrency: currency,
        qualificationNeed: need.trim() || null,
        qualificationTimeline: timeline.trim() || null,
        lastActivityAt: new Date().toISOString(),
        nextActivityAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      });
      onCreated(created);
    } catch {
      Alert.alert(t("common.error"), t("crm.leads.createError"));
    } finally {
      setSaving(false);
    }
  };

  const contactOptions = contacts.map((c) => ({
    id: c.id,
    label: [c.firstName, c.lastName].filter(Boolean).join(" ") || "Sin nombre",
    description: c.companyName || c.email || undefined,
  }));

  const ownerOptions = OWNERS.map((o) => ({
    id: o.id,
    label: o.name,
    description: "Gestor Comercial",
  }));

  const sourceTabs = SOURCES.map((s) => ({
    id: s,
    label: s,
  }));

  return (
    <MobilePageContainer>
      {/* Top Header Bar with Canonical Back Link */}
      <View style={styles.topBackRow}>
        <MobileBackLink label={t("crm.leads.back", "Volver a leads")} onPress={onCancel} />
        <MobileButton
          variant="primary"
          size="sm"
          label={t("common.save")}
          loading={saving}
          onPress={handleSave}
        />
      </View>
      <Text style={styles.headerTitle}>{t("crm.leads.newLead")}</Text>

      {/* Contact Selector Card */}
      <MobileCard style={styles.card}>
        <Text style={styles.cardHeading}>{t("crm.leads.selectContact")}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Seleccionar contacto vinculado"
          style={styles.selectorTrigger}
          onPress={() => setContactPickerOpen(true)}
        >
          <View style={styles.selectorRow}>
            <View style={styles.contactAvatarSmall}>
              <User size={16} color={mobileTheme.colors.primary} />
            </View>
            <View style={styles.selectorCopy}>
              <Text style={styles.selectedName}>
                {selectedContact
                  ? [selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(" ")
                  : t("crm.leads.pickContact")}
              </Text>
              {selectedContact?.companyName && (
                <Text style={styles.selectedSub}>{selectedContact.companyName}</Text>
              )}
            </View>
          </View>
          <ChevronDown size={18} color="#64748b" />
        </Pressable>
      </MobileCard>

      {/* Lead Scope & Interest Card */}
      <MobileCard style={styles.card}>
        <Text style={styles.cardHeading}>{t("crm.leads.leadScope")}</Text>

        <MobileInput
          label={`${t("crm.leads.interest")} *`}
          value={interest}
          onChangeText={setInterest}
          placeholder="p. ej. Migración Cloud empresarial & IA"
        />

        <Text style={styles.sectionLabel}>{t("crm.leads.source")}</Text>
        <View style={styles.tabsWrapper}>
          <MobilePageTabs
            tabs={sourceTabs}
            activeTab={source}
            onTabChange={(id) => setSource(id)}
          />
        </View>

        <View style={styles.splitRow}>
          <View style={{ flex: 2 }}>
            <MobileInput
              label={t("crm.leads.estimatedValue")}
              value={estimatedValue}
              onChangeText={setEstimatedValue}
              keyboardType="numeric"
              placeholder="25000"
            />
          </View>
          <View style={{ flex: 1 }}>
            <MobileInput
              label={t("crm.leads.currency")}
              value={currency}
              onChangeText={setCurrency}
              autoCapitalize="characters"
              placeholder="USD"
            />
          </View>
        </View>
      </MobileCard>

      {/* Qualification BANT Notes Card */}
      <MobileCard style={styles.card}>
        <Text style={styles.cardHeading}>{t("crm.leads.qualificationNotes")}</Text>

        <MobileTextArea
          label={t("crm.leads.need")}
          value={need}
          onChangeText={setNeed}
          placeholder="Desafíos comerciales clave, problemas a resolver u objetivos del proyecto..."
          rows={3}
        />

        <MobileInput
          label={t("crm.leads.timeline")}
          value={timeline}
          onChangeText={setTimeline}
          placeholder="p. ej. Inmediato / 1–3 meses"
        />

        <Text style={styles.sectionLabel}>{t("crm.leads.assignedOwner")}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Seleccionar gestor asignado"
          style={styles.selectorTrigger}
          onPress={() => setOwnerPickerOpen(true)}
        >
          <View style={styles.selectorRow}>
            <View style={styles.contactAvatarSmall}>
              <User size={16} color={mobileTheme.colors.primary} />
            </View>
            <View style={styles.selectorCopy}>
              <Text style={styles.selectedName}>{assignedOwner.name}</Text>
              <Text style={styles.selectedSub}>Gestor Comercial</Text>
            </View>
          </View>
          <ChevronDown size={18} color="#64748b" />
        </Pressable>
      </MobileCard>

      {/* Contact Select Sheet */}
      <MobileSelectSheet
        visible={contactPickerOpen}
        onClose={() => setContactPickerOpen(false)}
        title="Seleccionar Contacto"
        options={contactOptions}
        selectedId={selectedContactId}
        onSelect={(id) => {
          setSelectedContactId(id);
          setContactPickerOpen(false);
        }}
      />

      {/* Owner Select Sheet */}
      <MobileSelectSheet
        visible={ownerPickerOpen}
        onClose={() => setOwnerPickerOpen(false)}
        title="Asignar Propietario"
        options={ownerOptions}
        selectedId={assignedOwner.id}
        onSelect={(id) => {
          const found = OWNERS.find((o) => o.id === id);
          if (found) setAssignedOwner(found);
          setOwnerPickerOpen(false);
        }}
      />
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  topBackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: mobileTheme.colors.textPrimary,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    marginBottom: 14,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: mobileTheme.colors.textPrimary,
    marginBottom: 12,
  },
  selectorTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: mobileTheme.colors.background,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.input,
    padding: 12,
    minHeight: 52,
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  contactAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: mobileTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorCopy: {
    flex: 1,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.textPrimary,
  },
  selectedSub: {
    fontSize: 12,
    color: mobileTheme.colors.textSecondary,
    marginTop: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: mobileTheme.colors.textPrimary,
    marginTop: 6,
    marginBottom: 8,
  },
  tabsWrapper: {
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: "row",
    gap: 12,
  },
});
