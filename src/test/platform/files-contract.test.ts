import { describe, expect, it } from "vitest";
import {
  PLATFORM_FILE_PREVIEW_TTL_SECONDS,
  PRODUCT_MEDIA_ALLOWED_TYPES,
  PRODUCT_MEDIA_MAX_UPLOAD_BYTES,
  PRODUCT_MEDIA_RENDITIONS,
  platformFilesContract,
} from "../../../packages/contracts/src/platform-files";
import { PROFILE_AVATAR_PREVIEW_TTL_SECONDS } from "../../../packages/contracts/src/private-user-files";

describe("Platform Files contract", () => {
  it("limits signed previews to five minutes", () => {
    expect(PLATFORM_FILE_PREVIEW_TTL_SECONDS).toBe(300);
    expect(platformFilesContract.previewTtlSeconds).toBe(300);
    expect(PROFILE_AVATAR_PREVIEW_TTL_SECONDS).toBe(PLATFORM_FILE_PREVIEW_TTL_SECONDS);
  });

  it("defines server-validated product image inputs and bounded renditions", () => {
    expect(PRODUCT_MEDIA_ALLOWED_TYPES).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(PRODUCT_MEDIA_MAX_UPLOAD_BYTES).toBe(25 * 1024 * 1024);
    expect(PRODUCT_MEDIA_RENDITIONS).toEqual([
      { id: "large", maxEdgePixels: 1600 },
      { id: "thumbnail", maxEdgePixels: 400 },
    ]);
    expect(platformFilesContract.productMedia).toMatchObject({
      validateContentSignature: true,
      decodeBeforeAccepting: true,
      retainOriginal: true,
      preserveAspectRatio: true,
      upscale: false,
      renditionEncoding: "platform-policy",
      assignmentOwner: "consumer",
      retentionOwner: "platform-files",
      orphanRecoveryOwner: "platform-files",
      detachDeletesFile: false,
    });
  });
});
