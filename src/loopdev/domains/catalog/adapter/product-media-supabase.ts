import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import type { FilePreviewSource } from "@/loopdev/domains/files";
import type { ProductMediaAdapter, ProductMediaAsset, ProductMediaAssignment, ProductMediaScope } from "../media/types";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageSize = 25 * 1024 * 1024;
const bucket = "platform-files";

type AssetRow = { id: string; organization_id: string; file_id: string; tags: string[]; created_at: string; updated_at: string };
type FileRow = { id: string; name: string; media_type: string; size: number; status: string; storage_path: string | null };
type AssignmentRow = { id: string; organization_id: string; asset_id: string; catalog_item_id: string; variant_id: string | null; alt_text: string; created_at: string; updated_at: string };

function mapAsset(asset: AssetRow, file: FileRow): ProductMediaAsset {
  return {
    id: asset.id,
    organizationId: asset.organization_id,
    fileId: asset.file_id,
    fileName: file.name,
    mimeType: file.media_type,
    byteSize: Number(file.size),
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
    asset,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadAssets(params: ProductMediaScope, assetIds?: string[]): Promise<ProductMediaAsset[]> {
  if (assetIds && assetIds.length === 0) return [];
  const client = defaultWebAuthAdapter.getClient();
  let assetQuery = client
    .from("erp_product_media_assets")
    .select("id,organization_id,file_id,tags,created_at,updated_at")
    .eq("organization_id", params.organizationId);
  if (assetIds) assetQuery = assetQuery.in("id", assetIds);
  const { data: assetRows, error: assetError } = await assetQuery;
  if (assetError) throw new Error(assetError.message);
  const assets = (assetRows ?? []) as AssetRow[];
  if (!assets.length) return [];
  const { data: fileRows, error: fileError } = await client
    .from("platform_files")
    .select("id,name,media_type,size,status,storage_path")
    .eq("organization_id", params.organizationId)
    .eq("status", "active")
    .in("id", assets.map((asset) => asset.file_id));
  if (fileError) throw new Error(fileError.message);
  const files = new Map(((fileRows ?? []) as FileRow[]).map((file) => [file.id, file]));
  return assets.flatMap((asset) => {
    const file = files.get(asset.file_id);
    return file && imageTypes.has(file.media_type) ? [mapAsset(asset, file)] : [];
  });
}

async function cleanupUpload(client: ReturnType<typeof defaultWebAuthAdapter.getClient>, organizationId: string, fileId: string, path: string, hasFileRow: boolean) {
  const errors: string[] = [];
  const { error: assetError } = await client.from("erp_product_media_assets").delete().eq("organization_id", organizationId).eq("file_id", fileId);
  if (assetError) errors.push(assetError.message);
  if (hasFileRow) {
    const { error } = await client.from("platform_files").delete().eq("organization_id", organizationId).eq("id", fileId);
    if (error) errors.push(error.message);
  }
  const { error: storageError } = await client.storage.from(bucket).remove([path]);
  if (storageError) errors.push(storageError.message);
  return errors;
}

export const supabaseProductMediaAdapter: ProductMediaAdapter = {
  async listLibrary(params) {
    return loadAssets(params);
  },

  async listAssignments(params) {
    const client = defaultWebAuthAdapter.getClient();
    const { data, error } = await client
      .from("erp_product_media_assignments")
      .select("id,organization_id,asset_id,catalog_item_id,variant_id,alt_text,created_at,updated_at")
      .eq("organization_id", params.organizationId)
      .eq("catalog_item_id", params.catalogItemId)
      .order("created_at", { ascending: true });
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
    const client = defaultWebAuthAdapter.getClient();
    const fileId = globalThis.crypto?.randomUUID?.();
    if (!fileId) throw new Error("The browser could not generate an image identifier.");
    const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `organizations/${input.organizationId}/product-media/${fileId}/${safeName}`;
    const { error: uploadError } = await client.storage.from(bucket).upload(path, input.file, {
      contentType: input.file.type,
      upsert: false,
    });
    if (uploadError) throw new Error(uploadError.message);

    let hasFileRow = false;
    try {
      const { error: fileError } = await client.from("platform_files").insert({
        id: fileId,
        organization_id: input.organizationId,
        name: input.file.name,
        category: "other",
        source: "upload",
        media_type: input.file.type,
        size: input.file.size,
        status: "active",
        relation_type: "product_media_library",
        relation_id: input.organizationId,
        storage_path: path,
      });
      if (fileError) throw new Error(fileError.message);
      hasFileRow = true;
      const { data, error } = await client
        .from("erp_product_media_assets")
        .insert({ organization_id: input.organizationId, file_id: fileId, tags: [] })
        .select("id,organization_id,file_id,tags,created_at,updated_at")
        .single();
      if (error) throw new Error(error.message);
      return mapAsset(data as AssetRow, {
        id: fileId,
        name: input.file.name,
        media_type: input.file.type,
        size: input.file.size,
        status: "active",
        storage_path: path,
      });
    } catch (cause) {
      const cleanupErrors = await cleanupUpload(client, input.organizationId, fileId, path, hasFileRow);
      const message = cause instanceof Error ? cause.message : "Image upload failed.";
      if (cleanupErrors.length) throw new Error(`${message} Cleanup also failed: ${cleanupErrors.join("; ")}`);
      throw cause;
    }
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
      .select("id,organization_id,asset_id,catalog_item_id,variant_id,alt_text,created_at,updated_at")
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
      .select("asset_id")
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
      .select("id,organization_id,asset_id,catalog_item_id,variant_id,alt_text,created_at,updated_at")
      .single();
    if (error) throw new Error(error.message);
    return mapAssignment(data as AssignmentRow, asset);
  },

  async detach(input) {
    const client = defaultWebAuthAdapter.getClient();
    const { error } = await client
      .from("erp_product_media_assignments")
      .delete()
      .eq("organization_id", input.organizationId)
      .eq("id", input.assignmentId);
    if (error) throw new Error(error.message);
  },

  async getPreviewSource(assetId, params): Promise<FilePreviewSource | null> {
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
    if (!file.storage_path) return { url: null, mimeType: file.media_type };
    const { data, error } = await client.storage.from(bucket).createSignedUrl(file.storage_path, 3600);
    if (error) throw new Error(error.message);
    return { url: data.signedUrl, mimeType: file.media_type };
  },
};
