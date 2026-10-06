import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checksum, validateEvidence } from "../lib/delivery-evidence.mjs";

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