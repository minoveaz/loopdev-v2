import { makeWebpRendition } from "./image-processing.ts";
import {
  hasMatchingImageSignature,
  isProductMediaMimeType,
  MAX_PRODUCT_MEDIA_BYTES,
} from "./validation.ts";

export type ProductMediaRenditionName = "large" | "thumbnail";

export interface ProductMediaRenditionArtifact {
  rendition: ProductMediaRenditionName;
  storagePath: string;
  mediaType: "image/webp";
  byteSize: number;
  width: number;
  height: number;
  bytes: Uint8Array;
}

const renditionMaxEdges: Record<ProductMediaRenditionName, number> = {
  large: 1600,
  thumbnail: 400,
};

export async function createProductMediaRenditionArtifacts(input: {
  organizationId: string;
  fileId: string;
  mimeType: string;
  bytes: Uint8Array;
  renditions: ProductMediaRenditionName[];
}): Promise<ProductMediaRenditionArtifact[]> {
  if (
    !isProductMediaMimeType(input.mimeType)
    || !hasMatchingImageSignature(input.mimeType, input.bytes)
  ) {
    throw new Error("The existing product media file is not a supported image.");
  }
  if (input.bytes.byteLength < 1 || input.bytes.byteLength > MAX_PRODUCT_MEDIA_BYTES) {
    throw new Error("The existing product media file size is outside the supported range.");
  }

  const artifacts: ProductMediaRenditionArtifact[] = [];
  for (const rendition of new Set(input.renditions)) {
    const result = await makeWebpRendition(input.bytes, renditionMaxEdges[rendition]);
    artifacts.push({
      rendition,
      storagePath: `organizations/${input.organizationId}/product-media/${input.fileId}/renditions/${rendition}.webp`,
      mediaType: "image/webp",
      byteSize: result.bytes.byteLength,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });
  }
  return artifacts;
}
