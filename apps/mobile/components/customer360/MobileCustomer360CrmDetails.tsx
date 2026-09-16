import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

interface Props {
  contact: ContactRecord;
}

type CrmSubTab = "identity" | "address" | "organization" | "channels";

export function MobileCustomer360CrmDetails({ contact }: Props) {
  const t = useT();
  const [activeSubTab, setActiveSubTab] = useState<CrmSubTab>("identity");

  const missingFields = [
    !contact.email && "email",
    !contact.phone && "phone",
    !contact.country && "country",
  ].filter((f): f is string => Boolean(f));

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

      {/* Sub-tab strip (Horizontal scrollable, no text wrapping) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabStrip}>
        <Pressable
          style={[styles.tabButton, activeSubTab === "identity" && styles.tabButtonActive]}
          onPress={() => setActiveSubTab("identity")}
        >
          <User size={13} color={activeSubTab === "identity" ? "#ffffff" : "#64748b"} />
          <Text style={[styles.tabButtonText, activeSubTab === "identity" && styles.tabButtonTextActive]}>
            {t("crm.customer360.subtabs.identity")}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeSubTab === "address" && styles.tabButtonActive]}
          onPress={() => setActiveSubTab("address")}
        >
          <MapPin size={13} color={activeSubTab === "address" ? "#ffffff" : "#64748b"} />
          <Text style={[styles.tabButtonText, activeSubTab === "address" && styles.tabButtonTextActive]}>
            {t("crm.customer360.subtabs.address")}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeSubTab === "organization" && styles.tabButtonActive]}
          onPress={() => setActiveSubTab("organization")}
        >
          <Building2 size={13} color={activeSubTab === "organization" ? "#ffffff" : "#64748b"} />
          <Text style={[styles.tabButtonText, activeSubTab === "organization" && styles.tabButtonTextActive]}>
            {t("crm.customer360.subtabs.organization")}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeSubTab === "channels" && styles.tabButtonActive]}
          onPress={() => setActiveSubTab("channels")}
        >
          <Phone size={13} color={activeSubTab === "channels" ? "#ffffff" : "#64748b"} />
          <Text style={[styles.tabButtonText, activeSubTab === "channels" && styles.tabButtonTextActive]}>
            {t("crm.customer360.subtabs.channels")}
          </Text>
        </Pressable>
      </ScrollView>

      {/* 1. Identity & Bio Section */}
      {activeSubTab === "identity" && (
        <View style={styles.sectionCard}>
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
          </View>
        </View>
      )}

      {/* 2. Address Section */}
      {activeSubTab === "address" && (
        <View style={styles.sectionCard}>
          <View style={styles.fieldsList}>
            <FieldItem label={t("crm.customer360.fields.country")} value={contact.country} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.city")} value={contact.city} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.state")} value={contact.stateProvince} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.postalCode")} value={contact.postalCode} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.addressLine1")} value={contact.addressLine1} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.addressLine2")} value={contact.addressLine2} emptyText={t("crm.customer360.fields.notRegistered")} />
          </View>
        </View>
      )}

      {/* 3. Organization & Role Section */}
      {activeSubTab === "organization" && (
        <View style={styles.sectionCard}>
          <View style={styles.fieldsList}>
            <FieldItem label={t("crm.customer360.fields.company")} value={contact.companyName} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.jobTitle")} value={contact.jobTitle} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.department")} value={contact.department} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.identityStatus")} value={contact.identityStatus?.replace("_", " ")} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.contactId")} value={contact.id} mono emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem
              label={t("crm.customer360.fields.createdAt")}
              value={new Date(contact.createdAt).toLocaleDateString()}
              emptyText={t("crm.customer360.fields.notRegistered")}
            />
            <FieldItem
              label={t("crm.customer360.fields.updatedAt")}
              value={new Date(contact.updatedAt).toLocaleDateString()}
              emptyText={t("crm.customer360.fields.notRegistered")}
            />
            {Object.entries(contact.attributes || {}).map(([key, val]) => (
              <FieldItem key={key} label={`Custom · ${key}`} value={typeof val === "object" ? JSON.stringify(val) : String(val)} emptyText={t("crm.customer360.fields.notRegistered")} />
            ))}
          </View>
        </View>
      )}

      {/* 4. Contact Channels Section */}
      {activeSubTab === "channels" && (
        <View style={styles.sectionCard}>
          <View style={styles.fieldsList}>
            <FieldItem label={t("crm.customer360.fields.email")} value={contact.email} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.secondaryEmail")} value={contact.secondaryEmail} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.phone")} value={contact.phone} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.secondaryPhone")} value={contact.secondaryPhone} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.preferredChannel")} value={contact.preferredChannel} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem
              label={t("crm.customer360.fields.preferredLanguage")}
              value={contact.preferredLanguage}
              emptyText={t("crm.customer360.fields.notRegistered")}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function FieldItem({
  label,
  value,
  emptyText,
  mono,
  copyable = true,
  onCopy,
  copied,
}: {
  label: string;
  value?: string | null;
  emptyText?: string;
  mono?: boolean;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  const [internalCopied, setInternalCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      return;
    }
    if (value && typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(value);
      setInternalCopied(true);
      setTimeout(() => setInternalCopied(false), 2000);
    }
  };

  const isCopied = copied ?? internalCopied;
  const isCopyable = copyable && Boolean(value);

  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLabelContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View style={styles.fieldValueContainer}>
        <Text
          style={[
            styles.fieldValue,
            !value && styles.fieldValueEmpty,
            mono && styles.fieldValueMono,
          ]}
          numberOfLines={2}
          selectable
        >
          {value || emptyText || "—"}
        </Text>
        {isCopyable && (
          <Pressable hitSlop={8} onPress={handleCopy} style={styles.copyButton}>
            {isCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} color="#94a3b8" />}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  tabScroll: {
    marginBottom: 6,
  },
  tabStrip: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tabButtonActive: {
    backgroundColor: "#135bec",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  tabButtonTextActive: {
    color: "#ffffff",
  },
  completenessBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  completeBanner: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  incompleteBanner: {
    backgroundColor: "#fffbeb",
    borderColor: "#fef3c7",
  },
  bannerCopy: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  completeTitle: {
    color: "#15803d",
  },
  incompleteTitle: {
    color: "#b45309",
  },
  bannerSubtitle: {
    fontSize: 11,
    color: "#92400e",
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  fieldsList: {
    gap: 8,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  fieldLabelContainer: {
    width: "42%",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  fieldValueContainer: {
    width: "58%",
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
    fontSize: 12,
    color: "#334155",
  },
  copyButton: {
    padding: 2,
  },
});
