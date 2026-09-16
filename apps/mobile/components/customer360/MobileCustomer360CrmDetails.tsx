import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from "lucide-react-native";
import type { ContactRecord } from "../../../../packages/contracts/src/contact-port";

interface Props {
  contact: ContactRecord;
}

export function MobileCustomer360CrmDetails({ contact }: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const missingFields = [
    !contact.email && "email",
    !contact.phone && "teléfono",
    !contact.country && "país",
    !contact.documentNumber && "documento",
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
              ? "Información del contacto incompleta"
              : "Perfil completo y listo para CRM"}
          </Text>
          {missingFields.length > 0 && (
            <Text style={styles.bannerSubtitle}>
              Falta: {missingFields.join(", ")}
            </Text>
          )}
        </View>
      </View>

      {/* 1. Identity & Bio Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconCircle}>
            <User size={15} color="#135bec" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Identidad y Datos Personales</Text>
            <Text style={styles.sectionSubtitle}>Nombres, documentos y registro oficial</Text>
          </View>
        </View>

        <View style={styles.fieldsList}>
          <FieldItem label="Primer Nombre" value={contact.firstName} />
          <FieldItem label="Primer Apellido" value={contact.lastName} />
          <FieldItem label="Segundo Apellido" value={contact.secondLastName} />
          <FieldItem label="Nombre Preferido" value={contact.preferredName} />
          <FieldItem label="Tipo de Documento" value={contact.documentType} />
          <FieldItem
            label="Número de Documento"
            value={contact.documentNumber}
            mono
            onCopy={
              contact.documentNumber
                ? () => copyToClipboard(contact.documentNumber!, "doc")
                : undefined
            }
            copied={copiedKey === "doc"}
          />
          <FieldItem
            label="Fecha de Nacimiento"
            value={contact.birthDate ? new Date(contact.birthDate).toLocaleDateString() : null}
          />
          <FieldItem label="Género" value={contact.gender} />
        </View>
      </View>

      {/* 2. Contact Channels Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconCircle}>
            <Phone size={15} color="#135bec" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Canales de Contacto</Text>
            <Text style={styles.sectionSubtitle}>Emails, teléfonos y preferencias</Text>
          </View>
        </View>

        <View style={styles.fieldsList}>
          <FieldItem
            label="Email Principal"
            value={contact.email}
            onCopy={contact.email ? () => copyToClipboard(contact.email!, "email") : undefined}
            copied={copiedKey === "email"}
          />
          <FieldItem label="Email Secundario" value={contact.secondaryEmail} />
          <FieldItem
            label="Teléfono Principal"
            value={contact.phone}
            onCopy={contact.phone ? () => copyToClipboard(contact.phone!, "phone") : undefined}
            copied={copiedKey === "phone"}
          />
          <FieldItem label="Teléfono Secundario" value={contact.secondaryPhone} />
          <FieldItem label="Canal Preferido" value={contact.preferredChannel} />
          <FieldItem
            label="Idioma Preferido"
            value={contact.preferredLanguage || "Español (es)"}
          />
        </View>
      </View>

      {/* 3. Organization & Role Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconCircle}>
            <Building2 size={15} color="#135bec" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Organización y Relación</Text>
            <Text style={styles.sectionSubtitle}>Empresa, cargo y metadatos del CRM</Text>
          </View>
        </View>

        <View style={styles.fieldsList}>
          <FieldItem label="Empresa" value={contact.companyName} />
          <FieldItem label="Cargo / Posición" value={contact.jobTitle} />
          <FieldItem label="Departamento" value={contact.department} />
          <FieldItem label="Estado de Identidad" value={contact.identityStatus} />
          <FieldItem
            label="ID del Contacto"
            value={contact.id}
            mono
            onCopy={() => copyToClipboard(contact.id, "id")}
            copied={copiedKey === "id"}
          />
          <FieldItem
            label="Fecha de Registro"
            value={new Date(contact.createdAt).toLocaleString()}
          />
          <FieldItem
            label="Última Actualización"
            value={new Date(contact.updatedAt).toLocaleString()}
          />
          {Object.entries(contact.attributes || {}).map(([key, val]) => (
            <FieldItem key={key} label={`Personalizado · ${key}`} value={String(val)} />
          ))}
        </View>
      </View>

      {/* 4. Address Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconCircle}>
            <MapPin size={15} color="#135bec" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Ubicación y Dirección</Text>
            <Text style={styles.sectionSubtitle}>Domicilio fiscal y postal</Text>
          </View>
        </View>

        <View style={styles.fieldsList}>
          <FieldItem label="País" value={contact.country} />
          <FieldItem label="Ciudad" value={contact.city} />
          <FieldItem label="Provincia / Estado" value={contact.stateProvince} />
          <FieldItem label="Código Postal" value={contact.postalCode} />
          <FieldItem label="Dirección Línea 1" value={contact.addressLine1} />
          <FieldItem label="Dirección Línea 2" value={contact.addressLine2} />
        </View>
      </View>
    </View>
  );
}

function FieldItem({
  label,
  value,
  mono,
  onCopy,
  copied,
}: {
  label: string;
  value?: string | null;
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
          {value || "No registrado"}
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
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#64748b",
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
