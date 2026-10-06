import fs from "node:fs";
import crypto from "node:crypto";

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
const baseUrl = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const email = env.CRM_SMOKE_EMAIL || "admin@loop.dev";
const password = env.CRM_SMOKE_PASSWORD || "loopdev";

if (!baseUrl || !anonKey) throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.");

const headers = (token) => ({ apikey: anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
async function request(path, options = {}, token) {
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { ...headers(token), ...(options.headers || {}) } });
  const body = await response.text();
  let parsed;
  try { parsed = body ? JSON.parse(body) : null; } catch { parsed = body; }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed (${response.status}): ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
  return parsed;
}

const session = await request("/auth/v1/token?grant_type=password", {
  method: "POST",
  body: JSON.stringify({ email, password }),
}, undefined);
const token = session.access_token;
const memberships = await request(`/rest/v1/organization_memberships?select=organization_id,role,status&user_id=eq.${session.user.id}&status=eq.active`, {}, token);
if (!memberships.length) throw new Error(`Authenticated user ${email} has no active organization membership.`);
const organizationId = memberships[0].organization_id;
const suffix = crypto.randomUUID();
const contact = await request("/rest/v1/crm_contacts", {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({ organization_id: organizationId, first_name: "CRM Smoke", last_name: suffix.slice(0, 8), email: `crm-smoke-${suffix}@example.test` }),
}, token);
const contactId = contact[0].id;
let taskId;
let opportunityId;
let timelineId;
try {
  const task = await request("/rest/v1/crm_tasks", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ organization_id: organizationId, suite: "crm", title: `CRM smoke ${suffix}`, relation_type: "contact", relation_id: contactId, status: "open", priority: "normal", version: 1 }),
  }, token);
  taskId = task[0].id;

  const opportunity = await request("/rest/v1/crm_opportunities", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ organization_id: organizationId, contact_id: contactId, name: `CRM smoke ${suffix}`, stage_key: "qualified", stage: "qualified", currency: "EUR", version: 1 }),
  }, token);
  opportunityId = opportunity[0].id;

  const timeline = await request("/rest/v1/platform_timeline_events", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ organization_id: organizationId, relation_type: "contact", relation_id: contactId, type: "crm.smoke", actor_id: session.user.id, actor_type: "user", origin: "smoke", source_type: "smoke", source_id: suffix, dedupe_key: `crm-smoke:${suffix}`, summary: "Authenticated CRM smoke event", metadata: {}, visibility: "organization" }),
  }, token);
  timelineId = timeline[0].id;

  console.log(JSON.stringify({ ok: true, email, organizationId, contactId, taskId, opportunityId, timelineId }, null, 2));
} finally {
  if (opportunityId) await request(`/rest/v1/crm_opportunities?id=eq.${opportunityId}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ archived_at: new Date().toISOString() }) }, token);
  if (taskId) await request(`/rest/v1/crm_tasks?id=eq.${taskId}`, { method: "DELETE" }, token);
  await request(`/rest/v1/crm_contacts?id=eq.${contactId}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ archived_at: new Date().toISOString() }) }, token);
}
