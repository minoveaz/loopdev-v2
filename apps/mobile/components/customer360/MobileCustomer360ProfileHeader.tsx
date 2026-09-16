import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Archive, Mail, Pencil, Phone, ShieldAlert, ShieldCheck } from "lucide-react-native";
import type { ContactRecord } from "../../../../packages/contracts/src/contact-port";
import { useT } from "../../i18n";

interface Props {
  contact: ContactRecord;
  onEdit?: () => void;
  onArchive?: () => void;
}

export function MobileCustomer360ProfileHeader({ contact, onEdit, onArchive }: Props) {
  const t = useT();
  const name = [contact.preferredName || contact.firstName, contact.lastName, contact.secondLastName]
    .filter(Boolean)
    .join(" ");

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const handleEmail = () => {
    if (contact.email) {
      void Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleCall = () => {
    if (contact.phone) {
      void Linking.openURL(`tel:${contact.phone}`);
    }
  };

  const subtitle = [contact.jobTitle, contact.companyName].filter(Boolean).join(" · ") || contact.email || null;

  return (
    <View style={styles.card}>
      {/* Top Banner if Archived */}
      {contact.archivedAt && (
        <View style={styles.archivedBanner}>
          <ShieldAlert size={14} color="#b91c1c" />
          <Text style={styles.archivedText}>
            {t("crm.contacts.archived", { date: new Date(contact.archivedAt).toLocaleDateString() })}
          </Text>
        </View>
      )}

      {/* Hero row with Avatar and Details */}
      <View style={styles.heroRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "C"}</Text>
        </View>
        <View style={styles.heroCopy}>
          <View style={styles.nameRow}>
            <Text style={styles.title} numberOfLines={1}>{name}</Text>
            {contact.identityStatus === "verified" ? (
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={13} color="#15803d" />
              </View>
            ) : contact.identityStatus === "pending_identity_review" ? (
              <View style={styles.pendingBadge}>
                <ShieldAlert size={13} color="#b45309" />
              </View>
            ) : null}
          </View>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Quick Action Buttons (Call / Email / Edit / Archive) */}
      <View style={styles.actionsGrid}>
        {contact.email ? (
          <Pressable style={styles.actionButton} onPress={handleEmail}>
            <Mail size={14} color="#135bec" />
            <Text style={styles.actionButtonText}>{t("crm.contacts.email")}</Text>
          </Pressable>
        ) : null}

        {contact.phone ? (
          <Pressable style={styles.actionButton} onPress={handleCall}>
            <Phone size={14} color="#135bec" />
            <Text style={styles.actionButtonText}>{t("crm.contacts.call")}</Text>
          </Pressable>
        ) : null}

        <Pressable style={[styles.actionButton, styles.editActionButton]} onPress={onEdit}>
          <Pencil size={14} color="#ffffff" />
          <Text style={[styles.actionButtonText, styles.editActionText]}>{t("crm.contacts.edit")}</Text>
        </Pressable>

        {onArchive && (
          <Pressable style={[styles.actionButton, styles.archiveActionButton]} onPress={onArchive}>
            <Archive size={14} color="#dc2626" />
            <Text style={[styles.actionButtonText, styles.archiveActionText]}>{t("crm.contacts.archive")}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 12,
  },
  archivedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  archivedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#b91c1c",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#135bec",
    fontSize: 20,
    fontWeight: "800",
  },
  heroCopy: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  editActionButton: {
    backgroundColor: "#135bec",
    borderColor: "#135bec",
  },
  editActionText: {
    color: "#ffffff",
  },
  archiveActionButton: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  archiveActionText: {
    color: "#dc2626",
    fontWeight: "700",
  },
});
