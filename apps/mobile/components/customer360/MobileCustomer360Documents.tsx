import React, { useEffect, useRef, useState } from "react";
import { Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Camera, File, FileText, Image as ImageIcon, Plus, Trash2, Upload, X } from "lucide-react-native";
import { mobileFilesAdapter as localFilesAdapter, type FileCategory, type FileRecord } from "../../adapters/files";
import { useT } from "../../i18n";

interface Props {
  contactId: string;
  contactName: string;
}

const categories: Array<{ id: FileCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "identity", label: "Identity" },
  { id: "contracts", label: "Contracts" },
  { id: "proposals", label: "Proposals" },
  { id: "billing", label: "Billing" },
  { id: "communications", label: "Communications" },
  { id: "other", label: "Other" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MobileCustomer360Documents({ contactId, contactName }: Props) {
  const t = useT();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | "all">("all");
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [uploadCategory, setUploadCategory] = useState<FileCategory>("identity");

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

  const handleDeleteFile = async (file: FileRecord) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Delete file "${file.name}"?`);
      if (confirmed) {
        await localFilesAdapter.deleteFile(file.id);
        await loadFiles();
      }
    } else {
      Alert.alert(t("common.delete"), `Delete "${file.name}"?`, [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            await localFilesAdapter.deleteFile(file.id);
            await loadFiles();
          },
        },
      ]);
    }
  };

  const filteredFiles = files.filter(
    (f) => f.status !== "deleted" && (selectedCategory === "all" || f.category === selectedCategory),
  );

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

      {/* Header with Upload Triggers */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{t("crm.customer360.documents.title")} ({files.length})</Text>
          <Text style={styles.cardSubtitle}>{t("crm.customer360.documents.subtitle")}</Text>
        </View>
        <View style={styles.uploadRow}>
          <Pressable
            style={styles.uploadButton}
            onPress={() => {
              if (Platform.OS === "web" && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            <Upload size={13} color="#135bec" />
            <Text style={styles.uploadButtonText}>{t("crm.customer360.documents.upload")}</Text>
          </Pressable>
          <Pressable
            style={[styles.uploadButton, styles.cameraButton]}
            onPress={() => {
              if (Platform.OS === "web" && cameraInputRef.current) {
                cameraInputRef.current.click();
              }
            }}
          >
            <Camera size={13} color="#ffffff" />
            <Text style={[styles.uploadButtonText, styles.cameraButtonText]}>Photo</Text>
          </Pressable>
        </View>
      </View>

      {/* Category Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryPillsRow}>
          {categories.map((cat) => {
            const isActive = cat.id === selectedCategory;
            return (
              <Pressable
                key={cat.id}
                style={[styles.catPill, isActive && styles.catPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Documents List */}
      <View style={styles.documentsContainer}>
        {filteredFiles.length === 0 ? (
          <View style={styles.emptyBox}>
            <FileText size={28} color="#94a3b8" />
            <Text style={styles.emptyTitle}>{t("crm.customer360.documents.noDocuments")}</Text>
            <Text style={styles.emptySubtitle}>{t("crm.customer360.documents.noDocumentsDesc")}</Text>
          </View>
        ) : (
          <View style={styles.filesList}>
            {filteredFiles.map((item) => {
              const isImage = item.mediaType.startsWith("image/");
              const isPdf = item.mediaType === "application/pdf";
              return (
                <View key={item.id} style={styles.fileCard}>
                  <Pressable
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
                        <Text style={styles.fileSizeText}>
                          {formatBytes(item.size)}
                        </Text>
                        <Text style={styles.fileDateText}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  <Pressable
                    hitSlop={8}
                    style={styles.deleteButton}
                    onPress={() => handleDeleteFile(item)}
                  >
                    <Trash2 size={15} color="#ef4444" />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Preview Modal */}
      <Modal visible={Boolean(previewFile)} animationType="fade" transparent onRequestClose={() => setPreviewFile(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalCard}>
            <View style={styles.previewModalHeader}>
              <Text style={styles.previewModalTitle} numberOfLines={1}>
                {previewFile?.name}
              </Text>
              <Pressable onPress={() => setPreviewFile(null)}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>
            <View style={styles.previewModalBody}>
              <View style={styles.previewDetailsBox}>
                <Text style={styles.previewDetailRow}>
                  <Text style={styles.previewDetailLabel}>Categoría: </Text>
                  {previewFile?.category}
                </Text>
                <Text style={styles.previewDetailRow}>
                  <Text style={styles.previewDetailLabel}>Tipo MIME: </Text>
                  {previewFile?.mediaType}
                </Text>
                <Text style={styles.previewDetailRow}>
                  <Text style={styles.previewDetailLabel}>Tamaño: </Text>
                  {previewFile ? formatBytes(previewFile.size) : "—"}
                </Text>
                <Text style={styles.previewDetailRow}>
                  <Text style={styles.previewDetailLabel}>Fecha de Carga: </Text>
                  {previewFile ? new Date(previewFile.createdAt).toLocaleString() : "—"}
                </Text>
                <Text style={styles.previewDetailRow}>
                  <Text style={styles.previewDetailLabel}>ID de Archivo: </Text>
                  {previewFile?.id}
                </Text>
              </View>
            </View>
            <View style={styles.previewModalFooter}>
              <Pressable style={styles.previewModalClose} onPress={() => setPreviewFile(null)}>
                <Text style={styles.previewModalCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  uploadRow: {
    flexDirection: "row",
    gap: 6,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#135bec",
  },
  cameraButton: {
    backgroundColor: "#135bec",
    borderColor: "#135bec",
  },
  cameraButtonText: {
    color: "#ffffff",
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryPillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  catPill: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  catPillActive: {
    backgroundColor: "#135bec",
  },
  catPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  catPillTextActive: {
    color: "#ffffff",
  },
  documentsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  filesList: {
    gap: 8,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  fileLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginRight: 8,
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    fontSize: 13,
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
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    textTransform: "capitalize",
  },
  fileSizeText: {
    fontSize: 11,
    color: "#64748b",
  },
  fileDateText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  deleteButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    padding: 18,
  },
  previewModalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
  },
  previewModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  previewModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    marginRight: 10,
  },
  previewModalBody: {
    marginBottom: 14,
  },
  previewDetailsBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 8,
  },
  previewDetailRow: {
    fontSize: 13,
    color: "#334155",
  },
  previewDetailLabel: {
    fontWeight: "700",
    color: "#64748b",
  },
  previewModalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  previewModalClose: {
    backgroundColor: "#135bec",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  previewModalCloseText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
