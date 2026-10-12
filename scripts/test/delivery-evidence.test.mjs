import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checksum, validateEvidence, validateEvidenceRecords } from "../lib/delivery-evidence.mjs";

const commit = "a".repeat(40);

function fixture({ taskStatus = "done" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "loopdev-evidence-"));
  const evidenceDirectory = join(root, "docs/implementation/crm/contacts/evidence");
  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(join(root, "docs/implementation/crm/contacts/delivery-ledger.json"), JSON.stringify({
    requirements: [{ id: "CONTACTS-REQ-CREATE" }],
    tasks: [{ id: "CONTACTS-DESKTOP-CREATE", status: taskStatus, evidence_level: "E4_JOURNEY", requirement_ids: ["CONTACTS-REQ-CREATE"] }],
  }));
  const artifact = join(evidenceDirectory, "desktop-create.log");
  writeFileSync(artifact, "Journey passed\n");
  return { root, artifact, evidenceFile: join(evidenceDirectory, "journeys.json") };
}

test("accepts checksummed evidence for the checked-out commit", () => {
  const current = fixture();
  writeFileSync(current.evidenceFile, JSON.stringify([{
    type: "runtime_journey", created_at: "2026-09-14T12:00:00.000Z", commit,
    platform: "desktop_web", requirement_id: "CONTACTS-REQ-CREATE", task_id: "CONTACTS-DESKTOP-CREATE",
    url: "http://localhost:8080/app/sales-crm/contacts", path: "docs/implementation/crm/contacts/evidence/desktop-create.log", checksum: checksum(current.artifact),
  }]));
  assert.deepEqual(validateEvidence(current.root, { head: commit, worktreeClean: true }).errors, []);
});

test("rejects evidence from another commit or a changed artifact", () => {
  const current = fixture();
  writeFileSync(current.evidenceFile, JSON.stringify([{
    type: "runtime_journey", created_at: "2026-09-14T12:00:00.000Z", commit: "b".repeat(40),
    platform: "desktop_web", requirement_id: "CONTACTS-REQ-CREATE", task_id: "CONTACTS-DESKTOP-CREATE",
    url: "http://localhost:8080/app/sales-crm/contacts", path: "docs/implementation/crm/contacts/evidence/desktop-create.log", checksum: `sha256:${"0".repeat(64)}`,
  }]));
  const result = validateEvidence(current.root, { head: commit, worktreeClean: true });
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0], /current HEAD/);
  assert.match(result.errors[1], /checksum/);
});

test("requires journey evidence only after its task is done", () => {
  const current = fixture({ taskStatus: "ready" });
  assert.deepEqual(validateEvidence(current.root, { head: commit, worktreeClean: true }).errors, []);
  const completed = fixture({ taskStatus: "done" });
  const result = validateEvidence(completed.root, { head: commit, worktreeClean: true });
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /requires structured E4_JOURNEY evidence/);
});

test("strict E4 evidence requires a passing journey for every required platform", () => {
  const current = fixture();
  const task = {
    id: "CONTACTS-DESKTOP-CREATE", status: "done", evidence_level: "E4_JOURNEY",
    requirement_ids: ["CONTACTS-REQ-CREATE"], platforms: ["desktop_web", "mobile_web"],
  };
  const record = (platform) => ({
    type: "runtime_journey", created_at: "2026-09-14T12:00:00.000Z", commit,
    platform, requirement_id: "CONTACTS-REQ-CREATE", task_id: task.id,
    journey: "create-contact", result: "passed", environment: "local test server",
    url: "http://localhost:8080/contacts", path: "docs/implementation/crm/contacts/evidence/desktop-create.log",
    checksum: checksum(current.artifact),
  });
  const options = {
    head: commit, requirementIds: new Set(task.requirement_ids), tasks: new Map([[task.id, task]]),
    requiredTaskIds: [task.id], strict: true,
  };
  assert.deepEqual(validateEvidenceRecords(current.root, [record("desktop_web"), record("mobile_web")], options).errors, []);
  const missingMobile = validateEvidenceRecords(current.root, [record("desktop_web")], options);
  assert.ok(missingMobile.errors.some((error) => /runtime_journey.*mobile_web/.test(error)));
  const failed = validateEvidenceRecords(current.root, [{ ...record("desktop_web"), result: "failed" }, record("mobile_web")], options);
  assert.ok(failed.errors.some((error) => /result must be passed/.test(error)));
});

test("strict E5 evidence requires a device screenshot for each required platform", () => {
  const current = fixture();
  const task = {
    id: "CONTACTS-DEVICE-VERIFY", status: "done", evidence_level: "E5_DEVICE",
    requirement_ids: ["CONTACTS-REQ-CREATE"], platforms: ["ios", "android"],
  };
  const runtime = (platform) => ({
    type: "runtime_journey", created_at: "2026-09-14T12:00:00.000Z", commit, platform,
    requirement_id: "CONTACTS-REQ-CREATE", task_id: task.id, journey: "create-contact",
    result: "passed", environment: "device lab", url: "http://10.0.0.2:8080/contacts",
    path: "docs/implementation/crm/contacts/evidence/desktop-create.log", checksum: checksum(current.artifact),
  });
  const screenshot = (platform) => ({
    ...runtime(platform), type: "screenshot", device: { name: `${platform} device`, os_version: "18.0" },
  });
  const options = {
    head: commit, requirementIds: new Set(task.requirement_ids), tasks: new Map([[task.id, task]]),
    requiredTaskIds: [task.id], strict: true,
  };
  assert.deepEqual(validateEvidenceRecords(current.root, [runtime("ios"), runtime("android"), screenshot("ios"), screenshot("android")], options).errors, []);
  const missingDevice = validateEvidenceRecords(current.root, [runtime("ios"), runtime("android"), screenshot("ios")], options);
  assert.ok(missingDevice.errors.some((error) => /device screenshot evidence.*android/.test(error)));
});
