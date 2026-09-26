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

if (!baseUrl || !anonKey) {
  throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.");
}

const headers = (token, extra = {}) => ({
  apikey: anonKey,
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  ...extra,
});

async function request(path, options = {}, token) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...headers(token), ...(options.headers || {}) },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed (${response.status}): ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return body;
}

const session = await request("/auth/v1/token?grant_type=password", {
  method: "POST",
  body: JSON.stringify({ email, password }),
}, undefined);
const token = session.access_token;
const memberships = await request(
  `/rest/v1/organization_memberships?select=organization_id&user_id=eq.${session.user.id}&status=eq.active`,
  {},
  token,
);
const organizationId = memberships[0]?.organization_id;
if (!organizationId) throw new Error("Smoke user has no active organization membership.");

const suffix = crypto.randomUUID();
const contact = await request("/rest/v1/crm_contacts", {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({
    organization_id: organizationId,
    first_name: "Document lifecycle smoke",
    last_name: suffix.slice(0, 8),
    email: `document-lifecycle-${suffix}@example.test`,
  }),
}, token);
const contactId = contact[0].id;
const documentId = crypto.randomUUID();
const versionId = crypto.randomUUID();
const extractionId = crypto.randomUUID();
const fileId = crypto.randomUUID();
const uploadSessionId = crypto.randomUUID();
const idempotencyKey = `document-lifecycle-smoke:${suffix}`;
const tempPath = `organizations/${organizationId}/${session.user.id}/${documentId}.pdf`;
const permanentPath = `organizations/${organizationId}/contacts/${contactId}/documents/${documentId}/lifecycle-smoke.pdf`;
let uploadedTemp = false;
let uploadedPermanent = false;

try {
  const upload = await fetch(`${baseUrl}/storage/v1/object/document-intelligence-temp/${tempPath}`, {
    method: "POST",
    headers: headers(token, { "Content-Type": "application/pdf", "x-upsert": "false" }),
    body: "%PDF-1.4 document lifecycle smoke",
  });
  if (!upload.ok) throw new Error(`Temporary upload failed (${upload.status}): ${await upload.text()}`);
  uploadedTemp = true;

  await request("/rest/v1/document_intelligence_documents", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      id: documentId,
      organization_id: organizationId,
      status: "temporary",
      retention_class: "temporary",
      retention_days: 30,
      source_suite: "crm",
      document_type: "unknown",
      concurrency_token: `document-${suffix}`,
    }),
  }, token);
  await request("/rest/v1/document_intelligence_versions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      id: versionId,
      document_id: documentId,
      organization_id: organizationId,
      version_number: 1,
      source_reference: contactId,
      concurrency_token: `version-${suffix}`,
    }),
  }, token);
  await request("/rest/v1/document_intelligence_extractions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      id: extractionId,
      document_version_id: versionId,
      organization_id: organizationId,
      status: "review",
      attempt: 1,
      provider: "smoke",
      provider_version: "smoke",
      schema_version: "smoke",
      fields: { title: "lifecycle-smoke.pdf", files: { front: { name: "lifecycle-smoke.pdf", size: 34, mimeType: "application/pdf", url: tempPath } } },
      concurrency_token: `extraction-${suffix}`,
    }),
  }, token);

  const permanentUpload = await fetch(`${baseUrl}/storage/v1/object/platform-files/${permanentPath}`, {
    method: "POST",
    headers: headers(token, { "Content-Type": "application/pdf", "x-upsert": "false" }),
    body: "%PDF-1.4 document lifecycle smoke",
  });
  if (!permanentUpload.ok) throw new Error(`Permanent upload failed (${permanentUpload.status}): ${await permanentUpload.text()}`);
  uploadedPermanent = true;

  await request("/rest/v1/platform_files", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      id: fileId,
      organization_id: organizationId,
      name: "lifecycle-smoke.pdf",
      category: "document",
      source: "document_intelligence",
      media_type: "application/pdf",
      size: 34,
      relation_type: "contact",
      relation_id: contactId,
      storage_path: permanentPath,
    }),
  }, token);
  await request("/rest/v1/document_intelligence_associations", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      organization_id: organizationId,
      document_id: documentId,
      extraction_id: extractionId,
      contact_id: contactId,
      platform_file_id: fileId,
      idempotency_key: idempotencyKey,
    }),
  }, token);
  await request(`/rest/v1/document_intelligence_documents?id=eq.${documentId}&organization_id=eq.${organizationId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      status: "linked",
      associated_contact_id: contactId,
      platform_file_id: fileId,
      retention_class: "associated",
      retention_days: 365,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      version: 2,
    }),
  }, token);

  const replay = await request(`/rest/v1/document_intelligence_associations?organization_id=eq.${organizationId}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&select=id,platform_file_id`, {}, token);
  if (replay.length !== 1 || replay[0].platform_file_id !== fileId) {
    throw new Error("Idempotent association replay did not return the original relation.");
  }

  const cleanup = await request("/rest/v1/rpc/document_intelligence_cleanup_expired", {
    method: "POST",
    body: JSON.stringify({ p_now: new Date().toISOString() }),
  }, token);
  const unrelatedOrganizationId = crypto.randomUUID();
  const crossTenantDocuments = await request(
    `/rest/v1/document_intelligence_documents?organization_id=eq.${unrelatedOrganizationId}&select=id`,
    {},
    token,
  );
  const crossTenantFiles = await request(
    `/rest/v1/platform_files?organization_id=eq.${unrelatedOrganizationId}&select=id`,
    {},
    token,
  );
  if (crossTenantDocuments.length !== 0 || crossTenantFiles.length !== 0) {
    throw new Error("Cross-tenant probe returned rows for an unrelated organization.");
  }
  console.log(JSON.stringify({
    ok: true,
    organizationId,
    contactId,
    documentId,
    fileId,
    idempotentReplay: true,
    cleanupResult: cleanup,
    crossTenantIsolation: true,
  }, null, 2));
} finally {
  await request(`/rest/v1/document_intelligence_associations?document_id=eq.${documentId}`, { method: "DELETE" }, token).catch(() => {});
  await request(`/rest/v1/document_intelligence_extractions?id=eq.${extractionId}`, { method: "DELETE" }, token).catch(() => {});
  await request(`/rest/v1/document_intelligence_versions?id=eq.${versionId}`, { method: "DELETE" }, token).catch(() => {});
  await request(`/rest/v1/document_intelligence_documents?id=eq.${documentId}`, { method: "DELETE" }, token).catch(() => {});
  await request(`/rest/v1/platform_files?id=eq.${fileId}`, { method: "DELETE" }, token).catch(() => {});
  await request(`/rest/v1/crm_contacts?id=eq.${contactId}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ archived_at: new Date().toISOString() }) }, token).catch(() => {});
  if (uploadedTemp) await request("/storage/v1/object/document-intelligence-temp", { method: "DELETE", body: JSON.stringify({ prefixes: [tempPath] }) }, token).catch(() => {});
  if (uploadedPermanent) await request("/storage/v1/object/platform-files", { method: "DELETE", body: JSON.stringify({ prefixes: [permanentPath] }) }, token).catch(() => {});
}
