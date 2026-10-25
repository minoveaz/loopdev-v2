import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { makeWebpRendition } from "./image-processing.ts";
import {
  hasMatchingImageSignature,
  isProductMediaMimeType,
  renditionDimensions,
} from "./validation.ts";

function concatenate(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(name: string, payload: Uint8Array): Uint8Array {
  const content = concatenate([new TextEncoder().encode(name), payload]);
  const chunk = new Uint8Array(12 + payload.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, payload.length);
  chunk.set(content, 4);
  view.setUint32(8 + payload.length, crc32(content));
  return chunk;
}

async function onePixelPng(): Promise<Uint8Array> {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, 1);
  view.setUint32(4, 1);
  header.set([8, 6, 0, 0, 0], 8);
  const scanline = new Uint8Array([0, 255, 0, 0, 255]);
  const compressed = new Uint8Array(await new Response(
    new Blob([scanline]).stream().pipeThrough(new CompressionStream("deflate")),
  ).arrayBuffer());
  return concatenate([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array()),
  ]);
}

Deno.test("accepts only the supported product-media MIME types", () => {
  assertEquals(isProductMediaMimeType("image/jpeg"), true);
  assertEquals(isProductMediaMimeType("image/png"), true);
  assertEquals(isProductMediaMimeType("image/webp"), true);
  assertEquals(isProductMediaMimeType("image/svg+xml"), false);
});

Deno.test("matches declared image MIME types to file signatures", () => {
  assertEquals(hasMatchingImageSignature("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff])), true);
  assertEquals(hasMatchingImageSignature(
    "image/png",
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  ), true);
  assertEquals(hasMatchingImageSignature(
    "image/webp",
    new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
  ), true);
  assertEquals(hasMatchingImageSignature("image/png", new Uint8Array([0xff, 0xd8, 0xff])), false);
});

Deno.test("creates bounded renditions without upscaling or changing aspect ratio", () => {
  assertEquals(renditionDimensions({ width: 2400, height: 1200 }, 1600), {
    width: 1600,
    height: 800,
  });
  assertEquals(renditionDimensions({ width: 200, height: 100 }, 400), {
    width: 200,
    height: 100,
  });
});

Deno.test("rejects invalid or excessive image dimensions", () => {
  assertThrows(() => renditionDimensions({ width: 0, height: 100 }, 400));
  assertThrows(() => renditionDimensions({ width: 8000, height: 8000 }, 1600));
  assertThrows(() => renditionDimensions({ width: 100, height: 100 }, 0));
});

Deno.test("decodes valid image content and emits a WebP rendition", async () => {
  const input = await onePixelPng();
  const result = await makeWebpRendition(input, 400);
  assertEquals(result.width, 1);
  assertEquals(result.height, 1);
  assertEquals(
    hasMatchingImageSignature("image/webp", result.bytes),
    true,
  );
});
