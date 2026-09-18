import React from "react";
import { ArrowLeft, Users, ShieldAlert } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ContactRecord, PotentialContactDuplicate } from "../../../packages/contracts/src/contact-port";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobileCard,
  MobileButton,
  MobileStatusBadge,
  MobileEmptyState,
  MobileLoadingState,
} from "./ui";
import { mobileTheme } from "../theme/tokens";

interface MobileDuplicateReviewScreenProps {
  contact?: ContactRecord;
  candidates: PotentialContactDuplicate[];
  loading?: boolean;
  error?: string | null;
  onBack: () => void;
  onDismiss: (candidate: ContactRecord) => void;
}

export function MobileDuplicateReviewScreen({
  contact,
  candidates,
  loading,
  error,
  onBack,
  onDismiss,
}: MobileDuplicateReviewScreenProps) {
  if (loading) {
    return (
      <MobilePageContainer>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={16} color={mobileTheme.colors.primary} />
          <Text style={styles.backButtonText}>Volver a contactos</Text>
        </Pressable>
        <MobileLoadingState message="Buscando candidatos duplicados..." />
      </MobilePageContainer>
    );
  }

  if (error) {
    return (
      <MobilePageContainer>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={16} color={mobileTheme.colors.primary} />
          <Text style={styles.backButtonText}>Volver a contactos</Text>
        </Pressable>
        <MobileEmptyState
          icon={<ShieldAlert size={32} color={mobileTheme.colors.destructive} />}
          title="Error al cargar duplicados"
          description={error}
          actionLabel="Volver a contactos"
          onAction={onBack}
        />
      </MobilePageContainer>
    );
  }

  const contactName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim()
    : "este contacto";

  return (
    <MobilePageContainer>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <ArrowLeft size={16} color={mobileTheme.colors.primary} />
        <Text style={styles.backButtonText}>Volver a contactos</Text>
      </Pressable>

      <MobilePageHeader
        eyebrow="CALIDAD DE CONTACTOS"
        title="Revisión de Duplicados"
        subtitle={`Candidatos con similitud detectada para ${contactName}.`}
      />

      {candidates.length > 0 ? (
        <View style={styles.list}>
          {candidates.map((candidate) => {
            const candidateName = [candidate.contact.firstName, candidate.contact.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() || "Contacto sin nombre";
            const channelInfo =
              candidate.contact.email || candidate.contact.phone || "Sin canal de contacto";

            return (
              <MobileCard key={candidate.contact.id} style={styles.candidateCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleWrap}>
                    <Text style={styles.candidateName}>{candidateName}</Text>
                    <Text style={styles.candidateMeta}>{channelInfo}</Text>
                  </View>
                  <MobileStatusBadge
                    tone={candidate.score >= 80 ? "destructive" : "warning"}
                    label={`Score ${candidate.score}%`}
                    dot
                  />
                </View>

                <View style={styles.reasonsList}>
                  {candidate.reasons.map((reason, idx) => (
                    <Text key={idx} style={styles.reasonItem}>
                      • {reason}
                    </Text>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.mergeNote}>Fusión bloqueada en este entorno</Text>
                  <MobileButton
                    variant="outline"
                    size="sm"
                    label="Descartar revisión"
                    onPress={() => onDismiss(candidate.contact)}
                  />
                </View>
              </MobileCard>
            );
          })}
        </View>
      ) : (
        <MobileEmptyState
          icon={<Users size={32} color={mobileTheme.colors.primary} />}
          title="Sin duplicados potenciales"
          description="No se han detectado conflictos ni coincidencias para este registro."
          actionLabel="Volver a contactos"
          onAction={onBack}
        />
      )}
    </MobilePageContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    minHeight: 44,
  },
  backButtonText: {
    color: mobileTheme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  list: {
    gap: 12,
    marginTop: 8,
  },
  candidateCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  titleWrap: {
    flex: 1,
    marginRight: 8,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: "800",
    color: mobileTheme.colors.textPrimary,
  },
  candidateMeta: {
    fontSize: 13,
    color: mobileTheme.colors.textSecondary,
    marginTop: 2,
  },
  reasonsList: {
    marginVertical: 8,
    gap: 4,
  },
  reasonItem: {
    fontSize: 13,
    color: mobileTheme.colors.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
  },
  mergeNote: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.warning,
  },
});
