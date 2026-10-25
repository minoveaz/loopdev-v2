import type { Entity } from "@/types";
import type { FilePreviewSource } from "@/loopdev/domains/files";

export interface ProductMediaScope {
  organizationId: string;
}

export interface ProductMediaAsset extends Entity {
  organizationId: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  tags: string[];
}

export interface ProductMediaAssignment extends Entity {
  organizationId: string;
  assetId: string;
  catalogItemId: string;
  variantId: string | null;
  altText: string;
  position: number;
  version: number;
  asset: ProductMediaAsset;
}

export interface ProductMediaAdapter {
  listLibrary(params: ProductMediaScope): Promise<ProductMediaAsset[]>;
  listAssignments(params: ProductMediaScope & { catalogItemId: string }): Promise<ProductMediaAssignment[]>;
  uploadAsset(input: ProductMediaScope & { catalogItemId?: string; file: File }): Promise<ProductMediaAsset>;
  updateTags(input: ProductMediaScope & { assetId: string; tags: string[] }): Promise<ProductMediaAsset>;
  attach(input: ProductMediaScope & {
    assetId: string;
    catalogItemId: string;
    variantId?: string | null;
    altText?: string;
  }): Promise<ProductMediaAssignment>;
  updateAltText(input: ProductMediaScope & { assignmentId: string; expectedVersion: number; altText: string }): Promise<ProductMediaAssignment>;
  detach(input: ProductMediaScope & { assignmentId: string; expectedVersion: number }): Promise<void>;
  reorderAssignments(input: ProductMediaScope & {
    catalogItemId: string;
    variantId: string | null;
    assignments: Array<{ id: string; expectedVersion: number }>;
  }): Promise<void>;
  getPreviewSource(assetId: string, params: ProductMediaScope & { catalogItemId?: string }): Promise<FilePreviewSource | null>;
}
