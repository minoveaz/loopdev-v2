/// <reference lib="deno.ns" />

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.116.0";
import { imageMagickReady, makeWebpRendition, type RenditionResult } from "./image-processing.ts";
import {
  hasMatchingImageSignature,
  isProductMediaMimeType,
  MAX_PRODUCT_MEDIA_BYTES,
  type ProductMediaMimeType,
} from "./validation.ts";

const BUCKET = "platform-files";
const PREVIEW_TTL_SECONDS = 300;
const RETRY_AFTER_MS = 1500;
await imageMagickReady;

interface UploadSession {
  id: string;
  organization_id: string;
  file_id: string | null;
  file_name: string;
  mime_type: ProductMediaMimeType;
  byte_size: number;
  storage_path: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  created_by: string;
  resource_entity_type: string;
  resource_entity_id: string;
  idempotency_key: string;
}

interface FileMetadata {
  id: string;
  organization_id: string;
  name: string;
  media_type: string;
  size: number;
  status: string;
  storage_path: string | null;
}

class PlatformFilesError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly retryable = false,
  ) {
    super(message);
  }
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin");
  const configuredOrigins = (Deno.env.get("PLATFORM_FILES_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed = Boolean(origin) && (
    configuredOrigins.includes(origin!)
    || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin!)
  );
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (allowed && origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function jsonResponse(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
}

function fail(request: Request, error: PlatformFilesError): Response {
  return jsonResponse(request, {
    error: { code: error.code, message: error.message, retryable: error.retryable },
  }, error.status);
}

function requireString(value: unknown, name: string, maxLength = 128): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new PlatformFilesError("FILE_VALIDATION_ERROR", `${name} is invalid.`, 400);
  }
  return value.trim();
}

function requireUuid(value: unknown, name: string): string {
  const id = requireString(value, name, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new PlatformFilesError("FILE_VALIDATION_ERROR", `${name} is invalid.`, 400);
  }
  return id;
}

function objectValue(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new PlatformFilesError("FILE_VALIDATION_ERROR", "A JSON request body is required.", 400);
  }
  return value as Record<string, unknown>;
}

function createClients(request: Request): { user: SupabaseClient; service: SupabaseClient } {
  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new PlatformFilesError("FILE_FORBIDDEN", "An authenticated session is required.", 401);
  }
  const auth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
  return {
    user: createClient(supabaseUrl, anonKey, {
      auth,
      global: { headers: { Authorization: authorization } },
    }),
    service: createClient(supabaseUrl, serviceRoleKey, { auth }),
  };
}

async function authenticate(user: SupabaseClient): Promise<string> {
  const { data, error } = await user.auth.getUser();
  if (error || !data.user) {
    throw new PlatformFilesError("FILE_FORBIDDEN", "The authenticated session is invalid or expired.", 401);
  }
  return data.user.id;
}

async function assertPermission(
  user: SupabaseClient,
  organizationId: string,
  permission: "catalog.read" | "catalog.write",
): Promise<void> {
  const { data, error } = await user.rpc("has_organization_permission", {
    target_organization_id: organizationId,
    required_permission: permission,
  });
  if (error) throw new PlatformFilesError("FILE_UPLOAD_FAILED", error.message, 503, true);
  if (data !== true) throw new PlatformFilesError("FILE_FORBIDDEN", "You do not have access to this organization.", 403);
}

async function assertWritesEnabled(user: SupabaseClient, organizationId: string): Promise<void> {
  const { data, error } = await user.rpc("erp_product_writes_enabled", {
    target_organization_id: organizationId,
  });
  if (error) throw new PlatformFilesError("FILE_UPLOAD_FAILED", error.message, 503, true);
  if (data !== true) {
    throw new PlatformFilesError("FILE_FORBIDDEN", "Product writes are disabled for safety.", 403);
  }
}

async function assertProduct(
  user: SupabaseClient,
  organizationId: string,
  productId: string,
): Promise<void> {
  const { data, error } = await user
    .from("erp_catalog_items")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new PlatformFilesError("FILE_UPLOAD_FAILED", error.message, 503, true);
  if (!data) throw new PlatformFilesError("FILE_FORBIDDEN", "Product not found in this organization.", 403);
}

async function hashBytes(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getSession(
  service: SupabaseClient,
  uploadId: string,
  actorId: string,
  organizationId: string,
): Promise<UploadSession> {
  const { data, error } = await service
    .from("platform_file_upload_sessions")
    .select("id,organization_id,file_id,file_name,mime_type,byte_size,storage_path,status,created_by,resource_entity_type,resource_entity_id,idempotency_key")
    .eq("id", uploadId)
    .eq("organization_id", organizationId)
    .eq("purpose", "product_media")
    .eq("created_by", actorId)
    .maybeSingle();
  if (error) throw new PlatformFilesError("FILE_UPLOAD_FAILED", error.message, 503, true);
  if (!data) throw new PlatformFilesError("FILE_NOT_FOUND", "Upload session not found.", 404);
  return data as UploadSession;
}

async function readyFile(
  service: SupabaseClient,
  organizationId: string,
  fileId: string,
): Promise<FileMetadata> {
  const { data, error } = await service
    .from("platform_files")
    .select("id,organization_id,name,media_type,size,status,storage_path")
    .eq("organization_id", organizationId)
    .eq("id", fileId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new PlatformFilesError("FILE_UPLOAD_FAILED", error.message, 503, true);
  if (!data) throw new PlatformFilesError("FILE_PROCESSING_FAILED", "The finalized file is unavailable.", 503, true);
  return data as FileMetadata;
}

function toFileReference(file: FileMetadata) {
  return {
    id: file.id,
    organizationId: file.organization_id,
    fileName: file.name,
    mimeType: file.media_type,
    byteSize: Number(file.size),
    status: "ready",
  };
}

async function listLibrary(
  user: SupabaseClient,
  service: SupabaseClient,
  body: Record<string, unknown>,
): Promise<unknown> {
  const organizationId = requireUuid(body.organizationId, "organizationId");
  if (body.purpose !== "product_media") {
    throw new PlatformFilesError("FILE_OPERATION_UNSUPPORTED", "This Files library is not supported.", 400);
  }
  let fileIds: string[] | undefined;
  if (body.fileIds !== undefined) {
    if (!Array.isArray(body.fileIds) || body.fileIds.length > 1000) {
      throw new PlatformFilesError("FILE_VALIDATION_ERROR", "The requested file list is invalid.", 400);
    }
    fileIds = body.fileIds.map((id) => requireUuid(id, "fileId"));
    if (fileIds.length === 0) return [];
  }

  await assertPermission(user, organizationId, "catalog.read");
  const references: ReturnType<typeof toFileReference>[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    let query = service
      .from("platform_files")
      .select("id,organization_id,name,media_type,size,status,storage_path")
      .eq("organization_id", organizationId)
      .eq("relation_type", "product_media_library")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (fileIds) query = query.in("id", fileIds);
    const { data, error } = await query;
    if (error) throw new PlatformFilesError("FILE_UPLOAD_FAILED", error.message, 503, true);
    const page = (data ?? []) as FileMetadata[];
    references.push(...page.map(toFileReference));
    if (page.length < pageSize) break;
  }
  return references;
}

async function finishUpload(
  service: SupabaseClient,
  session: UploadSession,
  actorId: string,
): Promise<FileMetadata> {
  const { data: original, error: downloadError } = await service.storage
    .from(BUCKET)
    .download(session.storage_path);
  if (downloadError || !original) {
    const details = downloadError as { statusCode?: string } | null;
    if (details?.statusCode === "404" || /not found|no such key/i.test(downloadError?.message ?? "")) {
      throw new PlatformFilesError("FILE_PROCESSING_FAILED", "The upload has not arrived yet.", 409, true);
    }
    throw new PlatformFilesError(
      "FILE_PROCESSING_FAILED",
      downloadError?.message ?? "The uploaded file could not be read.",
      503,
      true,
    );
  }

  const bytes = new Uint8Array(await original.arrayBuffer());
  if (bytes.byteLength !== session.byte_size || bytes.byteLength > MAX_PRODUCT_MEDIA_BYTES) {
    throw new PlatformFilesError("FILE_VALIDATION_ERROR", "The uploaded file size does not match its session.", 400);
  }
  if (!isProductMediaMimeType(session.mime_type) || !hasMatchingImageSignature(session.mime_type, bytes)) {
    throw new PlatformFilesError("FILE_VALIDATION_ERROR", "The file contents do not match a supported image type.", 415);
  }
  const checksum = await hashBytes(bytes);
  if (checksum !== session.idempotency_key) {
    throw new PlatformFilesError("FILE_VALIDATION_ERROR", "The uploaded file checksum does not match its upload session.", 400);
  }

  let large: RenditionResult;
  let thumbnail: RenditionResult;
  try {
    large = await makeWebpRendition(bytes, 1600);
    thumbnail = await makeWebpRendition(bytes, 400);
  } catch (error) {
    if (error instanceof PlatformFilesError) throw error;
    throw new PlatformFilesError("FILE_VALIDATION_ERROR", "The uploaded image could not be decoded.", 415);
  }

  const largePath = `organizations/${session.organization_id}/product-media/${session.id}/renditions/large.webp`;
  const thumbnailPath = `organizations/${session.organization_id}/product-media/${session.id}/renditions/thumbnail.webp`;
  for (const [path, rendition] of [[largePath, large], [thumbnailPath, thumbnail]] as const) {
    const { error } = await service.storage.from(BUCKET).upload(path, rendition.bytes, {
      contentType: "image/webp",
      upsert: true,
    });
    if (error) {
      throw new PlatformFilesError("FILE_PROCESSING_FAILED", error.message, 503, true);
    }
  }

  const { error: finalizeError } = await service.rpc("finalize_platform_product_media_upload", {
    target_upload_id: session.id,
    target_actor_id: actorId,
    target_checksum: checksum,
    target_large_size: large.bytes.byteLength,
    target_large_width: large.width,
    target_large_height: large.height,
    target_thumbnail_size: thumbnail.bytes.byteLength,
    target_thumbnail_width: thumbnail.width,
    target_thumbnail_height: thumbnail.height,
  });
  if (finalizeError) {
    throw new PlatformFilesError("FILE_PROCESSING_FAILED", finalizeError.message, 503, true);
  }
  return readyFile(service, session.organization_id, session.id);
}

async function beginUpload(
  user: SupabaseClient,
  service: SupabaseClient,
  actorId: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const organizationId = requireUuid(body.organizationId, "organizationId");
  const productId = requireUuid(body.productId, "productId");
  const fileName = requireString(body.fileName, "fileName", 255);
  const mimeType = body.mimeType;
  const byteSize = body.byteSize;
  const checksum = requireString(body.checksum, "checksum", 64);
  if (
    !isProductMediaMimeType(mimeType)
    || typeof byteSize !== "number"
    || !Number.isInteger(byteSize)
    || byteSize < 1
    || byteSize > MAX_PRODUCT_MEDIA_BYTES
    || !/^[0-9a-f]{64}$/.test(checksum)
  ) {
    throw new PlatformFilesError("FILE_VALIDATION_ERROR", "The image metadata is invalid.", 400);
  }

  await assertPermission(user, organizationId, "catalog.write");
  await assertWritesEnabled(user, organizationId);
  await assertProduct(user, organizationId, productId);

  const { data, error } = await service.rpc("begin_platform_product_media_upload", {
    target_organization_id: organizationId,
    target_actor_id: actorId,
    target_product_id: productId,
    target_file_name: fileName,
    target_mime_type: mimeType,
    target_byte_size: byteSize,
    target_checksum: checksum,
  });
  if (error) {
    const conflict = error.code === "23505";
    throw new PlatformFilesError(
      conflict ? "FILE_CONFLICT" : "FILE_UPLOAD_FAILED",
      error.message,
      conflict ? 409 : error.code === "42501" ? 403 : 503,
      !conflict && error.code !== "42501",
    );
  }

  const session = data as {
    uploadId: string;
    status: UploadSession["status"];
    fileId: string | null;
    storagePath: string;
    fileName: string;
    mimeType: ProductMediaMimeType;
    byteSize: number;
    resourceEntityType: string;
    resourceEntityId: string;
  };
  if (session.resourceEntityType !== "catalog_item" || session.resourceEntityId !== productId) {
    throw new PlatformFilesError("FILE_CONFLICT", "The upload key is already used for a different product.", 409);
  }
  if (session.status === "completed" && session.fileId) {
    await assertPermission(user, organizationId, "catalog.read");
    return { state: "ready", file: toFileReference(await readyFile(service, organizationId, session.fileId)) };
  }
  if (session.status !== "pending") {
    throw new PlatformFilesError("FILE_PROCESSING_FAILED", "This upload session cannot be resumed.", 409);
  }

  const existing = await getSession(service, session.uploadId, actorId, organizationId);
  try {
    const file = await finishUpload(service, existing, actorId);
    return { state: "ready", file: toFileReference(file) };
  } catch (error) {
    if (!(error instanceof PlatformFilesError) || error.code !== "FILE_PROCESSING_FAILED" || !error.retryable) {
      if (error instanceof PlatformFilesError && error.code === "FILE_VALIDATION_ERROR") {
        await service
          .from("platform_file_upload_sessions")
          .update({ status: "failed" })
          .eq("id", existing.id)
          .eq("status", "pending");
      }
      throw error;
    }
  }

  const { data: signed, error: signedError } = await service.storage
    .from(BUCKET)
    .createSignedUploadUrl(existing.storage_path, { upsert: false });
  if (signedError) throw new PlatformFilesError("FILE_UPLOAD_FAILED", signedError.message, 503, true);
  return {
    state: "upload",
    uploadId: existing.id,
    path: signed.path,
    token: signed.token,
  };
}

async function uploadStatus(
  user: SupabaseClient,
  service: SupabaseClient,
  actorId: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const organizationId = requireUuid(body.organizationId, "organizationId");
  const uploadId = requireUuid(body.uploadId, "uploadId");
  const session = await getSession(service, uploadId, actorId, organizationId);
  if (session.status === "completed" && session.file_id) {
    await assertPermission(user, organizationId, "catalog.read");
    return { status: "ready", file: toFileReference(await readyFile(service, organizationId, session.file_id)) };
  }
  if (session.status !== "pending") {
    throw new PlatformFilesError("FILE_PROCESSING_FAILED", "This upload session cannot be resumed.", 409);
  }

  await assertPermission(user, organizationId, "catalog.write");
  await assertWritesEnabled(user, organizationId);
  await assertProduct(user, organizationId, session.resource_entity_id);
  try {
    const file = await finishUpload(service, session, actorId);
    return { status: "ready", file: toFileReference(file) };
  } catch (error) {
    if (error instanceof PlatformFilesError && error.code === "FILE_PROCESSING_FAILED" && error.retryable) {
      return { status: "processing", uploadId, retryAfterMs: RETRY_AFTER_MS };
    }
    if (error instanceof PlatformFilesError && error.code === "FILE_VALIDATION_ERROR") {
      await service
        .from("platform_file_upload_sessions")
        .update({ status: "failed" })
        .eq("id", session.id)
        .eq("status", "pending");
    }
    throw error;
  }
}

async function preview(
  user: SupabaseClient,
  service: SupabaseClient,
  body: Record<string, unknown>,
): Promise<unknown> {
  const organizationId = requireUuid(body.organizationId, "organizationId");
  const productId = requireUuid(body.productId, "productId");
  const fileId = requireUuid(body.fileId, "fileId");
  const rendition = body.rendition;
  if (rendition !== "original" && rendition !== "large" && rendition !== "thumbnail") {
    throw new PlatformFilesError("FILE_VALIDATION_ERROR", "The requested rendition is invalid.", 400);
  }

  await assertPermission(user, organizationId, "catalog.read");
  await assertProduct(user, organizationId, productId);
  const { data: file, error: fileError } = await service
    .from("platform_files")
    .select("id,organization_id,name,media_type,size,status,storage_path,relation_type")
    .eq("organization_id", organizationId)
    .eq("id", fileId)
    .eq("relation_type", "product_media_library")
    .eq("status", "active")
    .maybeSingle();
  if (fileError) throw new PlatformFilesError("FILE_PREVIEW_FAILED", fileError.message, 503, true);
  if (!file?.storage_path) throw new PlatformFilesError("FILE_NOT_FOUND", "Product media file not found.", 404);

  let path = file.storage_path as string;
  let mimeType = file.media_type as string;
  if (rendition !== "original") {
    const { data: derivative, error: renditionError } = await service
      .from("platform_file_renditions")
      .select("storage_path,media_type")
      .eq("organization_id", organizationId)
      .eq("file_id", fileId)
      .eq("rendition", rendition)
      .maybeSingle();
    if (renditionError) throw new PlatformFilesError("FILE_PREVIEW_FAILED", renditionError.message, 503, true);
    if (!derivative) throw new PlatformFilesError("FILE_NOT_FOUND", "Product media rendition not found.", 404);
    path = derivative.storage_path;
    mimeType = derivative.media_type;
  }

  const { data, error } = await service.storage.from(BUCKET).createSignedUrl(path, PREVIEW_TTL_SECONDS);
  if (error) throw new PlatformFilesError("FILE_PREVIEW_FAILED", error.message, 503, true);
  return {
    url: data.signedUrl,
    mimeType,
    expiresAt: new Date(Date.now() + PREVIEW_TTL_SECONDS * 1000).toISOString(),
    rendition,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(request) });
  if (request.method !== "POST") {
    return fail(request, new PlatformFilesError("FILE_OPERATION_UNSUPPORTED", "Only POST is supported.", 405));
  }

  try {
    const { user, service } = createClients(request);
    const actorId = await authenticate(user);
    const body = objectValue(await request.json());
    const action = requireString(body.action, "action", 16);
    let result: unknown;
    if (action === "begin") result = await beginUpload(user, service, actorId, body);
    else if (action === "status") result = await uploadStatus(user, service, actorId, body);
    else if (action === "preview") result = await preview(user, service, body);
    else if (action === "list") result = await listLibrary(user, service, body);
    else throw new PlatformFilesError("FILE_OPERATION_UNSUPPORTED", "This Files operation is not supported.", 400);
    return jsonResponse(request, { data: result });
  } catch (error) {
    if (error instanceof PlatformFilesError) return fail(request, error);
    console.error("Platform Files request failed", error);
    return fail(
      request,
      new PlatformFilesError("FILE_UPLOAD_FAILED", "The Files operation failed unexpectedly.", 500, true),
    );
  }
});
