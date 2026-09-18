import React, { useEffect, useRef, useState, useMemo } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Camera, File, FileText, Image as ImageIcon, Trash2, Upload, X } from "lucide-react-native";
import { mobileFilesAdapter as localFilesAdapter, type FileCategory, type FileRecord } from "../../adapters/files";
import { useT } from "../../i18n";
import {
  MobilePageTabs,
  MobileCard,
  MobileButton,
  MobileConfirmDialog,
  MobileEmptyState,
} from "../ui";

interface Props {
  contactId: string;
  contactName: string;
}

const categories: Array<{ id: FileCategory | "all"; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "identity", label: "Identidad" },
  { id: "contracts", label: "Contratos" },
  { id: "proposals", label: "Propuestas" },
  { id: "billing", label: "Facturación" },
  { id: "communications", label: "Comunicaciones" },
  { id: "other", label: "Otros" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MobileCustomer360Documents({ contactId, contactName }: Props) {
  const t = useT();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [uploadCategory, setUploadCategory] = useState<FileCategory>("identity");
  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await localFilesAdapter.listFiles({
        organizationId: "local-development-organization",
        relation: { entityType: "contact", entityId: contactId },
      });
      setFiles(res.items);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, [contactId]);

  const handleFileUpload = async (event: any) => {
    const selectedFiles: globalThis.File[] = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    for (const f of selectedFiles) {
      await localFilesAdapter.createFile({
        organizationId: "local-development-organization",
        name: f.name,
        category: uploadCategory,
        source: "upload",
        relation: { entityType: "contact", entityId: contactId, label: contactName },
        mediaType: f.type || "application/octet-stream",
        size: f.size,
      });
    }

    event.target.value = "";
    await loadFiles();
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await localFilesAdapter.deleteFile(fileToDelete.id);
      setFileToDelete(null);
      await loadFiles();
    } catch {
      // noop
    }
  };

  const filteredFiles = files.filter(
    (f) => f.status !== "deleted" && (selectedCategory === "all" || f.category === selectedCategory),
  );

  const tabs = useMemo(() => {
    return categories.map((c) => {
      const count =
        c.id === "all"
          ? files.filter((f) => f.status !== "deleted").length
          : files.filter((f) => f.status !== "deleted" && f.category === c.id).length;
      return {
        id: c.id,
        label: c.label,
        count,
      };
    });
  }, [files]);

  return (
    <View style={styles.container}>
      {/* Hidden Web Inputs */}
      {Platform.OS === "web" && (
        <>
          <input
            ref={fileInputRef as any}
            type="file"
            accept="image/*,application/pdf,text/*"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <input
            ref={cameraInputRef as any}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </>
      )}

      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Documentos del Contacto ({files.length})</Text>
        <Text style={styles.cardSubtitle}>Expediente digital, identificaciones y contratos adjuntos.</Text>
      </View>

      {/* Modern Dropzone Card */}
      <MobileCard style={styles.dropzoneCard}>
        <View style={styles.dropzoneIconCircle}>
          <Upload size={20} color="#135bec" />
        </View>
        <Text style={styles.dropzoneTitle}>Subir Documentos al Expediente</Text>
        <Text style={styles.dropzoneDesc}>Soporta PDF, imágenes PNG/JPG y comprobantes</Text>

        <View style={styles.dropzoneActionsRow}>
          <MobileButton
            variant="secondary"
            size="sm"
            icon={Upload}
            onPress={() => {
              if (Platform.OS === "web" && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            minHeight={44}
          >
            Examinar
          </MobileButton>

          <MobileButton
            variant="primary"
            size="sm"
            icon={Camera}
            onPress={() => {
              if (Platform.OS === "web" && cameraInputRef.current) {
                cameraInputRef.current.click();
              }
            }}
            minHeight={44}
          >
            Hacer Foto
          </MobileButton>
        </View>
      </MobileCard>

      {/* Category Filter Tabs (Canonical MobilePageTabs, STRICTLY NO PILLS) */}
      <MobilePageTabs
        tabs={tabs}
        activeTab={selectedCategory}
        onTabChange={setSelectedCategory}
      />

      {/* Documents List */}
      <View style={styles.documentsContainer}>
        {filteredFiles.length === 0 ? (
          <MobileEmptyState
            title="Sin documentos en esta categoría"
            description="Utiliza el botón superior para subir o capturar el primer archivo."
          />
        ) : (
          <View style={styles.filesList}>
            {filteredFiles.map((item) => {
              const isImage = item.mediaType.startsWith("image/");
              const isPdf = item.mediaType === "application/pdf";
              return (
                <MobileCard key={item.id} style={styles.fileCard}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir documento ${item.name}`}
                    style={styles.fileLeft}
                    onPress={() => setPreviewFile(item)}
                  >
                    <View style={styles.fileIconBox}>
                      {isImage ? (
                        <ImageIcon size={18} color="#135bec" />
                      ) : isPdf ? (
                        <FileText size={18} color="#dc2626" />
                      ) : (
                        <File size={18} color="#64748b" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.fileMetaRow}>
                        <View style={styles.catBadge}>
                          <Text style={styles.catBadgeText}>{item.category}</Text>
                        </View>
                        <Text style={styles.fileSizeText}>{formatBytes(item.size)}</Text>
                        <Text style={styles.fileDateText}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${item.name}`}
                    hitSlop={8}
                    style={styles.deleteButton}
                    onPress={() => setFileToDelete(item)}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </Pressable>
                </MobileCard>
              );
            })}
          </View>
        )}
      </View>

      {/* Preview Modal */}
      <Modal
        visible={Boolean(previewFile)}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewFile(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalCard}>
            <View style={styles.previewModalHeader}>
              <Text style={styles.previewModalTitle} numberOfLines={1}>
                {previewFile?.name}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar vista previa"
                onPress={() => setPreviewFile(null)}
                style={styles.closeBtn}
              >
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <View style={styles.previewModalBody}>
              {previewFile?.mediaType.startsWith("image/") ? (
                <Image
                  source={{ uri: previewFile.uri || previewFile.name }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.previewDocPlaceholder}>
                  <FileText size={48} color="#64748b" />
                  <Text style={styles.previewDocText}>Vista previa de documento</Text>
                  <Text style={styles.previewDocSub}>{previewFile?.mediaType}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Delete Dialog */}
      <MobileConfirmDialog
        visible={Boolean(fileToDelete)}
        title="Eliminar Documento"
        message={`¿Estás seguro de que deseas eliminar "${fileToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setFileToDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  dropzoneCard: {
    alignItems: "center",
    padding: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    marginBottom: 12,
  },
  dropzoneIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dropzoneTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 2,
  },
  dropzoneDesc: {
    fontSize: 12,
    color: "#3b82f6",
    marginBottom: 12,
  },
  dropzoneActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  documentsContainer: {
    marginTop: 12,
  },
  filesList: {
    gap: 8,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  fileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minHeight: 44,
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  fileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  catBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  fileSizeText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  fileDateText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  deleteButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  previewModalCard: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
  },
  previewModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  previewModalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  previewModalBody: {
    height: 350,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewDocPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  previewDocText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginTop: 10,
  },
  previewDocSub: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
});
