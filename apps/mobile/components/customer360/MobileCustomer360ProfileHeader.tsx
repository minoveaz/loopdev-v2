import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Archive, Building2, Calendar, Clock, Mail, MapPin, Pencil, Phone, ShieldAlert, ShieldCheck } from "lucide-react-native";
import type { ContactRecord } from "../../../../packages/contracts/src/contact-port";

interface Props {
  contact: ContactRecord;
  onEdit?: () => void;
  onArchive?: () => void;
}

export function MobileCustomer360ProfileHeader({ contact, onEdit, onArchive }: Props) {
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

  const lifecycle = String(contact.attributes?.localTier ?? "contact");

  return (
    <View style={styles.card}>
      {/* Top Banner if Archived */}
      {contact.archivedAt && (
        <View style={styles.archivedBanner}>
          <ShieldAlert size={14} color="#b91c1c" />
          <Text style={styles.archivedText}>
            Contacto archivado ({new Date(contact.archivedAt).toLocaleDateString()})
          </Text>
        </View>
      )}

      {/* Hero row with Avatar and Details */}
      <View style={styles.heroRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "C"}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>CUSTOMER 360 · {contact.id}</Text>
          <Text style={styles.title} numberOfLines={1}>{name}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {[contact.jobTitle, contact.companyName].filter(Boolean).join(" · ") || "Sin cargo o empresa"}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.tierBadge}>
              <View style={styles.tierDot} />
              <Text style={styles.tierBadgeText}>{lifecycle}</Text>
            </View>
            <View style={[styles.statusBadge, contact.identityStatus === "verified" ? styles.verifiedBadge : styles.pendingBadge]}>
              {contact.identityStatus === "verified" ? (
                <ShieldCheck size={12} color="#15803d" />
              ) : (
                <ShieldAlert size={12} color="#b45309" />
              )}
              <Text style={[styles.statusBadgeText, contact.identityStatus === "verified" ? styles.verifiedText : styles.pendingText]}>
                {contact.identityStatus === "verified" ? "Identidad Verificada" : "Pendiente de Revisión"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Action Buttons (Call / Email / Edit / Archive) */}
      <View style={styles.actionsGrid}>
        {contact.email ? (
          <Pressable style={styles.actionButton} onPress={handleEmail}>
            <Mail size={14} color="#135bec" />
            <Text style={styles.actionButtonText}>Email</Text>
          </Pressable>
        ) : null}

        {contact.phone ? (
          <Pressable style={styles.actionButton} onPress={handleCall}>
            <Phone size={14} color="#135bec" />
            <Text style={styles.actionButtonText}>Llamar</Text>
          </Pressable>
        ) : null}

        <Pressable style={[styles.actionButton, styles.editActionButton]} onPress={onEdit}>
          <Pencil size={14} color="#ffffff" />
          <Text style={[styles.actionButtonText, styles.editActionText]}>Editar</Text>
        </Pressable>

        {onArchive && (
          <Pressable style={[styles.actionButton, styles.archiveActionButton]} onPress={onArchive}>
            <Archive size={14} color="#dc2626" />
            <Text style={[styles.actionButtonText, styles.archiveActionText]}>Archivar</Text>
          </Pressable>
        )}
      </View>

      {/* Snapshot contact line summary */}
      <View style={styles.snapshotGrid}>
        {contact.companyName && (
          <View style={styles.snapshotItem}>
            <Building2 size={13} color="#64748b" />
            <Text style={styles.snapshotText} numberOfLines={1}>{contact.companyName}</Text>
          </View>
        )}
        {(contact.city || contact.country) && (
          <View style={styles.snapshotItem}>
            <MapPin size={13} color="#64748b" />
            <Text style={styles.snapshotText} numberOfLines={1}>
              {[contact.city, contact.country].filter(Boolean).join(", ")}
            </Text>
          </View>
        )}
        <View style={styles.snapshotItem}>
          <Calendar size={13} color="#64748b" />
          <Text style={styles.snapshotText} numberOfLines={1}>
            Alta: {new Date(contact.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.snapshotItem}>
          <Clock size={13} color="#64748b" />
          <Text style={styles.snapshotText} numberOfLines={1}>
            Actualizado: {new Date(contact.updatedAt).toLocaleDateString()}
          </Text>
        </View>
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
  },
  eyebrow: {
    color: "#135bec",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16a34a",
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803d",
    textTransform: "capitalize",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verifiedBadge: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  pendingBadge: {
    backgroundColor: "#fffbeb",
    borderColor: "#fef3c7",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  verifiedText: {
    color: "#15803d",
  },
  pendingText: {
    color: "#b45309",
  },
  actionsGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    flexWrap: "wrap",
  },
  actionButton: {
    flex: 1,
    minWidth: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
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
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    flexGrow: 0,
    minWidth: 40,
  },
  archiveActionText: {
    color: "#dc2626",
  },
  snapshotGrid: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
    gap: 6,
  },
  snapshotItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  snapshotText: {
    fontSize: 12,
    color: "#64748b",
    flex: 1,
  },
});
