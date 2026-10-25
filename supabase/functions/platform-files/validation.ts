export const MAX_PRODUCT_MEDIA_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;

export type ProductMediaMimeType = "image/jpeg" | "image/png" | "image/webp";

export interface ImageDimensions {
  width: number;
  height: number;
}

export function isProductMediaMimeType(value: unknown): value is ProductMediaMimeType {
  return value === "image/jpeg" || value === "image/png" || value === "image/webp";
}

export function hasMatchingImageSignature(
  mimeType: ProductMediaMimeType,
  bytes: Uint8Array,
): boolean {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return bytes.length >= 8
      && bytes[0] === 0x89
      && bytes[1] === 0x50
      && bytes[2] === 0x4e
      && bytes[3] === 0x47
      && bytes[4] === 0x0d
      && bytes[5] === 0x0a
      && bytes[6] === 0x1a
      && bytes[7] === 0x0a;
  }
  return bytes.length >= 12
    && bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50;
}

export function renditionDimensions(
  source: ImageDimensions,
  maxEdge: number,
): ImageDimensions {
  if (
    !Number.isInteger(source.width)
    || !Number.isInteger(source.height)
    || source.width < 1
    || source.height < 1
    || source.width * source.height > MAX_IMAGE_PIXELS
  ) {
    throw new Error("Image dimensions are outside the supported range.");
  }
  if (!Number.isInteger(maxEdge) || maxEdge < 1) {
    throw new Error("Rendition size is invalid.");
  }
  const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
  return {
    width: Math.max(1, Math.floor(source.width * scale)),
    height: Math.max(1, Math.floor(source.height * scale)),
  };
}
