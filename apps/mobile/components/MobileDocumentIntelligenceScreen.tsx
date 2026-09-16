import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileSearch,
  FileText,
  Scan,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react-native";
import { mobileTheme } from "../theme/tokens";
import { MobilePageHeader } from "./ui/MobilePageHeader";
import { MobileSearchBar } from "./ui/MobileSearchBar";
import { MobileSegmentedControl } from "./ui/MobileSegmentedControl";
import { MobileModalSheet } from "./MobileModal";
import { DEMO_DOCUMENT_FIXTURES, type DocumentDemoFixture } from "../../../src/loopdev/domains/document-intelligence/data/fixtures";

interface MobileDocumentIntelligenceScreenProps {
  onBack: () => void;
  onNavigateToContact?: (contactId: string) => void;
}

export function MobileDocumentIntelligenceScreen({
  onBack,
}: MobileDocumentIntelligenceScreenProps) {
  const [fixtures] = useState<DocumentDemoFixture[]>(DEMO_DOCUMENT_FIXTURES);
  const [selectedFixture, setSelectedFixture] = useState<DocumentDemoFixture | null>(null);
  const [filterTab, setFilterTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const filteredFixtures = fixtures.filter((item) => {
    const matchesQuery =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.documentType.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (filterTab === "all") return true;
    if (filterTab === "dni") return item.documentType === "spanish-dni" || item.documentType === "spanish-nie";
    if (filterTab === "passport") return item.documentType === "passport";
    if (filterTab === "invoice") return item.documentType === "invoice" || item.documentType === "other";
    return true;
  });

  const handleSimulateScan = (fixture: DocumentDemoFixture) => {
    setIsExtracting(true);
    setExtractionProgress(15);
    setTimeout(() => setExtractionProgress(45), 250);
    setTimeout(() => setExtractionProgress(80), 550);
    setTimeout(() => {
      setExtractionProgress(100);
      setIsExtracting(false);
      setSelectedFixture(fixture);
    }, 850);
  };

  const handleCopyText = (fieldKey: string) => {
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <View style={styles.container}>
      {/* Back Button to Launchpad */}
      <Pressable
        accessibilityLabel="Volver al Launchpad"
        accessibilityRole="button"
        onPress={onBack}
        style={styles.backButton}
      >
        <ArrowLeft size={16} color={mobileTheme.colors.primary} />
        <Text style={styles.backButtonText}>Launchpad</Text>
      </Pressable>

      {/* Header */}
      <MobilePageHeader
        eyebrow="AI PLATFORM TOOLS"
        title="Document Intelligence"
        subtitle="OCR inteligente, extracción de identidad y tipificación"
        actionButton={{
          label: "Escanear",
          icon: <Scan size={14} color="#ffffff" style={{ marginRight: 4 }} />,
          onPress: () => handleSimulateScan(fixtures[0]),
        }}
      />

      {/* Metrics Banner */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{fixtures.length}</Text>
          <Text style={styles.metricLabel}>Documentos</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: mobileTheme.colors.success }]}>98.8%</Text>
          <Text style={styles.metricLabel}>Confianza OCR</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: mobileTheme.colors.primary }]}>0.8s</Text>
          <Text style={styles.metricLabel}>Velocidad</Text>
        </View>
      </View>

      {/* Quick Scanner Action Card */}
      <View style={styles.scannerHeroCard}>
        <View style={styles.scannerHeroHeader}>
          <View style={styles.scannerIconWrap}>
            <Sparkles size={20} color={mobileTheme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scannerHeroTitle}>Extracción Automática</Text>
            <Text style={styles.scannerHeroSubtitle}>
              Sube o escanea un DNI, Pasaporte o Factura para extraer campos en tiempo real.
            </Text>
          </View>
        </View>

        {isExtracting ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: \`${extractionProgress}%`} ]} />
            </View>
            <Text style={styles.progressText}>
              Extrayendo datos de identidad por visión neuronal (${extractionProgress}%)...
            </Text>
          </View>
        ) : (
          <View style={styles.demoButtonsRow}>
            <Pressable
              style={styles.demoScanButton}
              onPress={() => handleSimulateScan(fixtures[0])}
            >
              <FileText size={14} color={mobileTheme.colors.primary} />
              <Text style={styles.demoScanButtonText}>DNI Demo</Text>
            </Pressable>
            <Pressable
              style={styles.demoScanButton}
              onPress={() => handleSimulateScan(fixtures[1] || fixtures[0])}
            >
              <ShieldCheck size={14} color={mobileTheme.colors.primary} />
              <Text style={styles.demoScanButtonText}>Pasaporte Demo</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={{ marginBottom: 12 }}>
        <MobileSegmentedControl
          segments={[
            { id: "all", label: "Todos" },
            { id: "dni", label: "DNI / NIE" },
            { id: "passport", label: "Pasaportes" },
          ]}
          activeId={filterTab}
          onSelect={setFilterTab}
        />
      </View>

      {/* Search Bar */}
      <View style={{ marginBottom: 14 }}>
        <MobileSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por titular, tipo o número..."
        />
      </View>

      {/* Extracted Documents List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.listSectionTitle}>DOCUMENTOS EXTRAÍDOS</Text>

        {filteredFixtures.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileSearch size={32} color={mobileTheme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No hay documentos</Text>
            <Text style={styles.emptySubtitle}>
              No se encontraron documentos con los filtros seleccionados.
            </Text>
          </View>
        ) : (
          filteredFixtures.map((item) => {
            const fields = item.record.extractedFields;
            const docNum = fields.documentNumber?.value || "N/A";
            const docTypeLabel =
              item.documentType === "spanish-dni"
                ? "DNI Español"
                : item.documentType === "spanish-nie"
                ? "NIE Español"
                : "Pasaporte";

            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedFixture(item)}
                style={styles.docCard}
              >
                <View style={styles.docIconBox}>
                  <FileText size={20} color={mobileTheme.colors.primary} />
                </View>

                <View style={styles.docInfo}>
                  <View style={styles.docHeaderRow}>
                    <Text style={styles.docName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.confidenceBadge}>
                      <CheckCircle2 size={11} color={mobileTheme.colors.success} />
                      <Text style={styles.confidenceText}>
                        {Math.round(item.record.confidence * 100)}%
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.docDetail}>
                    {docTypeLabel} · {docNum}
                  </Text>
                  <Text style={styles.docDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>

                <ChevronRight size={18} color={mobileTheme.colors.textMuted} />
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Document Detail Inspector Modal */}
      {selectedFixture && (
        <MobileModalSheet
          visible={Boolean(selectedFixture)}
          onClose={() => setSelectedFixture(null)}
          title="Extracción de Documento"
        >
          <View style={styles.sheetBody}>
            {/* Header info */}
            <View style={styles.sheetHeaderCard}>
              <View style={styles.sheetDocMeta}>
                <Text style={styles.sheetDocName}>{selectedFixture.name}</Text>
                <Text style={styles.sheetDocType}>
                  {selectedFixture.documentType.toUpperCase()} · Confianza{" "}
                  {Math.round(selectedFixture.record.confidence * 100)}%
                </Text>
              </View>
              <View style={styles.verifiedPill}>
                <ShieldCheck size={14} color={mobileTheme.colors.success} />
                <Text style={styles.verifiedText}>Verificado</Text>
              </View>
            </View>

            {/* Extracted Fields Breakdown */}
            <Text style={styles.sheetSectionTitle}>DATOS IDENTIFICATIVOS</Text>

            <View style={styles.fieldsContainer}>
              {Object.entries(selectedFixture.record.extractedFields).map(([key, fieldData]) => {
                if (!fieldData || !fieldData.value) return null;
                const isCopied = copiedField === key;

                const labels: Record<string, string> = {
                  givenNames: "Nombre",
                  firstSurname: "Primer Apellido",
                  secondSurname: "Segundo Apellido",
                  documentNumber: "Número de Documento",
                  documentType: "Tipo de Documento",
                  birthDate: "Fecha de Nacimiento",
                  nationality: "Nacionalidad",
                  sex: "Sexo",
                  expiryDate: "Fecha de Caducidad",
                  address: "Dirección Registrada",
                };

                return (
                  <View key={key} style={styles.fieldRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>{labels[key] || key}</Text>
                      <Text style={styles.fieldValue}>{String(fieldData.value)}</Text>
                    </View>
                    <View style={styles.fieldActions}>
                      <Text style={styles.fieldConfidence}>
                        {Math.round((fieldData.confidence || 0.95) * 100)}%
                      </Text>
                      <Pressable
                        onPress={() => handleCopyText(key)}
                        style={styles.copyButton}
                      >
                        {isCopied ? (
                          <CheckCircle2 size={14} color={mobileTheme.colors.success} />
                        ) : (
                          <Copy size={14} color={mobileTheme.colors.textMuted} />
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.sheetActionsBar}>
              <Pressable
                onPress={() => {
                  Alert.alert(
                    "Datos aplicados",
                    \`Se han estructurado los datos de \${selectedFixture.name} para su uso en CRM y Formularios.\`
                  );
                  setSelectedFixture(null);
                }}
                style={styles.primaryActionButton}
              >
                <User size={16} color="#ffffff" />
                <Text style={styles.primaryActionButtonText}>Aplicar a Contacto CRM</Text>
              </Pressable>
            </View>
          </View>
        </MobileModalSheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: mobileTheme.colors.background,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backButtonText: {
    color: mobileTheme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 10,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: mobileTheme.colors.text,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
    marginTop: 2,
  },
  scannerHeroCard: {
    backgroundColor: mobileTheme.colors.primarySoft,
    borderColor: mobileTheme.colors.primary,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 14,
    marginBottom: 14,
  },
  scannerHeroHeader: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  scannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  scannerHeroTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: mobileTheme.colors.primary,
  },
  scannerHeroSubtitle: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  demoButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  demoScanButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  demoScanButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "rgba(19,91,236,0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: mobileTheme.colors.primary,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 40,
  },
  listSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: mobileTheme.colors.textMuted,
    marginBottom: 10,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 12,
    marginBottom: 10,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
    marginRight: 8,
  },
  docHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  docName: {
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.text,
    flex: 1,
    marginRight: 6,
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.success,
  },
  docDetail: {
    fontSize: 12,
    fontWeight: "600",
    color: mobileTheme.colors.primary,
    marginBottom: 2,
  },
  docDescription: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: mobileTheme.colors.text,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
    textAlign: "center",
    maxWidth: 240,
    marginTop: 4,
  },
  sheetBody: {
    paddingBottom: 24,
  },
  sheetHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 12,
    marginBottom: 16,
  },
  sheetDocMeta: {
    flex: 1,
    marginRight: 8,
  },
  sheetDocName: {
    fontSize: 15,
    fontWeight: "800",
    color: mobileTheme.colors.text,
  },
  sheetDocType: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "800",
    color: mobileTheme.colors.success,
  },
  sheetSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: mobileTheme.colors.textMuted,
    marginBottom: 8,
  },
  fieldsContainer: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    overflow: "hidden",
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: mobileTheme.colors.borderLight,
  },
  fieldLabel: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
  },
  fieldValue: {
    fontSize: 13,
    color: mobileTheme.colors.text,
    fontWeight: "700",
    marginTop: 1,
  },
  fieldActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldConfidence: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.success,
  },
  copyButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: mobileTheme.colors.surfaceHover,
  },
  sheetActionsBar: {
    gap: 8,
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  primaryActionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});
