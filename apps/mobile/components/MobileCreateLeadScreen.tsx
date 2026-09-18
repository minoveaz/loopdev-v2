import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  DollarSign,
  Sparkles,
  User,
  X,
} from "lucide-react-native";
import { mobileCrmAdapter, type CRMLead } from "../adapters/crm";
import { mobileContactAdapter } from "../adapters/contact";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";
import { useT } from "../i18n";

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={onCancel} style={styles.backButton}>
          <ArrowLeft size={18} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>{t("crm.leads.newLead")}</Text>
        <Pressable
          style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
          disabled={saving}
          onPress={handleSave}
        >
          <Check size={16} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.saveHeaderBtnText}>{t("common.save")}</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contact Selector Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>{t("crm.leads.selectContact")}</Text>

          <Pressable
            style={styles.contactSelectorTrigger}
            onPress={() => setContactPickerOpen(!contactPickerOpen)}
          >
            <View style={styles.contactSelectorRow}>
              <View style={styles.contactAvatarSmall}>
                <User size={14} color="#135bec" />
              </View>
              <View style={styles.contactSelectorCopy}>
                <Text style={styles.contactSelectedName}>
                  {selectedContact
                    ? [selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(" ")
                    : t("crm.leads.pickContact")}
                </Text>
                {selectedContact?.companyName && (
                  <Text style={styles.contactSelectedSub}>{selectedContact.companyName}</Text>
                )}
              </View>
            </View>
            <ChevronDown size={16} color="#64748b" />
          </Pressable>

          {/* Contact Picker List Dropdown */}
          {contactPickerOpen && (
            <View style={styles.contactPickerList}>
              {contacts.map((c) => {
                const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
                const active = c.id === selectedContactId;
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.contactPickerItem, active && styles.contactPickerItemActive]}
                    onPress={() => {
                      setSelectedContactId(c.id);
                      setContactPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.contactPickerItemText, active && styles.contactPickerItemTextActive]}>
                      {name} {c.companyName ? `(${c.companyName})` : ""}
                    </Text>
                    {active && <Check size={14} color="#135bec" />}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Lead Scope & Interest Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>{t("crm.leads.leadScope")}</Text>

          <Text style={styles.inputLabel}>{t("crm.leads.interest")} *</Text>
          <TextInput
            style={styles.textInput}
            value={interest}
            onChangeText={setInterest}
            placeholder="e.g. Enterprise Migration & AI Intelligence"
          />

          <Text style={styles.inputLabel}>{t("crm.leads.source")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {SOURCES.map((s) => (
              <Pressable
                key={s}
                style={[styles.optionPill, source === s && styles.optionPillActive]}
                onPress={() => setSource(s)}
              >
                <Text style={[styles.optionPillText, source === s && styles.optionPillTextActive]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.splitRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.inputLabel}>{t("crm.leads.estimatedValue")}</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={estimatedValue}
                onChangeText={setEstimatedValue}
                placeholder="25000"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>{t("crm.leads.currency")}</Text>
              <TextInput
                style={styles.textInput}
                value={currency}
                onChangeText={setCurrency}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        {/* Qualification BANT Notes Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>{t("crm.leads.qualificationNotes")}</Text>

          <Text style={styles.inputLabel}>{t("crm.leads.need")}</Text>
          <TextInput
            style={[styles.textInput, { height: 70, textAlignVertical: "top" }]}
            multiline
            value={need}
            onChangeText={setNeed}
            placeholder="Key business challenges, pain points, or project goals..."
          />

          <Text style={styles.inputLabel}>{t("crm.leads.timeline")}</Text>
          <TextInput
            style={styles.textInput}
            value={timeline}
            onChangeText={setTimeline}
            placeholder="e.g. Immediate / 1–3 months"
          />

          <Text style={styles.inputLabel}>{t("crm.leads.assignedOwner")}</Text>
          <View style={styles.ownerRow}>
            {OWNERS.map((o) => (
              <Pressable
                key={o.id}
                style={[styles.ownerPill, assignedOwner.id === o.id && styles.ownerPillActive]}
                onPress={() => setAssignedOwner(o)}
              >
                <Text style={[styles.ownerPillText, assignedOwner.id === o.id && styles.ownerPillTextActive]}>
                  {o.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={[styles.submitButton, saving && { opacity: 0.6 }]}
          disabled={saving}
          onPress={handleSave}
        >
          <Sparkles size={16} color="#ffffff" />
          <Text style={styles.submitButtonText}>{t("crm.leads.createLead")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  saveHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#135bec",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  saveHeaderBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 8,
  },
  cardHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginTop: 4,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#0f172a",
  },
  contactSelectorTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 10,
  },
  contactSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  contactAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  contactSelectorCopy: {
    flex: 1,
  },
  contactSelectedName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  contactSelectedSub: {
    fontSize: 11,
    color: "#64748b",
  },
  contactPickerList: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    maxHeight: 180,
    overflow: "scroll",
  },
  contactPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  contactPickerItemActive: {
    backgroundColor: "#eff6ff",
  },
  contactPickerItemText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },
  contactPickerItemTextActive: {
    color: "#135bec",
    fontWeight: "700",
  },
  pillRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
  },
  optionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionPillActive: {
    backgroundColor: "#135bec",
    borderColor: "#135bec",
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  optionPillTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  splitRow: {
    flexDirection: "row",
    gap: 10,
  },
  ownerRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  ownerPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  ownerPillActive: {
    backgroundColor: "#135bec",
    borderColor: "#135bec",
  },
  ownerPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  ownerPillTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#135bec",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
