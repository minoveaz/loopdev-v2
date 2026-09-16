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

interface Props {
  contact: ContactRecord;
}

type CrmSubTab = "identity" | "address" | "organization" | "channels";

export function MobileCustomer360CrmDetails({ contact }: Props) {
  const t = useT();
  const [activeSubTab, setActiveSubTab] = useState<CrmSubTab>("identity");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const missingFields = [
    !contact.email && t("crm.customer360.fields.primaryEmail"),
    !contact.phone && t("crm.customer360.fields.primaryPhone"),
    !contact.country && t("crm.customer360.fields.country"),
    !contact.documentNumber && t("crm.customer360.fields.docNumber"),
  ].filter((f): f is string => Boolean(f));

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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

      {/* Sub-tab strip in requested order: Identity, Address, Organization, Channels */}
      <View style={styles.tabStrip}>
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
      </View>

      {/* 1. Identity & Bio Section */}
      {activeSubTab === "identity" && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <User size={15} color="#135bec" />
            </View>
            <Text style={styles.sectionTitle}>{t("crm.customer360.sections.identityTitle")}</Text>
          </View>

          <View style={styles.fieldsList}>
            <FieldItem label={t("crm.customer360.fields.firstName")} value={contact.firstName} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.lastName")} value={contact.lastName} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.secondLastName")} value={contact.secondLastName} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.preferredName")} value={contact.preferredName} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.docType")} value={contact.documentType} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem
              label={t("crm.customer360.fields.docNumber")}
              value={contact.documentNumber}
              emptyText={t("crm.customer360.fields.notRegistered")}
              mono
              onCopy={
                contact.documentNumber
                  ? () => copyToClipboard(contact.documentNumber!, "doc")
                  : undefined
              }
              copied={copiedKey === "doc"}
            />
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
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <MapPin size={15} color="#135bec" />
            </View>
            <Text style={styles.sectionTitle}>{t("crm.customer360.sections.addressTitle")}</Text>
          </View>

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
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Building2 size={15} color="#135bec" />
            </View>
            <Text style={styles.sectionTitle}>{t("crm.customer360.sections.orgTitle")}</Text>
          </View>

          <View style={styles.fieldsList}>
            <FieldItem label={t("crm.customer360.fields.company")} value={contact.companyName} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.jobTitle")} value={contact.jobTitle} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.department")} value={contact.department} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem label={t("crm.customer360.fields.identityStatus")} value={contact.identityStatus} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem
              label={t("crm.customer360.fields.contactId")}
              value={contact.id}
              mono
              emptyText={t("crm.customer360.fields.notRegistered")}
              onCopy={() => copyToClipboard(contact.id, "id")}
              copied={copiedKey === "id"}
            />
            <FieldItem
              label={t("crm.customer360.fields.createdAt")}
              value={new Date(contact.createdAt).toLocaleString()}
              emptyText={t("crm.customer360.fields.notRegistered")}
            />
            <FieldItem
              label={t("crm.customer360.fields.updatedAt")}
              value={new Date(contact.updatedAt).toLocaleString()}
              emptyText={t("crm.customer360.fields.notRegistered")}
            />
            {Object.entries(contact.attributes || {}).map(([key, val]) => (
              <FieldItem key={key} label={key} value={String(val)} emptyText={t("crm.customer360.fields.notRegistered")} />
            ))}
          </View>
        </View>
      )}

      {/* 4. Contact Channels Section */}
      {activeSubTab === "channels" && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Phone size={15} color="#135bec" />
            </View>
            <Text style={styles.sectionTitle}>{t("crm.customer360.sections.channelsTitle")}</Text>
          </View>

          <View style={styles.fieldsList}>
            <FieldItem
              label={t("crm.customer360.fields.primaryEmail")}
              value={contact.email}
              emptyText={t("crm.customer360.fields.notRegistered")}
              onCopy={contact.email ? () => copyToClipboard(contact.email!, "email") : undefined}
              copied={copiedKey === "email"}
            />
            <FieldItem label={t("crm.customer360.fields.secondaryEmail")} value={contact.secondaryEmail} emptyText={t("crm.customer360.fields.notRegistered")} />
            <FieldItem
              label={t("crm.customer360.fields.primaryPhone")}
              value={contact.phone}
              emptyText={t("crm.customer360.fields.notRegistered")}
              onCopy={contact.phone ? () => copyToClipboard(contact.phone!, "phone") : undefined}
              copied={copiedKey === "phone"}
            />
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
  onCopy,
  copied,
}: {
  label: string;
  value?: string | null;
  emptyText?: string;
  mono?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
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
        {onCopy && value && (
          <Pressable hitSlop={6} onPress={onCopy} style={styles.copyButton}>
            {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} color="#94a3b8" />}
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
  tabStrip: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: "#135bec",
  },
  tabButtonText: {
    fontSize: 11,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 10,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
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
