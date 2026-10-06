import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Archive, Pencil, ShieldAlert } from "lucide-react-native";
import type { ContactRecord } from "../../../../packages/contracts/src/contact-port";
import {
  MobileCard,
  MobileAvatar,
  MobileStatusBadge,
  MobileSpeedDialBar,
  MobileButton,
} from "../ui";
import { mobileTheme } from "../../theme/tokens";
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

  const subtitle = [contact.jobTitle, contact.companyName].filter(Boolean).join(" · ") || contact.email || null;
  const isVerified = contact.identityStatus === "verified";

  return (
    <MobileCard style={styles.card}>
      {/* Top Banner if Archived */}
      {contact.archivedAt && (
        <View style={styles.archivedBanner}>
          <ShieldAlert size={14} color={mobileTheme.colors.destructive} />
          <Text style={styles.archivedText}>
            {t("crm.contacts.archived", { date: new Date(contact.archivedAt).toLocaleDateString() })}
          </Text>
        </View>
      )}

      {/* Hero row with Avatar and Details */}
      <View style={styles.heroRow}>
        <MobileAvatar name={name} size="lg" />
        <View style={styles.heroCopy}>
          <View style={styles.nameRow}>
            <Text style={styles.title} numberOfLines={1}>{name}</Text>
          </View>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          <View style={styles.badgeRow}>
            <MobileStatusBadge
              tone={isVerified ? "success" : "warning"}
              label={isVerified ? "Identidad Verificada" : "Revisión Pendiente"}
              dot
            />
          </View>
        </View>
      </View>

      {/* Direct Speed Dial Communication Bar */}
      <View style={styles.dialBarWrapper}>
        <MobileSpeedDialBar
          phone={contact.phone || undefined}
          email={contact.email || undefined}
          whatsapp={contact.phone || undefined}
          contactName={name}
        />
      </View>

      {/* Action Buttons (Edit / Archive) */}
      <View style={styles.actionsRow}>
        {onEdit && (
          <MobileButton
            variant="primary"
            size="sm"
            label={t("crm.contacts.edit")}
            icon={<Pencil size={14} color="#ffffff" />}
            onPress={onEdit}
            style={{ flex: 1 }}
          />
        )}
        {onArchive && (
          <MobileButton
            variant="destructive"
            size="sm"
            label={t("crm.contacts.archive")}
            icon={<Archive size={14} color="#ffffff" />}
            onPress={onArchive}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </MobileCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  archivedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: mobileTheme.radii.input,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  archivedText: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.destructive,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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
    color: mobileTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: mobileTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 6,
    flexDirection: "row",
  },
  dialBarWrapper: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
});
