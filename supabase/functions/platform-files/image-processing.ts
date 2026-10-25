import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
} from "npm:@imagemagick/magick-wasm@0.0.45";
import { MAX_IMAGE_PIXELS, renditionDimensions, type ImageDimensions } from "./validation.ts";

export interface RenditionResult extends ImageDimensions {
  bytes: Uint8Array;
}

const wasmPath = import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.45/magick.wasm");
export const imageMagickReady = initializeImageMagick(await Deno.readFile(new URL(wasmPath)));

export async function makeWebpRendition(bytes: Uint8Array, maxEdge: number): Promise<RenditionResult> {
  await imageMagickReady;
  let result: RenditionResult | null = null;
  await ImageMagick.read(bytes, async (image) => {
    const source = { width: image.width, height: image.height };
    if (source.width * source.height > MAX_IMAGE_PIXELS) {
      throw new Error("The image dimensions are too large to process safely.");
    }
    const dimensions = renditionDimensions(source, maxEdge);
    image.resize(dimensions.width, dimensions.height);
    await image.write(MagickFormat.WebP, (encoded) => {
      result = { ...dimensions, bytes: new Uint8Array(encoded) };
    });
  });
  if (!result) throw new Error("The uploaded file is not a supported image.");
  return result;
}
