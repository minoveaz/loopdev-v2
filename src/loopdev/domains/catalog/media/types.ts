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
  asset: ProductMediaAsset;
}

export interface ProductMediaAdapter {
  listLibrary(params: ProductMediaScope): Promise<ProductMediaAsset[]>;
  listAssignments(params: ProductMediaScope & { catalogItemId: string }): Promise<ProductMediaAssignment[]>;
  uploadAsset(input: ProductMediaScope & { file: File }): Promise<ProductMediaAsset>;
  updateTags(input: ProductMediaScope & { assetId: string; tags: string[] }): Promise<ProductMediaAsset>;
  attach(input: ProductMediaScope & {
    assetId: string;
    catalogItemId: string;
    variantId?: string | null;
    altText?: string;
  }): Promise<ProductMediaAssignment>;
  updateAltText(input: ProductMediaScope & { assignmentId: string; altText: string }): Promise<ProductMediaAssignment>;
  detach(input: ProductMediaScope & { assignmentId: string }): Promise<void>;
  getPreviewSource(assetId: string, params: ProductMediaScope): Promise<FilePreviewSource | null>;
}
