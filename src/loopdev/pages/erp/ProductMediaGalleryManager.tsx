import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { FormSectionHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePicker } from "@/loopdev/components/files/FilePicker";
import { productMediaAdapter, type ProductMediaAssignment } from "@/loopdev/domains/catalog";
import type { CatalogItem, CatalogVariant } from "@/loopdev/domains/catalog";
import type { FilePreviewSource } from "@/loopdev/domains/files";
import { useT } from "@/i18n";

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const maxImageSize = 25 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProductMediaGalleryManager({
  item,
  variants,
  organizationId,
}: {
  item: CatalogItem;
  variants: CatalogVariant[];
  organizationId: string;
}) {
  const t = useT();
  const translateRef = useRef(t);
  translateRef.current = t;
  const [assignments, setAssignments] = useState<ProductMediaAssignment[]>([]);
  const [previewSources, setPreviewSources] = useState<Record<string, FilePreviewSource>>({});
  const [altTextDrafts, setAltTextDrafts] = useState<Record<string, string>>({});
  const [targetVariantId, setTargetVariantId] = useState("__product");
  const [previewedAssignment, setPreviewedAssignment] = useState<ProductMediaAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [workingAssetId, setWorkingAssetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const previewRef = useRef<Record<string, FilePreviewSource>>({});

  const clearPreviews = useCallback(() => {
    Object.values(previewRef.current).forEach((source) => source.revoke?.());
    previewRef.current = {};
    setPreviewSources({});
  }, []);

  const reload = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const loadedAssignments = await productMediaAdapter.listAssignments({ organizationId, catalogItemId: item.id });
      const assetIds = [...new Set(loadedAssignments.map((assignment) => assignment.assetId))];
      const sources = await Promise.all(assetIds.map(async (assetId) => [
        assetId,
        await productMediaAdapter.getPreviewSource(assetId, { organizationId }),
      ] as const));
      if (requestId !== requestRef.current) {
        sources.forEach(([, source]) => source?.revoke?.());
        return;
      }
      clearPreviews();
      const nextSources = Object.fromEntries(sources.filter((entry): entry is readonly [string, FilePreviewSource] => entry[1] !== null));
      previewRef.current = nextSources;
      setPreviewSources(nextSources);
      setAssignments(loadedAssignments);
      setAltTextDrafts(Object.fromEntries(loadedAssignments.map((assignment) => [assignment.id, assignment.altText])));
    } catch (cause) {
      if (requestId === requestRef.current) {
        setError(cause instanceof Error ? cause.message : translateRef.current("common.erpProductRecord.mediaLoadError"));
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [clearPreviews, item.id, organizationId]);

  useEffect(() => {
    void reload();
    return () => {
      requestRef.current += 1;
      Object.values(previewRef.current).forEach((source) => source.revoke?.());
      previewRef.current = {};
    };
  }, [reload]);

  const selectedVariantId = targetVariantId === "__product" ? null : targetVariantId;
  const variantNames = new Map(variants.map((variant) => [variant.id, variant.name]));

  const uploadImages = async (files: File[]) => {
    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const asset = await productMediaAdapter.uploadAsset({ organizationId, file });
        await productMediaAdapter.attach({
          organizationId,
          assetId: asset.id,
          catalogItemId: item.id,
          variantId: selectedVariantId,
        });
      }
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.erpProductRecord.mediaUploadError"));
      await reload();
    } finally {
      setUploading(false);
    }
  };

  const saveAltText = async (assignment: ProductMediaAssignment) => {
    setWorkingAssetId(assignment.assetId);
    setError(null);
    try {
      await productMediaAdapter.updateAltText({
        organizationId,
        assignmentId: assignment.id,
        altText: altTextDrafts[assignment.id] ?? "",
      });
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.erpProductRecord.mediaSaveError"));
    } finally {
      setWorkingAssetId(null);
    }
  };

  const detachAsset = async (assignment: ProductMediaAssignment) => {
    setWorkingAssetId(assignment.assetId);
    setError(null);
    try {
      await productMediaAdapter.detach({ organizationId, assignmentId: assignment.id });
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.erpProductRecord.mediaRemoveError"));
    } finally {
      setWorkingAssetId(null);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <FormSectionHeader
        eyebrow={t("common.erpProductRecord.mediaEyebrow")}
        title={t("common.erpProductRecord.mediaTitle")}
        description={t("common.erpProductRecord.mediaDescription")}
        mode="expanded"
        responsive="auto"
      />
      <div className="mt-4 flex flex-wrap items-end gap-4">
        {variants.length > 0 && (
          <div className="min-w-56">
            <label className="mb-1.5 block text-sm font-medium" htmlFor={`media-target-${item.id}`}>
              {t("common.erpProductRecord.mediaTarget")}
            </label>
            <Select value={targetVariantId} onValueChange={setTargetVariantId}>
              <SelectTrigger id={`media-target-${item.id}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__product">{t("common.erpProductRecord.mediaProductTarget")}</SelectItem>
                {variants.map((variant) => <SelectItem key={variant.id} value={variant.id}>{variant.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="min-w-64 flex-1">
          <FilePicker
            multiple
            maxFiles={10}
            acceptedTypes={acceptedImageTypes}
            maxSizeBytes={maxImageSize}
            accept={acceptedImageTypes.join(",")}
            disabled={uploading}
            compact
            onFilesSelected={(files) => { void uploadImages(files); }}
          />
        </div>
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {uploading && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />{t("common.erpProductRecord.uploadingMedia")}</p>}

      {loading ? <p role="status" className="mt-5 text-sm text-muted-foreground">{t("common.erpProductRecord.loadingMedia")}</p> : (
        <div className="mt-5">
          {assignments.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {assignments.map((assignment) => (
              <article key={assignment.id} className="overflow-hidden rounded-lg border border-border">
                <div className="aspect-square bg-muted p-2">
                  {previewSources[assignment.assetId]?.url
                    ? <button
                      type="button"
                      className="flex h-full w-full cursor-zoom-in items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={t("common.erpProductRecord.previewMedia", { name: assignment.asset.fileName })}
                      onClick={() => setPreviewedAssignment(assignment)}
                    >
                      <img
                        className="h-full w-full object-contain"
                        src={previewSources[assignment.assetId].url ?? undefined}
                        alt={assignment.altText || assignment.asset.fileName}
                      />
                    </button>
                    : <div className="flex h-full items-center justify-center text-muted-foreground"><ImagePlus className="h-8 w-8" aria-hidden="true" /></div>}
                </div>
                <div className="space-y-3 p-3">
                  <div>
                    <p className="truncate text-sm font-medium" title={assignment.asset.fileName}>{assignment.asset.fileName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {assignment.variantId ? variantNames.get(assignment.variantId) ?? t("common.erpProductRecord.mediaVariantTarget") : t("common.erpProductRecord.mediaProductTarget")}
                    </p>
                    <p className="text-xs text-muted-foreground">{assignment.asset.mimeType} · {formatBytes(assignment.asset.byteSize)}</p>
                  </div>
                  <label className="block space-y-1.5 text-sm font-medium">
                    {t("common.erpProductRecord.altText")}
                    <Input
                      maxLength={512}
                      value={altTextDrafts[assignment.id] ?? ""}
                      onChange={(event) => setAltTextDrafts((current) => ({ ...current, [assignment.id]: event.target.value }))}
                    />
                  </label>
                  <div className="flex justify-between gap-2">
                    <Button type="button" size="sm" variant="outline" disabled={workingAssetId === assignment.assetId || (altTextDrafts[assignment.id] ?? "") === assignment.altText} onClick={() => void saveAltText(assignment)}>
                      {t("common.erpProductRecord.saveAltText")}
                    </Button>
                    <Button type="button" size="icon" variant="ghost" aria-label={t("common.erpProductRecord.detachMedia", { name: assignment.asset.fileName })} disabled={workingAssetId === assignment.assetId} onClick={() => void detachAsset(assignment)}>
                      {workingAssetId === assignment.assetId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div> : <p className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">{t("common.erpProductRecord.noMediaForTarget")}</p>}
        </div>
      )}

      <Dialog open={previewedAssignment !== null} onOpenChange={(open) => { if (!open) setPreviewedAssignment(null); }}>
        {previewedAssignment && <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{previewedAssignment.asset.fileName}</DialogTitle>
            <DialogDescription>
              {previewedAssignment.altText || t("common.erpProductRecord.previewMediaDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[min(72dvh,800px)] min-h-48 items-center justify-center overflow-hidden rounded-md bg-muted p-3">
            <img
              className="max-h-[min(72dvh,800px)] max-w-full object-contain"
              src={previewSources[previewedAssignment.assetId]?.url ?? undefined}
              alt={previewedAssignment.altText || previewedAssignment.asset.fileName}
            />
          </div>
        </DialogContent>}
      </Dialog>
    </section>
  );
}
