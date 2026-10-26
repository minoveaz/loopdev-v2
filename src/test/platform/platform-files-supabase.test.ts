import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabasePlatformFilesPort } from "@/loopdev/domains/files/adapter/platform-files-supabase";

function asClient(value: object): SupabaseClient {
  return value as SupabaseClient;
}

describe("Supabase Platform Files port", () => {
  it("requires an authenticated client and rejects unsupported purposes", async () => {
    const missingClient = createSupabasePlatformFilesPort(null);
    const missing = await missingClient.upload({
      scope: { organizationId: "org" },
      resource: { entityType: "catalog_item", entityId: "product" },
      purpose: "product_media",
      fileName: "image.png",
      mimeType: "image/png",
      content: new Blob(["image"]),
      idempotencyKey: "unused",
    });
    expect(missing).toMatchObject({ success: false, error: { code: "FILE_FORBIDDEN" } });

    const unsupported = await missingClient.upload({
      scope: { organizationId: "org" },
      resource: { entityType: "catalog_item", entityId: "product" },
      purpose: "general",
      fileName: "document.pdf",
      mimeType: "application/pdf",
      content: new Blob(["document"]),
      idempotencyKey: "unused",
    });
    expect(unsupported).toMatchObject({
      success: false,
      error: { code: "FILE_OPERATION_UNSUPPORTED" },
    });
  });

  it("returns a server-finalized File reference without uploading bytes again", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        data: {
          state: "ready",
          file: {
            id: "file-id",
            organizationId: "org-id",
            fileName: "cat.png",
            mimeType: "image/png",
            byteSize: 4,
            status: "ready",
          },
        },
      },
      error: null,
    });
    const uploadToSignedUrl = vi.fn();
    const port = createSupabasePlatformFilesPort(asClient({
      functions: { invoke },
      storage: { from: () => ({ uploadToSignedUrl }) },
    }));
    const content = new Blob(["test"]);
    const digest = await crypto.subtle.digest("SHA-256", await content.arrayBuffer());
    const idempotencyKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");

    const result = await port.upload({
      scope: { organizationId: "org-id" },
      resource: { entityType: "catalog_item", entityId: "product-id" },
      purpose: "product_media",
      fileName: "cat.png",
      mimeType: "image/png",
      content,
      idempotencyKey,
    });

    expect(result).toMatchObject({ success: true, data: { status: "ready", file: { id: "file-id" } } });
    expect(invoke).toHaveBeenCalledWith("platform-files", expect.objectContaining({
      body: expect.objectContaining({ action: "begin", checksum: idempotencyKey }),
    }));
    expect(uploadToSignedUrl).not.toHaveBeenCalled();
  });

  it("lists only shared library metadata through the Files function", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        data: [{
          id: "file-id",
          organizationId: "org-id",
          fileName: "cat.png",
          mimeType: "image/png",
          byteSize: 4,
          status: "ready",
        }],
      },
      error: null,
    });
    const port = createSupabasePlatformFilesPort(asClient({ functions: { invoke } }));
    const result = await port.listLibrary({
      scope: { organizationId: "org-id" },
      purpose: "product_media",
    });

    expect(result).toMatchObject({ success: true, data: [{ id: "file-id", fileName: "cat.png" }] });
    expect(invoke).toHaveBeenCalledWith("platform-files", {
      body: { action: "list", organizationId: "org-id", purpose: "product_media", fileIds: undefined },
    });
  });

  it("uploads through the issued signed location and confirms server finalization", async () => {
    const reference = {
      id: "file-id",
      organizationId: "org-id",
      fileName: "cat.png",
      mimeType: "image/png",
      byteSize: 4,
      status: "ready",
    };
    const invoke = vi.fn()
      .mockResolvedValueOnce({
        data: { data: { state: "upload", uploadId: "upload-id", path: "path", token: "token" } },
        error: null,
      })
      .mockResolvedValueOnce({ data: { data: { status: "ready", file: reference } }, error: null });
    const uploadToSignedUrl = vi.fn().mockResolvedValue({ error: null });
    const port = createSupabasePlatformFilesPort(asClient({
      functions: { invoke },
      storage: { from: () => ({ uploadToSignedUrl }) },
    }));
    const content = new Blob(["test"]);
    const digest = await crypto.subtle.digest("SHA-256", await content.arrayBuffer());
    const idempotencyKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");

    const result = await port.upload({
      scope: { organizationId: "org-id" },
      resource: { entityType: "catalog_item", entityId: "product-id" },
      purpose: "product_media",
      fileName: "cat.png",
      mimeType: "image/png",
      content,
      idempotencyKey,
    });

    expect(result).toMatchObject({ success: true, data: { status: "ready", file: { id: "file-id" } } });
    expect(uploadToSignedUrl).toHaveBeenCalledWith("path", "token", content, {
      contentType: "image/png",
      upsert: false,
    });
  });

  it("rejects workspace-scoped previews instead of ignoring scope", async () => {
    const port = createSupabasePlatformFilesPort(asClient({ functions: { invoke: vi.fn() } }));
    const result = await port.getPreviewSource({
      fileId: "file-id",
      scope: { organizationId: "org-id", workspaceId: "workspace-id" },
      resource: { entityType: "catalog_item", entityId: "product-id" },
      rendition: "large",
    });

    expect(result).toMatchObject({
      success: false,
      error: { code: "FILE_OPERATION_UNSUPPORTED" },
    });
  });
});
