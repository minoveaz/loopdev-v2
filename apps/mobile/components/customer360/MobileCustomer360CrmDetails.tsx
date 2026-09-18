import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  MapPin,
  Phone,
  User,
} from "lucide-react-native";
import type { ContactRecord } from "../../../../packages/contracts/src/contact-port";
import { useT } from "../../i18n";
import {
  MobilePageTabs,
  MobileCard,
} from "../ui";

interface Props {
  contact: ContactRecord;
}

type CrmSubTab = "identity" | "address" | "organization" | "channels";

export function MobileCustomer360CrmDetails({ contact }: Props) {
  const t = useT();
  const [activeSubTab, setActiveSubTab] = useState<string>("identity");

  const missingFields = [
    !contact.email && "email",
    !contact.phone && "phone",
    !contact.country && "country",
  ].filter((f): f is string => Boolean(f));

  const crmTabs = [
    { id: "identity", label: t("crm.customer360.subtabs.identity") },
    { id: "address", label: t("crm.customer360.subtabs.address") },
    { id: "organization", label: t("crm.customer360.subtabs.organization") },
    { id: "channels", label: t("crm.customer360.subtabs.channels") },
  ];

  return (
    <View style={styles.container}>
      {/* Quality & Completeness Banner */}
      <View
        style={[
          styles.completenessBanner,
          missingFields.length > 0 ? styles.incompleteBanner : styles.completeBanner,
        ]}
      >
        {missingFields.length > 0 ? (
          <AlertTriangle size={16} color="#b45309" />
        ) : (
          <CheckCircle2 size={16} color="#15803d" />
        )}
        <View style={styles.bannerCopy}>
          <Text
            style={[
              styles.bannerTitle,
              missingFields.length > 0 ? styles.incompleteTitle : styles.completeTitle,
            ]}
          >
            {missingFields.length > 0
              ? t("crm.customer360.completeness.incomplete")
              : t("crm.customer360.completeness.complete")}
          </Text>
          {missingFields.length > 0 && (
            <Text style={styles.bannerSubtitle}>
              {t("crm.customer360.completeness.missing", { fields: missingFields.join(", ") })}
            </Text>
          )}
        </View>
      </View>

      {/* Sub-tab strip (Canonical MobilePageTabs, STRICTLY NO PILLS) */}
      <MobilePageTabs
        tabs={crmTabs}
        activeTab={activeSubTab}
        onTabChange={setActiveSubTab}
      />

      {/* 1. Identity & Bio Section */}
      {activeSubTab === "identity" && (
        <MobileCard style={styles.sectionCard}>
          <View style={styles.fieldsList}>
            <FieldItem label={t("crm.customer360.fields.firstName")} value={contact.firstName} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.lastName")} value={contact.lastName} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.secondLastName")} value={contact.secondLastName} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.preferredName")} value={contact.preferredName} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.docType")} value={contact.documentType} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.docNumber")} value={contact.documentNumber} mono emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem
              label={t("crm.customer360.fields.birthDate")}
              value={contact.birthDate ? new Date(contact.birthDate).toLocaleDateString() : null}
              emptyText={t("crm.customer360.fields.notRegistered")}
            />
            <FieldItem label={t("crm.customer360.fields.gender")} value={contact.gender} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.nationality")} value={contact.nationality} emptyText={t("crm.customer360.fields.notRegistered")} />
          </View>
        </MobileCard>
      )}

      {/* 2. Address & Location Section */}
      {activeSubTab === "address" && (
        <MobileCard style={styles.sectionCard}>
          <View style={styles.fieldsList}>
            <FieldItem label={t("crm.customer360.fields.address")} value={contact.addressLine1} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.addressLine2")} value={contact.addressLine2} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.city")} value={contact.city} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.state")} value={contact.state} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.postalCode")} value={contact.postalCode} mono emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.country")} value={contact.country} emptyText={t("crm.customer360.fields.notRegistered")} />
          </View>
        </MobileCard>
      )}

      {/* 3. Organization & Work Section */}
      {activeSubTab === "organization" && (
        <MobileCard style={styles.sectionCard}>
          <View style={styles.fieldsList}>
            <FieldItem label={t("crm.customer360.fields.company")} value={contact.organizationName} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.taxId")} value={contact.taxId} mono emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.jobTitle")} value={contact.jobTitle} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.department")} value={contact.department} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.lifecycleStage")} value={contact.lifecycleStage} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.leadSource")} value={contact.leadSource} emptyText={t("crm.customer360.fields.notRegistered")} />
          </View>
        </MobileCard>
      )}

      {/* 4. Communication Channels & Social */}
      {activeSubTab === "channels" && (
        <MobileCard style={styles.sectionCard}>
          <View style={styles.fieldsList}>
            <FieldItem label={t("crm.customer360.fields.email")} value={contact.email} emptyText={t("crm.customer360.fields.notRegistered")} copyable />
            <FieldItem label={t("crm.customer360.fields.secondaryEmail")} value={contact.secondaryEmail} emptyText={t("crm.customer360.fields.notRegistered")} copyable />
            <FieldItem label={t("crm.customer360.fields.phone")} value={contact.phone} emptyText={t("crm.customer360.fields.notRegistered")} copyable />
            <FieldItem label={t("crm.customer360.fields.mobilePhone")} value={contact.mobilePhone} emptyText={t("crm.customer360.fields.notRegistered")} copyable />
            <FieldItem label={t("crm.customer360.fields.website")} value={contact.website} emptyText={t("crm.customer360.fields.notRegistered")} copyable />
            <FieldItem label={t("crm.customer360.fields.linkedinUrl")} value={contact.linkedinUrl} emptyText={t("crm.customer360.fields.notRegistered")} copyable />
          </View>
        </MobileCard>
      )}
    </View>
  );
}

function FieldItem({
  label,
  value,
  mono,
  emptyText = "Not registered",
  copyable,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  emptyText?: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasValue = Boolean(value && value.trim());

  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLabelCol}>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View style={styles.fieldValueCol}>
        <Text
          style={[
            styles.fieldValue,
            !hasValue && styles.fieldValueEmpty,
            mono && styles.fieldValueMono,
          ]}
          numberOfLines={2}
        >
          {hasValue ? value : emptyText}
        </Text>
        {copyable && hasValue && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Copiar ${label}`}
            onPress={handleCopy}
            hitSlop={8}
            style={styles.copyBtn}
          >
            {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} color="#94a3b8" />}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  completenessBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  incompleteBanner: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  completeBanner: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  bannerCopy: {
    marginLeft: 10,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  incompleteTitle: {
    color: "#92400e",
  },
  completeTitle: {
    color: "#166534",
  },
  bannerSubtitle: {
    fontSize: 11,
    color: "#b45309",
    marginTop: 2,
  },
  sectionCard: {
    marginTop: 12,
    padding: 14,
  },
  fieldsList: {
    gap: 12,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
  },
  fieldLabelCol: {
    width: "40%",
  },
  fieldLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  fieldValueCol: {
    width: "60%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "right",
  },
  fieldValueEmpty: {
    color: "#94a3b8",
    fontStyle: "italic",
    fontWeight: "400",
  },
  fieldValueMono: {
    fontFamily: "monospace",
  },
  copyBtn: {
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
