import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import type { FilePreviewSource } from "@/loopdev/domains/files";
import type { PlatformFileReference } from "@contracts/platform-files";
import { supabasePlatformFilesPort } from "@/loopdev/domains/files/adapter/platform-files-supabase";
import { checksumForFile } from "@/loopdev/domains/files/data/checksum";
import type { ProductMediaAdapter, ProductMediaAsset, ProductMediaAssignment, ProductMediaScope } from "../media/types";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageSize = 25 * 1024 * 1024;

type AssetRow = { id: string; organization_id: string; file_id: string; tags: string[]; created_at: string; updated_at: string };
type AssignmentRow = { id: string; organization_id: string; asset_id: string; catalog_item_id: string; variant_id: string | null; alt_text: string; position: number; version: number; created_at: string; updated_at: string };

function mapAsset(asset: AssetRow, file: PlatformFileReference): ProductMediaAsset {
  return {
    id: asset.id,
    organizationId: asset.organization_id,
    fileId: asset.file_id,
    fileName: file.fileName,
    mimeType: file.mimeType,
    byteSize: file.byteSize,
    tags: asset.tags ?? [],
    createdAt: asset.created_at,
    updatedAt: asset.updated_at,
  };
}

function mapAssignment(row: AssignmentRow, asset: ProductMediaAsset): ProductMediaAssignment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    assetId: row.asset_id,
    catalogItemId: row.catalog_item_id,
    variantId: row.variant_id,
    altText: row.alt_text,
    position: Number(row.position),
    version: Number(row.version),
    asset,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadAssets(params: ProductMediaScope, assetIds?: string[]): Promise<ProductMediaAsset[]> {
  if (assetIds && assetIds.length === 0) return [];
  const client = defaultWebAuthAdapter.getClient();
  const { data: assetRows, error: assetError } = await client
    .from("erp_product_media_assets")
    .select("id,organization_id,file_id,tags,created_at,updated_at")
    .eq("organization_id", params.organizationId);
  if (assetError) throw new Error(assetError.message);
  const assets = ((assetRows ?? []) as AssetRow[]).filter((asset) => !assetIds || assetIds.includes(asset.id));
  if (!assets.length) return [];
  const filesResult = await supabasePlatformFilesPort.listLibrary({
    scope: { organizationId: params.organizationId },
    purpose: "product_media",
    fileIds: assets.map((asset) => asset.file_id),
  });
  if (filesResult.success === false) throw new Error(filesResult.error.message);
  const files = new Map(filesResult.data.map((file) => [file.id, file]));
  return assets.flatMap((asset) => {
    const file = files.get(asset.file_id);
    return file && imageTypes.has(file.mimeType) ? [mapAsset(asset, file)] : [];
  });
}

export const supabaseProductMediaAdapter: ProductMediaAdapter = {
  async listLibrary(params) {
    return loadAssets(params);
  },

  async listAssignments(params) {
    const client = defaultWebAuthAdapter.getClient();
    const { data, error } = await client
      .from("erp_product_media_assignments")
      .select("id,organization_id,asset_id,catalog_item_id,variant_id,alt_text,position,version,created_at,updated_at")
      .eq("organization_id", params.organizationId)
      .eq("catalog_item_id", params.catalogItemId)
      .order("variant_id", { ascending: true, nullsFirst: true })
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as AssignmentRow[];
    if (!rows.length) return [];
    const assets = await loadAssets(params, [...new Set(rows.map((row) => row.asset_id))]);
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));
    return rows.map((row) => {
      const asset = assetById.get(row.asset_id);
      if (!asset) throw new Error("A product media assignment references an unavailable asset.");
      return mapAssignment(row, asset);
    });
  },

  async uploadAsset(input) {
    if (!imageTypes.has(input.file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
    if (input.file.size < 1 || input.file.size > maxImageSize) throw new Error("Images must be smaller than 25 MB.");
    if (!input.catalogItemId) throw new Error("A product is required to upload product media.");
    if (!globalThis.crypto?.subtle) throw new Error("This browser cannot securely identify the uploaded image.");
    const client = defaultWebAuthAdapter.getClient();
    const idempotencyKey = await checksumForFile(input.file);
    const uploaded = await supabasePlatformFilesPort.upload({
      scope: { organizationId: input.organizationId },
      resource: { entityType: "catalog_item", entityId: input.catalogItemId },
      purpose: "product_media",
      fileName: input.file.name,
      mimeType: input.file.type,
      content: input.file,
      idempotencyKey,
    });
    if (uploaded.success === false) throw new Error(uploaded.error.message);
    let uploadState = uploaded.data;
    for (let attempt = 0; attempt < 4 && uploadState.status === "processing"; attempt += 1) {
      const { uploadId, retryAfterMs } = uploadState;
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
      const status = await supabasePlatformFilesPort.getUploadStatus({
        uploadId,
        scope: { organizationId: input.organizationId },
      });
      if (status.success === false) throw new Error(status.error.message);
      uploadState = status.data;
    }
    if (uploadState.status !== "ready") {
      throw new Error("The image is still processing. Retry the same file to finish the upload.");
    }
    const fileReference = uploadState.file;

    if (fileReference.organizationId !== input.organizationId) {
      throw new Error("Platform Files returned an image from a different organization.");
    }
    const findExistingAsset = async () => {
      const { data, error } = await client
        .from("erp_product_media_assets")
        .select("id,organization_id,file_id,tags,created_at,updated_at")
        .eq("organization_id", input.organizationId)
        .eq("file_id", fileReference.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as AssetRow | null;
    };
    const existing = await findExistingAsset();
    if (existing) {
      const assets = await loadAssets({ organizationId: input.organizationId }, [existing.id]);
      if (assets[0]) return assets[0];
      throw new Error("The finalized image is not available in the organization library.");
    }

    const { data, error } = await client
      .from("erp_product_media_assets")
      .insert({ organization_id: input.organizationId, file_id: fileReference.id, tags: [] })
      .select("id,organization_id,file_id,tags,created_at,updated_at")
      .single();
    if (error) {
      const recovered = await findExistingAsset();
      if (!recovered) {
        throw new Error(`${error.message} The finalized file remains in the Platform Files library.`);
      }
      const assets = await loadAssets({ organizationId: input.organizationId }, [recovered.id]);
      if (assets[0]) return assets[0];
      throw new Error("The finalized image is not available in the organization library.");
    }
    return mapAsset(data as AssetRow, fileReference);
  },

  async updateTags(input) {
    const tags = Array.from(new Map(
      input.tags.map((tag) => tag.trim()).filter(Boolean).map((tag) => [tag.toLocaleLowerCase(), tag]),
    ).values());
    if (tags.length > 20 || tags.some((tag) => tag.length > 64)) {
      throw new Error("Use up to 20 image tags, with no more than 64 characters per tag.");
    }
    const asset = (await loadAssets({ organizationId: input.organizationId }, [input.assetId]))[0];
    if (!asset) throw new Error("Product media asset not found in this organization.");
    const client = defaultWebAuthAdapter.getClient();
    const { data, error } = await client
      .from("erp_product_media_assets")
      .update({ tags })
      .eq("organization_id", input.organizationId)
      .eq("id", input.assetId)
      .select("tags")
      .single();
    if (error) throw new Error(error.message);
    return { ...asset, tags: (data.tags as string[]) ?? [] };
  },

  async attach(input) {
    const client = defaultWebAuthAdapter.getClient();
    const asset = (await loadAssets({ organizationId: input.organizationId }, [input.assetId]))[0];
    if (!asset) throw new Error("Product media asset not found in this organization.");
    const { data, error } = await client
      .from("erp_product_media_assignments")
      .insert({
        organization_id: input.organizationId,
        asset_id: input.assetId,
        catalog_item_id: input.catalogItemId,
        variant_id: input.variantId ?? null,
        alt_text: input.altText?.trim() ?? "",
      })
      .select("id,organization_id,asset_id,catalog_item_id,variant_id,alt_text,position,version,created_at,updated_at")
      .single();
    if (error) throw new Error(error.message);
    return mapAssignment(data as AssignmentRow, asset);
  },

  async updateAltText(input) {
    const altText = input.altText.trim();
    if (altText.length > 512) throw new Error("Alternative text must be 512 characters or fewer.");
    const client = defaultWebAuthAdapter.getClient();
    const { data: current, error: currentError } = await client
      .from("erp_product_media_assignments")
      .select("asset_id,version")
      .eq("organization_id", input.organizationId)
      .eq("id", input.assignmentId)
      .single();
    if (currentError) throw new Error(currentError.message);
    const asset = (await loadAssets({ organizationId: input.organizationId }, [current.asset_id]))[0];
    if (!asset) throw new Error("Product media asset not found in this organization.");
    const { data, error } = await client
      .from("erp_product_media_assignments")
      .update({ alt_text: altText })
      .eq("organization_id", input.organizationId)
      .eq("id", input.assignmentId)
      .eq("version", input.expectedVersion)
      .select("id,organization_id,asset_id,catalog_item_id,variant_id,alt_text,position,version,created_at,updated_at")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Product media assignment changed. Reload and try again.");
    return mapAssignment(data as AssignmentRow, asset);
  },

  async detach(input) {
    const client = defaultWebAuthAdapter.getClient();
    const { data, error } = await client
      .from("erp_product_media_assignments")
      .delete()
      .eq("organization_id", input.organizationId)
      .eq("id", input.assignmentId)
      .eq("version", input.expectedVersion)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Product media assignment changed. Reload and try again.");
  },

  async reorderAssignments(input) {
    const { error } = await defaultWebAuthAdapter.getClient().rpc("reorder_erp_product_media_assignments", {
      target_organization_id: input.organizationId,
      target_catalog_item_id: input.catalogItemId,
      target_variant_id: input.variantId,
      assignment_ids: input.assignments.map((assignment) => assignment.id),
      expected_versions: input.assignments.map((assignment) => assignment.expectedVersion),
    });
    if (error) {
      if (error.code === "40001" || /MEDIA_ORDER_CONFLICT/i.test(error.message)) {
        throw new Error("Product media gallery changed. Reload and try again.");
      }
      throw new Error(error.message);
    }
  },

  async getPreviewSource(assetId, params): Promise<FilePreviewSource | null> {
    if (!params.catalogItemId) throw new Error("A product is required to authorize the media preview.");
    const client = defaultWebAuthAdapter.getClient();
    const { data: asset, error: assetError } = await client
      .from("erp_product_media_assets")
      .select("file_id")
      .eq("organization_id", params.organizationId)
      .eq("id", assetId)
      .single();
    if (assetError) throw new Error(assetError.message);
    const { data: file, error: fileError } = await client
      .from("platform_files")
      .select("media_type,storage_path")
      .eq("organization_id", params.organizationId)
      .eq("id", asset.file_id)
      .eq("status", "active")
      .single();
    if (fileError) throw new Error(fileError.message);
    const preview = await supabasePlatformFilesPort.getPreviewSource({
      fileId: asset.file_id,
      scope: { organizationId: params.organizationId },
      resource: { entityType: "catalog_item", entityId: params.catalogItemId },
      rendition: "large",
    });
    if (preview.success === false) throw new Error(preview.error.message);
    return {
      url: preview.data.url,
      mimeType: preview.data.mimeType,
      expiresAt: preview.data.expiresAt,
    };
  },
};
