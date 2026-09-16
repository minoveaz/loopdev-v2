import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Code,
  Copy,
  Eye,
  FileSpreadsheet,
  FileText,
  Layers,
  Plus,
  RefreshCw,
  RotateCw,
  Scan,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  ZoomIn,
  ZoomOut,
} from "lucide-react-native";
import { mobileTheme } from "../theme/tokens";
import { MobilePageHeader } from "./ui/MobilePageHeader";
import { MobileSearchBar } from "./ui/MobileSearchBar";
import { MobileSegmentedControl } from "./ui/MobileSegmentedControl";
import {
  localDocumentIntelligenceAdapter,
  DEMO_DOCUMENT_FIXTURES,
  EXPORT_PROFILES,
  DEFAULT_EXPORT_PROFILE_ID,
  splitSurnames,
  buildSurnames,
  formatFieldsForProfile,
  selectFieldsForProfile,
  type DocumentDemoFixture,
  type ExtractionRecord,
  type ExtractionDocumentFile,
  type IdentityDocumentFields,
  type ExportProfileId,
  type ExportProfileField,
} from "../../../src/loopdev/domains/document-intelligence";

interface MobileDocumentIntelligenceScreenProps {
  onBack: () => void;
  onNavigateToContact?: (contactId: string) => void;
}

type ScreenTab = "workspace" | "history";
type SessionStep = "intake" | "preview" | "processing" | "extracted";

const PROCESSING_STEPS = [
  { id: "validate", label: "Validando archivo", desc: "Comprobando formato, tamaño e integridad." },
  { id: "classify", label: "Identificando tipo documental", desc: "Clasificando DNI, Pasaporte o Licencia." },
  { id: "extract", label: "Leyendo campos de identidad", desc: "Inferencia OCR y lectura de evidencias." },
  { id: "normalize", label: "Normalizando resultado", desc: "Estructurando campos y calculando confianza." },
];

const FIELD_LABELS: Record<string, string> = {
  fullName: "Nombre Completo",
  givenNames: "Nombre",
  firstSurname: "Primer Apellido",
  secondSurname: "Segundo Apellido",
  surnames: "Apellidos",
  documentNumber: "Número de Documento",
  documentType: "Tipo de Documento",
  birthDate: "Fecha de Nacimiento",
  nationality: "Nacionalidad",
  sex: "Sexo",
  issueDate: "Fecha de Emisión",
  expiryDate: "Fecha de Caducidad",
  supportNumber: "Número de Soporte",
  address: "Dirección Registrada",
  birthplace: "Lugar de Nacimiento",
  mrz: "Zona MRZ",
};

export function MobileDocumentIntelligenceScreen({
  onBack,
  onNavigateToContact,
}: MobileDocumentIntelligenceScreenProps) {
  // Main Tab
  const [activeTab, setActiveTab] = useState<ScreenTab>("workspace");

  // Workspace Session State
  const [sessionStep, setSessionStep] = useState<SessionStep>("intake");
  const [selectedFile, setSelectedFile] = useState<ExtractionDocumentFile | null>(null);
  const [selectedFixture, setSelectedFixture] = useState<DocumentDemoFixture | null>(null);
  const [currentExtraction, setCurrentExtraction] = useState<ExtractionRecord | null>(null);
  const [editableFields, setEditableFields] = useState<IdentityDocumentFields>({
    documentType: "spanish-dni",
    issuingCountry: "ESP",
    fullName: "",
    givenNames: "",
    surnames: "",
    firstSurname: "",
    secondSurname: "",
    documentNumber: "",
    birthDate: "",
    nationality: "ESP",
    sex: "",
    issueDate: "",
    expiryDate: "",
    birthplace: "",
    supportNumber: "",
    address: "",
    mrz: "",
  });

  // Processing Animation State
  const [processingIndex, setProcessingIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Document Viewer Controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<"fields" | "document" | "both">("fields");

  // Review Panel Controls
  const [exportProfile, setExportProfile] = useState<ExportProfileId>(DEFAULT_EXPORT_PROFILE_ID);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // History State
  const [extractionsList, setExtractionsList] = useState<ExtractionRecord[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [historyLoading, setHistoryLoading] = useState(false);

  // File Input Ref for Web
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load Extractions from Adapter
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const page = await localDocumentIntelligenceAdapter.listExtractions({
        organizationId: "local-development-organization",
        limit: 50,
      });
      setExtractionsList(page.items);
    } catch (err) {
      console.warn("Failed to load extractions history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle Local File Selection
  const handleFileChange = (e: any) => {
    const file = e.target?.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setSelectedFixture(null);
      setSelectedFile({
        name: file.name,
        size: file.size,
        mimeType: file.type || "image/jpeg",
        previewUrl,
      });
      setZoomLevel(1);
      setRotation(0);
      setSessionStep("preview");
    }
  };

  // Handle Demo Fixture Selection
  const handleSelectFixture = (fixture: DocumentDemoFixture) => {
    setSelectedFixture(fixture);
    setSelectedFile({
      name: fixture.record.files.front?.name || fixture.name,
      size: fixture.record.files.front?.size || 45000,
      mimeType: fixture.mimeType,
      previewUrl: fixture.previewUrl,
    });
    setZoomLevel(1);
    setRotation(0);
    setSessionStep("preview");
  };

  // Handle Clipboard Paste
  const handlePasteClipboard = async () => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.read) {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find((t) => t.startsWith("image/"));
          if (imgType) {
            const blob = await item.getType(imgType);
            const previewUrl = URL.createObjectURL(blob);
            setSelectedFixture(null);
            setSelectedFile({
              name: `captura-${Date.now()}.png`,
              size: blob.size,
              mimeType: imgType,
              previewUrl,
            });
            setZoomLevel(1);
            setRotation(0);
            setSessionStep("preview");
            return;
          }
        }
        Alert.alert("Portapapeles", "No se detectó ninguna imagen en el portapapeles.");
      } catch {
        Alert.alert("Permiso Requerido", "Permite acceso al portapapeles o usa el selector de archivos.");
      }
    } else {
      Alert.alert("Aviso", "Usa el botón de selección de archivos en tu dispositivo.");
    }
  };

  // Run AI Extraction Process
  const handleStartExtraction = async () => {
    if (!selectedFile) return;
    setSessionStep("processing");
    setProcessingIndex(0);
    setProgressPercent(15);

    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      setProcessingIndex(i);
      setProgressPercent(Math.round(((i + 1) / PROCESSING_STEPS.length) * 90));
      await new Promise((res) => setTimeout(res, 600));
    }

    setProgressPercent(100);

    try {
      const result = await localDocumentIntelligenceAdapter.startExtraction({
        organizationId: "local-development-organization",
        sourceSuite: "standalone",
        frontFile: selectedFile,
        fixtureId: selectedFixture?.id,
      });

      if (result.ok) {
        setCurrentExtraction(result.extraction);
        setEditableFields(result.extraction.fields);
        setSessionStep("extracted");
        setViewMode("fields");
        loadHistory();
      } else {
        Alert.alert("Error de Extracción", "No se pudo procesar el documento.");
        setSessionStep("preview");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Ocurrió un error en el motor de visión.");
      setSessionStep("preview");
    }
  };

  // Field change with intelligent surname sync
  const handleFieldChange = (field: ExportProfileField, value: string) => {
    setEditableFields((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "firstSurname" || field === "secondSurname") {
        updated.surnames = buildSurnames(
          field === "firstSurname" ? value : prev.firstSurname,
          field === "secondSurname" ? value : prev.secondSurname
        );
      }
      if (field === "surnames") {
        const { firstSurname, secondSurname } = splitSurnames(value);
        updated.firstSurname = firstSurname;
        updated.secondSurname = secondSurname;
      }
      return updated;
    });
  };

  // Copy single field
  const handleCopySingleField = (key: string, val: string) => {
    setCopiedField(key);
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(val);
    }
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Copy all formatted fields
  const handleCopyFormatted = () => {
    const text = formatFieldsForProfile(editableFields, exportProfile);
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopyNotification("Campos copiados al portapapeles");
    setTimeout(() => setCopyNotification(null), 2000);
  };

  // Copy JSON
  const handleCopyJson = () => {
    const json = JSON.stringify(selectFieldsForProfile(editableFields, exportProfile), null, 2);
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json);
    }
    setCopyNotification("JSON copiado al portapapeles");
    setTimeout(() => setCopyNotification(null), 2000);
  };

  // Confirm Extraction
  const handleConfirmExtraction = async () => {
    if (!currentExtraction) return;
    try {
      const res = await localDocumentIntelligenceAdapter.confirmExtraction({
        extractionId: currentExtraction.id,
        fields: editableFields,
      });
      if (res.ok) {
        setCurrentExtraction(res.extraction);
        loadHistory();
        Alert.alert("Extracción Confirmada", "Los datos han sido guardados y validados correctamente.");
      }
    } catch {
      Alert.alert("Error", "No se pudo guardar la extracción.");
    }
  };

  // Reset to new upload
  const handleResetSession = () => {
    setSelectedFile(null);
    setSelectedFixture(null);
    setCurrentExtraction(null);
    setSessionStep("intake");
  };

  // Open existing extraction from history
  const handleOpenExistingExtraction = (record: ExtractionRecord) => {
    setCurrentExtraction(record);
    setEditableFields(record.fields);
    setSelectedFile(record.files.front);
    setSessionStep("extracted");
    setActiveTab("workspace");
    setViewMode("fields");
  };

  // Delete extraction
  const handleDeleteExtraction = async (id: string) => {
    await localDocumentIntelligenceAdapter.deleteExtraction(id);
    loadHistory();
  };

  // Filtered History
  const filteredHistory = extractionsList.filter((item) => {
    const query = historySearch.toLowerCase();
    const matchesSearch =
      query === "" ||
      item.title.toLowerCase().includes(query) ||
      (item.fields.documentNumber && item.fields.documentNumber.toLowerCase().includes(query)) ||
      (item.fields.fullName && item.fields.fullName.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (historyFilter === "all") return true;
    if (historyFilter === "dni") return item.documentType === "spanish-dni" || item.documentType === "spanish-nie";
    if (historyFilter === "passport") return item.documentType === "passport";
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Hidden Web File Input */}
      {Platform.OS === "web" && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      )}

      {/* Top Bar / Back to Launchpad */}
      <View style={styles.topNavRow}>
        <Pressable
          accessibilityLabel="Volver al Launchpad"
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <ArrowLeft size={16} color={mobileTheme.colors.primary} />
          <Text style={styles.backButtonText}>Launchpad</Text>
        </Pressable>

        <View style={styles.tabToggleWrap}>
          <Pressable
            onPress={() => setActiveTab("workspace")}
            style={[styles.tabToggleBtn, activeTab === "workspace" && styles.tabToggleBtnActive]}
          >
            <Scan size={13} color={activeTab === "workspace" ? mobileTheme.colors.primary : mobileTheme.colors.textMuted} />
            <Text style={[styles.tabToggleText, activeTab === "workspace" && styles.tabToggleTextActive]}>
              Extractor
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("history")}
            style={[styles.tabToggleBtn, activeTab === "history" && styles.tabToggleBtnActive]}
          >
            <Layers size={13} color={activeTab === "history" ? mobileTheme.colors.primary : mobileTheme.colors.textMuted} />
            <Text style={[styles.tabToggleText, activeTab === "history" && styles.tabToggleTextActive]}>
              Historial ({extractionsList.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Screen Header */}
      <MobilePageHeader
        eyebrow="AI PLATFORM TOOLS"
        title="Document Intelligence"
        subtitle={
          activeTab === "workspace"
            ? "OCR neuronal, extracción estructurada e inspección documental"
            : "Registro histórico y base de documentos procesados"
        }
        actionButton={
          activeTab === "workspace" && sessionStep !== "intake"
            ? {
                label: "Nuevo",
                icon: <Plus size={14} color="#ffffff" style={{ marginRight: 4 }} />,
                onPress: handleResetSession,
              }
            : undefined
        }
      />

      {/* ========================================================================= */}
      {/* TAB 1: WORKSPACE (Intake -> Preview -> Processing -> Extracted)            */}
      {/* ========================================================================= */}
      {activeTab === "workspace" && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* STEP 1: INTAKE / UPLOAD */}
          {sessionStep === "intake" && (
            <View style={styles.intakeContainer}>
              <View style={styles.dropzoneCard}>
                <View style={styles.dropzoneIconWrap}>
                  <UploadCloud size={28} color={mobileTheme.colors.primary} />
                </View>

                <Text style={styles.dropzoneTitle}>Subir Documento de Identidad</Text>
                <Text style={styles.dropzoneSubtitle}>
                  Formatos soportados: DNI, NIE o Pasaporte en formato JPG, PNG, WebP o PDF.
                </Text>

                <View style={styles.uploadActionsRow}>
                  <Pressable
                    onPress={() => {
                      if (Platform.OS === "web" && fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    style={styles.primaryUploadBtn}
                  >
                    <FileText size={16} color="#ffffff" />
                    <Text style={styles.primaryUploadBtnText}>Seleccionar Archivo</Text>
                  </Pressable>

                  <Pressable onPress={handlePasteClipboard} style={styles.secondaryUploadBtn}>
                    <Clipboard size={16} color={mobileTheme.colors.primary} />
                    <Text style={styles.secondaryUploadBtnText}>Pegar Imagen</Text>
                  </Pressable>
                </View>

                {/* Fixture Shortcuts */}
                <View style={styles.fixturesDivider}>
                  <Text style={styles.fixturesLabel}>O PRUEBA CON MUESTRAS OFICIALES:</Text>
                  <View style={styles.fixturesRow}>
                    {DEMO_DOCUMENT_FIXTURES.map((fixture) => (
                      <Pressable
                        key={fixture.id}
                        onPress={() => handleSelectFixture(fixture)}
                        style={styles.fixturePill}
                      >
                        <Sparkles size={12} color={mobileTheme.colors.primary} />
                        <Text style={styles.fixturePillText}>{fixture.name.split(" ")[0]} ({fixture.documentType === "passport" ? "Pasaporte" : "DNI"})</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Engine Metrics Highlights */}
              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>98.8%</Text>
                  <Text style={styles.metricLabel}>Precisión OCR</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[styles.metricValue, { color: mobileTheme.colors.primary }]}>0.8s</Text>
                  <Text style={styles.metricLabel}>Velocidad</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[styles.metricValue, { color: mobileTheme.colors.success }]}>ICAO 9303</Text>
                  <Text style={styles.metricLabel}>Estándar MRZ</Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: PREVIEW / READY TO EXTRACT */}
          {sessionStep === "preview" && selectedFile && (
            <View style={styles.previewContainer}>
              <View style={styles.viewerCard}>
                {/* Toolbar */}
                <View style={styles.viewerToolbar}>
                  <View style={styles.fileMetaInfo}>
                    <FileText size={14} color={mobileTheme.colors.primary} />
                    <Text style={styles.fileNameText} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                  </View>
                  <View style={styles.viewerControls}>
                    <Pressable
                      onPress={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                      style={styles.controlIconBtn}
                    >
                      <ZoomOut size={15} color={mobileTheme.colors.text} />
                    </Pressable>
                    <Pressable
                      onPress={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                      style={styles.controlIconBtn}
                    >
                      <ZoomIn size={15} color={mobileTheme.colors.text} />
                    </Pressable>
                    <Pressable
                      onPress={() => setRotation((r) => (r + 90) % 360)}
                      style={styles.controlIconBtn}
                    >
                      <RotateCw size={15} color={mobileTheme.colors.text} />
                    </Pressable>
                  </View>
                </View>

                {/* Document Viewport */}
                <View style={styles.viewportContainer}>
                  {selectedFile.previewUrl ? (
                    <Image
                      source={{ uri: selectedFile.previewUrl }}
                      style={[
                        styles.previewImage,
                        {
                          transform: [{ scale: zoomLevel }, { rotate: `${rotation}deg` }],
                        },
                      ]}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.noPreviewBox}>
                      <FileText size={48} color={mobileTheme.colors.textMuted} />
                      <Text style={styles.noPreviewText}>Vista previa no disponible</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Start Extraction Action Bar */}
              <View style={styles.actionPromptCard}>
                <Pressable onPress={handleStartExtraction} style={styles.startExtractionBtn}>
                  <Sparkles size={18} color="#ffffff" />
                  <Text style={styles.startExtractionBtnText}>Comenzar Extracción Neuronal</Text>
                </Pressable>

                <Pressable onPress={handleResetSession} style={styles.cancelLinkBtn}>
                  <Text style={styles.cancelLinkText}>Cambiar archivo</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* STEP 3: PROCESSING WITH NEURAL STEPS */}
          {sessionStep === "processing" && (
            <View style={styles.processingCard}>
              <View style={styles.processingHeader}>
                <Sparkles size={24} color={mobileTheme.colors.primary} />
                <Text style={styles.processingTitle}>Analizando Documento</Text>
                <Text style={styles.processingSubtitle}>
                  Visión por computadora y clasificación de campos de identidad.
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressPercentLabel}>{progressPercent}% Completado</Text>

              {/* Sequential Steps List */}
              <View style={styles.stepsList}>
                {PROCESSING_STEPS.map((stepItem, idx) => {
                  const isDone = idx < processingIndex;
                  const isCurrent = idx === processingIndex;

                  return (
                    <View key={stepItem.id} style={styles.stepItemRow}>
                      <View
                        style={[
                          styles.stepIndicator,
                          isDone && styles.stepIndicatorDone,
                          isCurrent && styles.stepIndicatorCurrent,
                        ]}
                      >
                        {isDone ? (
                          <Check size={12} color="#ffffff" />
                        ) : (
                          <Text
                            style={[
                              styles.stepNumberText,
                              isCurrent && styles.stepNumberTextCurrent,
                            ]}
                          >
                            {idx + 1}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.stepItemLabel,
                            isCurrent && styles.stepItemLabelCurrent,
                          ]}
                        >
                          {stepItem.label}
                        </Text>
                        <Text style={styles.stepItemDesc}>{stepItem.desc}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 4: EXTRACTED REVIEW WORKSPACE */}
          {sessionStep === "extracted" && (
            <View style={styles.reviewWorkspaceContainer}>
              {/* Header Status Bar */}
              <View style={styles.reviewHeaderCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewDocTitle}>
                    {editableFields.fullName || selectedFile?.name || "Documento Extraído"}
                  </Text>
                  <Text style={styles.reviewDocMeta}>
                    {editableFields.documentType?.toUpperCase()} · Confianza{" "}
                    {Math.round((currentExtraction?.overallConfidence ?? 0.96) * 100)}%
                  </Text>
                </View>

                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={14} color={mobileTheme.colors.success} />
                  <Text style={styles.verifiedBadgeText}>Verificado</Text>
                </View>
              </View>

              {/* Mode Toggle: Document / Fields */}
              <View style={styles.subViewToggleRow}>
                <MobileSegmentedControl
                  options={[
                    { id: "fields", label: "Campos Extraídos", icon: FileSpreadsheet },
                    { id: "document", label: "Ver Documento", icon: Eye },
                  ]}
                  selected={viewMode}
                  onChange={(id) => setViewMode(id as any)}
                />
              </View>

              {/* DOCUMENT VIEW */}
              {viewMode === "document" && selectedFile?.previewUrl && (
                <View style={styles.viewerCard}>
                  <View style={styles.viewerToolbar}>
                    <Text style={styles.fileNameText} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <View style={styles.viewerControls}>
                      <Pressable
                        onPress={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                        style={styles.controlIconBtn}
                      >
                        <ZoomOut size={15} color={mobileTheme.colors.text} />
                      </Pressable>
                      <Pressable
                        onPress={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                        style={styles.controlIconBtn}
                      >
                        <ZoomIn size={15} color={mobileTheme.colors.text} />
                      </Pressable>
                      <Pressable
                        onPress={() => setRotation((r) => (r + 90) % 360)}
                        style={styles.controlIconBtn}
                      >
                        <RotateCw size={15} color={mobileTheme.colors.text} />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.viewportContainer}>
                    <Image
                      source={{ uri: selectedFile.previewUrl }}
                      style={[
                        styles.previewImage,
                        { transform: [{ scale: zoomLevel }, { rotate: `${rotation}deg` }] },
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              )}

              {/* FIELDS REVIEW VIEW */}
              {viewMode === "fields" && (
                <View>
                  {/* Export Profile Selector & Global Copy Actions */}
                  <View style={styles.exportProfileCard}>
                    <Text style={styles.profileSectionTitle}>PERFIL DE EXPORTACIÓN</Text>
                    <View style={styles.profilesGrid}>
                      {EXPORT_PROFILES.map((prof) => (
                        <Pressable
                          key={prof.id}
                          onPress={() => setExportProfile(prof.id)}
                          style={[
                            styles.profileOptionBtn,
                            exportProfile === prof.id && styles.profileOptionBtnActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.profileOptionText,
                              exportProfile === prof.id && styles.profileOptionTextActive,
                            ]}
                          >
                            {prof.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <View style={styles.copyActionsRow}>
                      <Pressable onPress={handleCopyFormatted} style={styles.copyUtilBtn}>
                        <FileSpreadsheet size={13} color={mobileTheme.colors.text} />
                        <Text style={styles.copyUtilBtnText}>Copiar Campos</Text>
                      </Pressable>
                      <Pressable onPress={handleCopyJson} style={styles.copyUtilBtn}>
                        <Code size={13} color={mobileTheme.colors.text} />
                        <Text style={styles.copyUtilBtnText}>Copiar JSON</Text>
                      </Pressable>
                    </View>

                    {copyNotification && (
                      <View style={styles.copyNotificationPill}>
                        <CheckCircle2 size={13} color={mobileTheme.colors.success} />
                        <Text style={styles.copyNotificationText}>{copyNotification}</Text>
                      </View>
                    )}
                  </View>

                  {/* Editable Fields Breakdown */}
                  <View style={styles.fieldsContainer}>
                    <Text style={styles.fieldsListHeader}>DATOS DE IDENTIDAD EDITABLES</Text>

                    {Object.entries(editableFields).map(([key, value]) => {
                      if (key === "issuingCountry" || key === "surnames") return null;
                      const isCopied = copiedField === key;
                      const confidenceVal =
                        currentExtraction?.fieldConfidence?.[key as keyof IdentityDocumentFields] ??
                        currentExtraction?.overallConfidence ??
                        0.95;
                      const confidencePercent = Math.round(confidenceVal * 100);

                      return (
                        <View key={key} style={styles.fieldItemRow}>
                          <View style={styles.fieldItemHeader}>
                            <Text style={styles.fieldItemLabel}>
                              {FIELD_LABELS[key] || key}
                            </Text>
                            <View style={styles.fieldItemRight}>
                              <View
                                style={[
                                  styles.fieldConfidencePill,
                                  confidencePercent < 90 && styles.fieldConfidencePillMedium,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.fieldConfidenceText,
                                    confidencePercent < 90 && styles.fieldConfidenceTextMedium,
                                  ]}
                                >
                                  {confidencePercent}%
                                </Text>
                              </View>
                              <Pressable
                                onPress={() => handleCopySingleField(key, String(value || ""))}
                                style={styles.fieldCopyBtn}
                              >
                                {isCopied ? (
                                  <Check size={12} color={mobileTheme.colors.success} />
                                ) : (
                                  <Copy size={12} color={mobileTheme.colors.textMuted} />
                                )}
                              </Pressable>
                            </View>
                          </View>

                          <TextInput
                            value={String(value || "")}
                            onChangeText={(newVal) =>
                              handleFieldChange(key as ExportProfileField, newVal)
                            }
                            placeholder={`Ingresar ${FIELD_LABELS[key] || key}...`}
                            placeholderTextColor={mobileTheme.colors.textMuted}
                            style={styles.fieldInput}
                          />
                        </View>
                      );
                    })}
                  </View>

                  {/* Review Actions */}
                  <View style={styles.reviewActionsFooter}>
                    <Pressable onPress={handleConfirmExtraction} style={styles.confirmButton}>
                      <CheckCircle2 size={16} color="#ffffff" />
                      <Text style={styles.confirmButtonText}>Confirmar y Guardar Extracción</Text>
                    </Pressable>

                    {onNavigateToContact && (
                      <Pressable
                        onPress={() => {
                          Alert.alert("CRM", "Datos listos para asociar a contacto CRM.");
                          onNavigateToContact("new");
                        }}
                        style={styles.crmLinkButton}
                      >
                        <User size={15} color={mobileTheme.colors.primary} />
                        <Text style={styles.crmLinkButtonText}>Vincular con Contacto CRM</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTORIAL REAL DE EXTRACCIONES                                     */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* History Search */}
          <View style={{ marginBottom: 12 }}>
            <MobileSearchBar
              value={historySearch}
              onChangeText={setHistorySearch}
              placeholder="Buscar por titular, número o tipo..."
            />
          </View>

          {/* Type Filter */}
          <View style={{ marginBottom: 14 }}>
            <MobileSegmentedControl
              options={[
                { id: "all", label: "Todos" },
                { id: "dni", label: "DNI / NIE" },
                { id: "passport", label: "Pasaportes" },
              ]}
              selected={historyFilter}
              onChange={setHistoryFilter}
            />
          </View>

          {/* List */}
          {filteredHistory.length === 0 ? (
            <View style={styles.emptyHistoryBox}>
              <FileText size={36} color={mobileTheme.colors.textMuted} />
              <Text style={styles.emptyHistoryTitle}>No hay extracciones registradas</Text>
              <Text style={styles.emptyHistorySubtitle}>
                Sube o escanea un documento en la pestaña Extractor para comenzar.
              </Text>
            </View>
          ) : (
            filteredHistory.map((item) => {
              const docNum = item.fields.documentNumber || "N/A";
              const holderName = item.fields.fullName || item.title;
              const docTypeLabel =
                item.documentType === "spanish-dni"
                  ? "DNI Español"
                  : item.documentType === "spanish-nie"
                  ? "NIE Español"
                  : "Pasaporte";
              const confidencePercent = Math.round((item.overallConfidence ?? 0.95) * 100);

              return (
                <View key={item.id} style={styles.historyCard}>
                  <Pressable
                    onPress={() => handleOpenExistingExtraction(item)}
                    style={styles.historyCardMain}
                  >
                    <View style={styles.historyIconBox}>
                      <FileText size={20} color={mobileTheme.colors.primary} />
                    </View>

                    <View style={styles.historyInfo}>
                      <View style={styles.historyHeaderRow}>
                        <Text style={styles.historyName} numberOfLines={1}>
                          {holderName}
                        </Text>
                        <View style={styles.historyConfidenceBadge}>
                          <CheckCircle2 size={11} color={mobileTheme.colors.success} />
                          <Text style={styles.historyConfidenceText}>{confidencePercent}%</Text>
                        </View>
                      </View>

                      <Text style={styles.historyDetail}>
                        {docTypeLabel} · {docNum}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(item.createdAt).toLocaleDateString()} · {item.status.toUpperCase()}
                      </Text>
                    </View>

                    <ChevronRight size={18} color={mobileTheme.colors.textMuted} />
                  </Pressable>

                  <View style={styles.historyCardActions}>
                    <Pressable
                      onPress={() => handleOpenExistingExtraction(item)}
                      style={styles.historyActionBtn}
                    >
                      <Eye size={13} color={mobileTheme.colors.primary} />
                      <Text style={styles.historyActionBtnText}>Abrir Extracción</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDeleteExtraction(item.id)}
                      style={styles.historyDeleteBtn}
                    >
                      <Trash2 size={13} color={mobileTheme.colors.error} />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
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
  topNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  backButtonText: {
    color: mobileTheme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  tabToggleWrap: {
    flexDirection: "row",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  tabToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tabToggleBtnActive: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
  },
  tabToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: mobileTheme.colors.textMuted,
  },
  tabToggleTextActive: {
    color: mobileTheme.colors.primary,
    fontWeight: "800",
  },
  scrollContent: {
    paddingBottom: 48,
  },
  intakeContainer: {
    gap: 14,
  },
  dropzoneCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.primary,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: mobileTheme.radii.card,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dropzoneIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: mobileTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  dropzoneTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: mobileTheme.colors.text,
    textAlign: "center",
  },
  dropzoneSubtitle: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
    textAlign: "center",
    maxWidth: 280,
    marginTop: 4,
    lineHeight: 16,
  },
  uploadActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    width: "100%",
  },
  primaryUploadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  primaryUploadBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryUploadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  secondaryUploadBtnText: {
    color: mobileTheme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  fixturesDivider: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
    marginTop: 18,
    paddingTop: 14,
    alignItems: "center",
  },
  fixturesLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: mobileTheme.colors.textMuted,
    marginBottom: 8,
  },
  fixturesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  fixturePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: mobileTheme.colors.primarySoft,
    borderColor: mobileTheme.colors.primary,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fixturePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
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
    fontSize: 16,
    fontWeight: "800",
    color: mobileTheme.colors.text,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
    marginTop: 2,
  },
  previewContainer: {
    gap: 14,
  },
  viewerCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    overflow: "hidden",
  },
  viewerToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: mobileTheme.colors.borderLight,
    backgroundColor: mobileTheme.colors.surfaceMuted,
  },
  fileMetaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  fileNameText: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  viewerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  controlIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  viewportContainer: {
    height: 240,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  noPreviewBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  noPreviewText: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 6,
  },
  actionPromptCard: {
    gap: 8,
    alignItems: "center",
  },
  startExtractionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    width: "100%",
  },
  startExtractionBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  cancelLinkBtn: {
    paddingVertical: 6,
  },
  cancelLinkText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  processingCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.primary,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 20,
    alignItems: "center",
  },
  processingHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: mobileTheme.colors.primary,
    marginTop: 6,
  },
  processingSubtitle: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(19,91,236,0.15)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: 4,
  },
  progressPercentLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: mobileTheme.colors.primary,
    marginTop: 6,
    marginBottom: 16,
  },
  stepsList: {
    width: "100%",
    gap: 12,
  },
  stepItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  stepIndicatorDone: {
    backgroundColor: mobileTheme.colors.success,
    borderColor: mobileTheme.colors.success,
  },
  stepIndicatorCurrent: {
    backgroundColor: mobileTheme.colors.primary,
    borderColor: mobileTheme.colors.primary,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
  },
  stepNumberTextCurrent: {
    color: "#ffffff",
  },
  stepItemLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  stepItemLabelCurrent: {
    color: mobileTheme.colors.primary,
  },
  stepItemDesc: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
    marginTop: 1,
  },
  reviewWorkspaceContainer: {
    gap: 12,
  },
  reviewHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 12,
  },
  reviewDocTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: mobileTheme.colors.text,
  },
  reviewDocMeta: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: mobileTheme.colors.success,
  },
  subViewToggleRow: {
    marginBottom: 4,
  },
  exportProfileCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 12,
    marginBottom: 12,
  },
  profileSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: mobileTheme.colors.textMuted,
    marginBottom: 8,
  },
  profilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  profileOptionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  profileOptionBtnActive: {
    backgroundColor: mobileTheme.colors.primarySoft,
    borderColor: mobileTheme.colors.primary,
  },
  profileOptionText: {
    fontSize: 11,
    fontWeight: "600",
    color: mobileTheme.colors.textMuted,
  },
  profileOptionTextActive: {
    color: mobileTheme.colors.primary,
    fontWeight: "800",
  },
  copyActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  copyUtilBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  copyUtilBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  copyNotificationPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#ecfdf5",
  },
  copyNotificationText: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.success,
  },
  fieldsContainer: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 12,
    marginBottom: 14,
  },
  fieldsListHeader: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: mobileTheme.colors.textMuted,
    marginBottom: 12,
  },
  fieldItemRow: {
    marginBottom: 12,
  },
  fieldItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  fieldItemLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
  },
  fieldItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fieldConfidencePill: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  fieldConfidencePillMedium: {
    backgroundColor: "#fffbeb",
  },
  fieldConfidenceText: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.success,
  },
  fieldConfidenceTextMedium: {
    color: "#b45309",
  },
  fieldCopyBtn: {
    padding: 4,
  },
  fieldInput: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: mobileTheme.colors.text,
    fontWeight: "600",
  },
  reviewActionsFooter: {
    gap: 8,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  crmLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  crmLinkButtonText: {
    color: mobileTheme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyHistoryBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: mobileTheme.colors.text,
    marginTop: 10,
  },
  emptyHistorySubtitle: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
    textAlign: "center",
    maxWidth: 240,
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 12,
    marginBottom: 10,
  },
  historyCardMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
    marginRight: 8,
  },
  historyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  historyName: {
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.text,
    flex: 1,
    marginRight: 6,
  },
  historyConfidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyConfidenceText: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.success,
  },
  historyDetail: {
    fontSize: 12,
    fontWeight: "600",
    color: mobileTheme.colors.primary,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
  },
  historyCardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
    marginTop: 10,
    paddingTop: 8,
  },
  historyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  historyActionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  historyDeleteBtn: {
    padding: 4,
  },
});
