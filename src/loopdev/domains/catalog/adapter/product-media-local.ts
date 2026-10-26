import { localPlatformAdapter } from "@/loopdev/domains/platform/adapter";
import { localFilesAdapter } from "@/loopdev/domains/files/adapter";
import { localCatalogItemsStore, localCatalogVariantsStore } from "../data/localCatalog";
import { localProductMediaAssetsStore, localProductMediaAssignmentsStore } from "../data/localProductMedia";
import type { ProductMediaAdapter, ProductMediaAsset, ProductMediaAssignment, ProductMediaScope } from "../media/types";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageSize = 25 * 1024 * 1024;

function assertRead(organizationId: string) {
  if (!localPlatformAdapter.hasPermission("catalog.read", { organizationId, workspaceId: null })) {
    throw new Error("You do not have permission to view product media in this organization.");
  }
}

function assertWrite(organizationId: string) {
  if (!localPlatformAdapter.hasPermission("catalog.write", { organizationId, workspaceId: null })) {
    throw new Error("You do not have permission to manage product media in this organization.");
  }
}

function fileScope(organizationId: string) {
  return { organizationId, workspaceId: null };
}

function toAsset(asset: ProductMediaAsset, file: Awaited<ReturnType<typeof localFilesAdapter.list>>[number]): ProductMediaAsset {
  return {
    ...asset,
    fileId: file.id,
    fileName: file.fileName,
    mimeType: file.mimeType,
    byteSize: file.byteSize,
  };
}

async function listLibrary(params: ProductMediaScope): Promise<ProductMediaAsset[]> {
  assertRead(params.organizationId);
  const files = await localFilesAdapter.list({
    scope: fileScope(params.organizationId),
    relation: {
      entityType: "product_media_library",
      entityId: params.organizationId,
      scope: fileScope(params.organizationId),
    },
  });
  const fileById = new Map(files.filter((file) => imageTypes.has(file.mimeType)).map((file) => [file.id, file]));
  return localProductMediaAssetsStore.list()
    .filter((asset) => asset.organizationId === params.organizationId)
    .flatMap((asset) => {
      const file = fileById.get(asset.fileId);
      return file ? [toAsset(asset, file)] : [];
    });
}

function requireAsset(assetId: string, organizationId: string) {
  const asset = localProductMediaAssetsStore.get(assetId);
  if (!asset || asset.organizationId !== organizationId) throw new Error("Product media asset not found in this organization.");
  return asset;
}

export const localProductMediaAdapter: ProductMediaAdapter = {
  async listLibrary(params) {
    return listLibrary(params);
  },

  async listAssignments(params) {
    const library = await listLibrary(params);
    const assetById = new Map(library.map((asset) => [asset.id, asset]));
    return localProductMediaAssignmentsStore.list()
      .filter((assignment) => assignment.organizationId === params.organizationId && assignment.catalogItemId === params.catalogItemId)
      .sort((left, right) => {
        if (left.variantId !== right.variantId) return (left.variantId ?? "").localeCompare(right.variantId ?? "");
        return left.position - right.position;
      })
      .map((assignment) => {
        const asset = assetById.get(assignment.assetId);
        if (!asset) throw new Error("A product media assignment references a missing asset.");
        return { ...assignment, asset };
      });
  },

  async uploadAsset(input) {
    assertWrite(input.organizationId);
    if (!imageTypes.has(input.file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
    if (input.file.size < 1 || input.file.size > maxImageSize) throw new Error("Images must be smaller than 25 MB.");
    const scope = fileScope(input.organizationId);
    const file = await localFilesAdapter.createMetadata({
      scope,
      relation: { entityType: "product_media_library", entityId: input.organizationId, scope },
      fileName: input.file.name,
      mimeType: input.file.type,
      byteSize: input.file.size,
      category: "other",
      source: "upload",
      file: input.file,
    });
    return toAsset(localProductMediaAssetsStore.create({
      organizationId: input.organizationId,
      fileId: file.id,
      fileName: file.fileName,
      mimeType: file.mimeType,
      byteSize: file.byteSize,
      tags: [],
    }), file);
  },

  async updateTags(input) {
    assertWrite(input.organizationId);
    const asset = requireAsset(input.assetId, input.organizationId);
    const tags = Array.from(new Map(
      input.tags.map((tag) => tag.trim()).filter(Boolean).map((tag) => [tag.toLocaleLowerCase(), tag]),
    ).values());
    if (tags.length > 20 || tags.some((tag) => tag.length > 64)) {
      throw new Error("Use up to 20 image tags, with no more than 64 characters per tag.");
    }
    const updated = localProductMediaAssetsStore.update(asset.id, { tags });
    if (!updated) throw new Error("Product media asset could not be updated.");
    return { ...asset, ...updated };
  },

  async attach(input) {
    assertWrite(input.organizationId);
    const asset = requireAsset(input.assetId, input.organizationId);
    const item = localCatalogItemsStore.get(input.catalogItemId);
    if (!item || item.organizationId !== input.organizationId) throw new Error("Product not found in this organization.");
    if (input.variantId) {
      const variant = localCatalogVariantsStore.get(input.variantId);
      if (!variant || variant.organizationId !== input.organizationId || variant.catalogItemId !== input.catalogItemId) {
        throw new Error("Variant does not belong to this product and organization.");
      }
    }
    const duplicate = localProductMediaAssignmentsStore.list().some((assignment) =>
      assignment.organizationId === input.organizationId
      && assignment.assetId === asset.id
      && assignment.catalogItemId === input.catalogItemId
      && assignment.variantId === (input.variantId ?? null));
    if (duplicate) throw new Error("This image is already attached to the selected product or variant.");
    const gallery = localProductMediaAssignmentsStore.list().filter((assignment) =>
      assignment.organizationId === input.organizationId
      && assignment.catalogItemId === input.catalogItemId
      && assignment.variantId === (input.variantId ?? null));
    const assignment = localProductMediaAssignmentsStore.create({
      organizationId: input.organizationId,
      assetId: asset.id,
      catalogItemId: input.catalogItemId,
      variantId: input.variantId ?? null,
      altText: input.altText?.trim() ?? "",
      position: gallery.length,
      version: 1,
      asset,
    });
    return { ...assignment, asset };
  },

  async updateAltText(input) {
    assertWrite(input.organizationId);
    const assignment = localProductMediaAssignmentsStore.get(input.assignmentId);
    if (!assignment || assignment.organizationId !== input.organizationId) throw new Error("Product media assignment not found.");
    if (assignment.version !== input.expectedVersion) throw new Error("Product media assignment changed. Reload and try again.");
    const altText = input.altText.trim();
    if (altText.length > 512) throw new Error("Alternative text must be 512 characters or fewer.");
    const updated = localProductMediaAssignmentsStore.update(assignment.id, { altText, version: assignment.version + 1 });
    if (!updated) throw new Error("Product media assignment could not be updated.");
    return updated;
  },

  async detach(input) {
    assertWrite(input.organizationId);
    const assignment = localProductMediaAssignmentsStore.get(input.assignmentId);
    if (!assignment || assignment.organizationId !== input.organizationId) throw new Error("Product media assignment not found.");
    if (assignment.version !== input.expectedVersion) throw new Error("Product media assignment changed. Reload and try again.");
    localProductMediaAssignmentsStore.remove(assignment.id);
  },

  async reorderAssignments(input) {
    assertWrite(input.organizationId);
    const gallery = localProductMediaAssignmentsStore.list().filter((assignment) =>
      assignment.organizationId === input.organizationId
      && assignment.catalogItemId === input.catalogItemId
      && assignment.variantId === input.variantId);
    if (
      gallery.length !== input.assignments.length
      || new Set(input.assignments.map((assignment) => assignment.id)).size !== input.assignments.length
      || input.assignments.some((requested) => {
        const current = gallery.find((assignment) => assignment.id === requested.id);
        return !current || current.version !== requested.expectedVersion;
      })
    ) {
      throw new Error("Product media gallery changed. Reload and try again.");
    }
    input.assignments.forEach(({ id }, position) => {
      const current = gallery.find((assignment) => assignment.id === id);
      if (!current) throw new Error("Product media gallery changed. Reload and try again.");
      const updated = localProductMediaAssignmentsStore.update(id, { position, version: current.version + 1 });
      if (!updated) throw new Error("Product media gallery could not be reordered.");
    });
  },

  async getPreviewSource(assetId, params) {
    assertRead(params.organizationId);
    const asset = requireAsset(assetId, params.organizationId);
    return localFilesAdapter.getPreviewSource(asset.fileId);
  },
};
