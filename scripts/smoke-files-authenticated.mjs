import crypto from "node:crypto";
import fs from "node:fs";

function loadEnv() {
  const values = {};
  if (!fs.existsSync(".env")) return values;
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*['"]?(.*?)['"]?\s*$/);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

const env = { ...loadEnv(), ...process.env };
const baseUrl = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const email = env.CRM_SMOKE_EMAIL || "admin@loop.dev";
const password = env.CRM_SMOKE_PASSWORD || "loopdev";
if (!baseUrl || !anonKey) throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.");

const headers = (token, extra = {}) => ({ apikey: anonKey, Authorization: `Bearer ${token}`, ...extra });
async function request(path, options = {}, token) {
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { ...headers(token, { "Content-Type": "application/json" }), ...(options.headers || {}) } });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed (${response.status}): ${typeof body === "string" ? body : JSON.stringify(body)}`);
  return body;
}

const session = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
const token = session.access_token;
const memberships = await request(`/rest/v1/organization_memberships?select=organization_id&user_id=eq.${session.user.id}&status=eq.active`, {}, token);
const organizationId = memberships[0]?.organization_id;
if (!organizationId) throw new Error("Smoke user has no active organization membership.");

const fileId = crypto.randomUUID();
const uploadSessionId = crypto.randomUUID();
const storagePath = `organizations/${organizationId}/${fileId}/files-smoke.txt`;
let uploaded = false;
try {
  const upload = await fetch(`${baseUrl}/storage/v1/object/platform-files/${storagePath}`, {
    method: "POST",
    headers: headers(token, { "Content-Type": "text/plain", "x-upsert": "false" }),
    body: "LoopDev Files smoke",
  });
  if (!upload.ok) throw new Error(`Storage upload failed (${upload.status}): ${await upload.text()}`);
  uploaded = true;
  await request("/rest/v1/platform_file_upload_sessions", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id: uploadSessionId, organization_id: organizationId, file_name: "files-smoke.txt", mime_type: "text/plain", byte_size: 19, storage_path: storagePath, status: "completed", completed_at: new Date().toISOString() }) }, token);
  await request("/rest/v1/platform_files", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id: fileId, organization_id: organizationId, name: "files-smoke.txt", category: "other", source: "upload", media_type: "text/plain", size: 19, relation_type: "contact", relation_id: "files-smoke", relation_label: "Files smoke", storage_path: storagePath, current_version: 1 }) }, token);
  await request("/rest/v1/platform_file_versions", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ file_id: fileId, organization_id: organizationId, version: 1, file_name: "files-smoke.txt", mime_type: "text/plain", byte_size: 19, storage_path: storagePath }) }, token);
  const signed = await request("/storage/v1/object/sign/platform-files", { method: "POST", body: JSON.stringify({ expiresIn: 300, paths: [storagePath] }) }, token);
  if (!signed?.[0]?.signedURL && !signed?.signedURL && !signed?.signedUrl) throw new Error("Storage did not return a signed preview URL.");
  console.log(JSON.stringify({ ok: true, organizationId, fileId, uploadSessionId, signedPreview: true }, null, 2));
} finally {
  await request(`/rest/v1/platform_file_versions?file_id=eq.${fileId}`, { method: "DELETE" }, token).catch(() => {});
  await request(`/rest/v1/platform_files?id=eq.${fileId}`, { method: "DELETE" }, token).catch(() => {});
  await request(`/rest/v1/platform_file_upload_sessions?id=eq.${uploadSessionId}`, { method: "DELETE" }, token).catch(() => {});
  if (uploaded) await request("/storage/v1/object/platform-files", { method: "DELETE", body: JSON.stringify({ prefixes: [storagePath] }) }, token).catch(() => {});
}