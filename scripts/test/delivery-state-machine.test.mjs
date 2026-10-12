import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DeliveryStateMachine } from "../lib/delivery-state-machine.mjs";
import { validateLedger } from "../lib/delivery-ledger.mjs";
import { checksum } from "../lib/delivery-evidence.mjs";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const fixedClock = () => new Date("2026-09-14T12:00:00.000Z");
const validFingerprint = `sha256:${"a".repeat(64)}`;

function validLedger(overrides = {}) {
  return {
    schema_version: 1,
    suite: "crm",
    module: "contacts",
    status: "draft",
    approved_by: null,
    approved_at: null,
    approval_source: null,
    product_sources: ["docs/06-product/crm/contacts/README.md"],
    previous_ledger: null,
    requirements: [{
      id: "CONTACTS-REQ-LIST", title: "List contacts", classification: "REQUIRED_MVP",
      source: "docs/06-product/crm/contacts/README.md", platforms: ["desktop_web", "mobile_web"],
      acceptance_criteria: ["Authorized contacts are listed"], evidence_level: "E4_JOURNEY",
      capability_ids: ["CONTACTS-CAP-LIST"],
    }],
    capabilities: [{
      id: "CONTACTS-CAP-LIST", name: "Contact list", classification: "REQUIRED_MVP",
      requirement_ids: ["CONTACTS-REQ-LIST"],
      semantics: { operations: ["listContacts"], validation_contract: null, errors: ["FORBIDDEN"] },
      platforms: {
        desktop_web: { required: true, surface: "table", route: "/contacts" },
        mobile_web: { required: true, surface: "list", route: "/contacts" },
        ios: { required: false, surface: "planned list", route: "/contacts" },
        android: { required: false, surface: "planned list", route: "/contacts" },
      },
      parity: { domain: "verified", renderer: "partial", operations: "partial" },
      operation_coverage: [{ id: "listContacts", desktop_web: "implemented", mobile_web: "implemented", ios: "not_applicable", android: "not_applicable", adaptation_ref: null }],
      states: ["loading", "success"], permissions: ["crm.contacts.read"],
      contract_refs: ["packages/contracts/src/contact.ts"], task_ids: ["CONTACTS-TASK-LIST"],
    }],
    tasks: [{
      id: "CONTACTS-TASK-LIST", phase: "07-build", type: "test", status: "pending",
      title: "Verify contact list", requirement_ids: ["CONTACTS-REQ-LIST"],
      capability_ids: ["CONTACTS-CAP-LIST"], platforms: ["shared", "desktop_web", "mobile_web"],
      dependencies: [], owner: "CRM", risk: "medium", evidence_level: "E4_JOURNEY",
      acceptance_criteria: ["Both renderers pass the shared journey"],
      validation: [{ command: "npm test", required: true }], files: ["src/contact.ts"],
      blocked_by: [], evidence_refs: [],
    }],
    change_requests: [], blockers: [], ...overrides,
  };
}

function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "loopdev-delivery-"));
  const copy = (source, destination = source) => {
    const target = join(root, destination);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(repositoryRoot, source), target, { recursive: true });
  };
  copy("docs/03-platform/governance/delivery-workflow.json");
  copy("docs/implementation/_templates");
  write(join(root, "docs/06-product/crm/contacts/README.md"), "# Contacts\n");
  write(join(root, "packages/contracts/src/contact.ts"), "export type Contact = { id: string };\n");
  write(join(root, "src/contact.ts"), "export const contact = true;\n");
  write(join(root, "src/test/contact.test.ts"), "// test\n");
  write(join(root, "docs/implementation/crm/contacts/delivery-ledger.json"), `${JSON.stringify(validLedger(), null, 2)}\n`);
  execFileSync("git", ["init", "-b", "main"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "delivery-test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Delivery Test"], { cwd: root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-m", "fixture source snapshot"], { cwd: root, stdio: "ignore" });
  const machine = new DeliveryStateMachine(root, fixedClock);
  const initialized = machine.initialize({ suite: "crm", moduleName: "Contacts" });
  return { root, machine, runId: initialized.run_id, initialized, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

function complete(machine, runId, phaseId, skill) {
  const output = `docs/implementation/crm/contacts/${phaseId}.md`;
  write(join(machine.root, output), `# ${phaseId}\n`);
  machine.startPhase({ suite: "crm", moduleName: "Contacts", runId, phaseId, skill });
  return machine.completePhase({
    suite: "crm", moduleName: "Contacts", runId, phaseId,
    data: {
      architecture_quality: "PASS",
      output_artifacts: [output],
      validation: [{ command: `validate ${phaseId}`, result: "passed" }],
    },
  });
}

function approve(machine, runId, gate) {
  const artifact = `docs/${gate}.md`;
  write(join(machine.root, artifact), `# ${gate} approval artifact\n`);
  return machine.approve({
    suite: "crm", moduleName: "Contacts", runId, gate,
    approvedBy: "owner@example.com", role: "product_owner",
    artifact, artifactFingerprint: checksum(join(machine.root, artifact)),
    source: `https://github.test/issues/1#${gate}`,
  });
}

function readyForVerification(current, { taskStatus = "done", blocked = false } = {}) {
  const ledgerFile = join(current.root, "docs/implementation/crm/contacts/delivery-ledger.json");
  const ledger = JSON.parse(readFileSync(ledgerFile, "utf8"));
  ledger.status = blocked ? "blocked" : "approved";
  ledger.approved_by = blocked ? null : "owner@example.com";
  ledger.approved_at = blocked ? null : fixedClock().toISOString();
  ledger.approval_source = blocked ? null : "https://github.test/issues/1";
  ledger.blockers = blocked ? ["Missing required journey"] : [];
  ledger.tasks[0].status = blocked ? "blocked" : taskStatus;
  ledger.tasks[0].blocked_by = blocked ? ["Missing required journey"] : [];
  ledger.tasks[0].evidence_refs = taskStatus === "done" && !blocked ? ["src/contact.ts"] : [];
  write(ledgerFile, `${JSON.stringify(ledger, null, 2)}\n`);

  execFileSync("git", ["init", "-b", "main"], { cwd: current.root, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "delivery-test@example.com"], { cwd: current.root });
  execFileSync("git", ["config", "user.name", "Delivery Test"], { cwd: current.root });
  execFileSync("git", ["add", "-A"], { cwd: current.root });
  execFileSync("git", ["reset", "--quiet", "--", "docs/implementation/crm/contacts/runs"], { cwd: current.root });
  execFileSync("git", ["commit", "-m", "fixture source snapshot"], { cwd: current.root, stdio: "ignore" });
}

function writeBuildCheckpoint(current) {
  const checkpoint = { phase: "07-build", run_id: current.runId, status: "completed", invalidated: false };
  write(join(current.machine.runDirectory("crm", "Contacts", current.runId), "07-build.json"), `${JSON.stringify(checkpoint)}\n`);
}

function verificationData(current, sourceCommit, { evidence = null } = {}) {
  const report = `docs/implementation/crm/contacts/runs/${current.runId}/verification-summary.md`;
  write(join(current.root, report), "Verification summary\n");
  const evidenceRecords = evidence ?? ["shared", "desktop_web", "mobile_web"].map((platform) => {
    const artifact = `docs/implementation/crm/contacts/runs/${current.runId}/evidence/${platform}.log`;
    write(join(current.root, artifact), `Journey passed on ${platform}\n`);
    return {
      type: "runtime_journey", created_at: fixedClock().toISOString(), commit: sourceCommit,
      platform, requirement_id: "CONTACTS-REQ-LIST", task_id: "CONTACTS-TASK-LIST",
      journey: "contacts-list-visible", result: "passed", environment: "test server",
      url: "http://localhost:8080/contacts", path: artifact, checksum: checksum(join(current.root, artifact)),
    };
  });
  return {
    architecture_quality: "PASS", output_artifacts: [report],
    validation: [{ command: "npm run validate:contacts", result: "passed", exit_code: 0, source_commit: sourceCommit }],
    evidence: evidenceRecords,
  };
}

test("init materializes the required workspace and starts at discovery", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  assert.equal(current.initialized.run_id, "MOD-CONTACTS-20260914-001");
  const workspace = join(current.root, "docs/implementation/crm/contacts");
  for (const file of [...current.machine.workflow.required_workspace_files, ...current.machine.workflow.required_schema_v1_files]) assert.ok(existsSync(join(workspace, file)), file);
  const manifest = JSON.parse(readFileSync(join(workspace, "runs", current.runId, "run.json")));
  assert.equal(manifest.current_phase, "00-discovery");
  assert.deepEqual(Object.keys(manifest.fingerprints), ["product", "scope", "design", "plan", "contracts", "code", "tests"]);
  const readme = join(workspace, "README.md");
  writeFileSync(readme, "preserve me\n");
  current.machine.materializeWorkspace("crm", "Contacts");
  assert.equal(readFileSync(readme, "utf8"), "preserve me\n");
});

test("start-phase rejects unknown phases, wrong owners and missing predecessors", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  assert.throws(() => current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "03-build", skill: "module-build" }), /Unknown phase/);
  assert.throws(() => current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", skill: "module-verify" }), /must be owned/);
  assert.throws(() => current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "01-design", skill: "module-design" }), /requires completed predecessor/);
});

test("completion requires architecture, outputs and passing validation", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", skill: "module-discovery" });
  assert.throws(() => current.machine.completePhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", data: {} }), /architecture_quality/);
  assert.throws(() => current.machine.completePhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", data: { architecture_quality: "PASS" } }), /output_artifacts/);
  assert.throws(() => current.machine.completePhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", data: { architecture_quality: "PASS", output_artifacts: ["missing.md"], validation: [{ command: "test", result: "passed" }] } }), /does not exist/);
  write(join(current.root, "docs/implementation/crm/contacts/discovery-result.md"), "# Discovery\n");
  assert.throws(() => current.machine.completePhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", data: { architecture_quality: "PASS", output_artifacts: ["docs/implementation/crm/contacts/discovery-result.md"], validation: [{ command: "test", result: "failed" }] } }), /must pass/);
  const checkpoint = current.machine.completePhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", data: { run_id: "ATTACK", skill: "module-verify", architecture_quality: "PASS", output_artifacts: ["docs/implementation/crm/contacts/discovery-result.md"], validation: [{ command: "test", result: "passed (4 tests)" }] } });
  assert.equal(checkpoint.status, "completed");
  assert.equal(checkpoint.run_id, current.runId);
  assert.equal(checkpoint.skill, "module-discovery");
  assert.equal(checkpoint.approval_gate.status, "not_required");
});

test("specialized analysis cannot start before visual approval", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  complete(current.machine, current.runId, "00-discovery", "module-discovery");
  complete(current.machine, current.runId, "01-design", "module-design");
  approve(current.machine, current.runId, "design");
  complete(current.machine, current.runId, "01-visual-design", "module-visual-design");
  assert.throws(() => current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "02-domain", skill: "domain-model" }), /approved gate visual_design/);
  approve(current.machine, current.runId, "visual_design");
  const checkpoint = current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "02-domain", skill: "domain-model" });
  assert.equal(checkpoint.status, "running");
});

test("handoff requires a completed source and an actionable target", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  assert.throws(() => current.machine.handoff({ suite: "crm", moduleName: "Contacts", runId: current.runId, from: "00-discovery", to: "01-design" }), /incomplete phase/);
  complete(current.machine, current.runId, "00-discovery", "module-discovery");
  const handoff = current.machine.handoff({ suite: "crm", moduleName: "Contacts", runId: current.runId, from: "00-discovery", to: "01-design" });
  assert.equal(handoff.to, "01-design");
});

test("resume invalidates downstream phases when code inputs change", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  complete(current.machine, current.runId, "00-discovery", "module-discovery");
  write(join(current.root, "src/contact.ts"), "export const contact = false;\n");
  const resumed = current.machine.resume({ suite: "crm", moduleName: "Contacts", runId: current.runId, reason: "Implementation changed" });
  assert.deepEqual(resumed.changed_categories, ["code"]);
  assert.deepEqual(resumed.invalidated_phases, ["07-build", "08-verify", "09-review", "10-git"]);
  assert.equal(resumed.attempt, 2);
});

test("test-only changes do not invalidate the code category", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  write(join(current.root, "src/test/contact.test.ts"), "// changed test\n");
  const resumed = current.machine.resume({ suite: "crm", moduleName: "Contacts", runId: current.runId, reason: "Tests changed" });
  assert.deepEqual(resumed.changed_categories, ["tests"]);
  assert.deepEqual(resumed.invalidated_phases, ["08-verify", "09-review", "10-git"]);
});

test("scope changes invalidate discovery and every downstream phase", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledgerFile = join(current.root, "docs/implementation/crm/contacts/delivery-ledger.json");
  const ledger = JSON.parse(readFileSync(ledgerFile, "utf8"));
  ledger.requirements[0].acceptance_criteria.push("Changed approved outcome");
  write(ledgerFile, `${JSON.stringify(ledger, null, 2)}\n`);
  const resumed = current.machine.resume({ suite: "crm", moduleName: "Contacts", runId: current.runId, reason: "Scope changed" });
  assert.deepEqual(resumed.changed_categories, ["scope"]);
  assert.equal(resumed.invalidated_phases[0], "00-discovery");
  assert.equal(resumed.invalidated_phases.at(-1), "10-git");
});

test("resume resets approvals whose approved inputs changed", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  approve(current.machine, current.runId, "design");
  write(join(current.root, "docs/implementation/crm/contacts/architecture-design.md"), "# Changed design\n");
  const resumed = current.machine.resume({ suite: "crm", moduleName: "Contacts", runId: current.runId, reason: "Design changed" });
  assert.ok(resumed.invalidated_approvals.includes("design"));
  const manifest = JSON.parse(readFileSync(current.machine.manifestFile("crm", "Contacts", current.runId), "utf8"));
  assert.equal(manifest.approvals.design.status, "pending");
  assert.match(manifest.approvals.design.invalidation_reason, /Changed inputs: design/);
});

test("block persists a blocker and resume records its explicit resolution", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", skill: "module-discovery" });
  current.machine.block({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", reason: "Missing product decision" });
  const resumed = current.machine.resume({ suite: "crm", moduleName: "Contacts", runId: current.runId, reason: "Product owner supplied the decision" });
  assert.deepEqual(resumed.blockers, []);
  assert.equal(resumed.next_phase, "00-discovery");
});

test("workflow v2 refuses verification for blocked or incomplete delivery tasks", (context) => {
  const blocked = fixture();
  context.after(blocked.cleanup);
  readyForVerification(blocked, { blocked: true });
  writeBuildCheckpoint(blocked);
  assert.throws(() => blocked.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: blocked.runId, phaseId: "08-verify", skill: "module-verify" }), /blocked ledger/);

  const incomplete = fixture();
  context.after(incomplete.cleanup);
  readyForVerification(incomplete, { taskStatus: "ready" });
  writeBuildCheckpoint(incomplete);
  assert.throws(() => incomplete.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: incomplete.runId, phaseId: "08-verify", skill: "module-verify" }), /must be done before phase 08-verify/);
});

test("workflow v2 rejects verification if source changes after the snapshot", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  readyForVerification(current);
  writeBuildCheckpoint(current);
  current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "08-verify", skill: "module-verify" });
  const snapshot = JSON.parse(readFileSync(current.machine.manifestFile("crm", "Contacts", current.runId))).environment.verification_snapshot;
  write(join(current.root, "src/contact.ts"), "export const changedDuringVerification = true;\n");
  assert.throws(() => current.machine.completePhase({
    suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "08-verify",
    data: verificationData(current, snapshot.commit),
  }), /uncommitted files remain/);
});

test("workflow v2 requires platform-specific E4 journeys before verification and release", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  readyForVerification(current);
  writeBuildCheckpoint(current);
  current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "08-verify", skill: "module-verify" });
  const manifest = JSON.parse(readFileSync(current.machine.manifestFile("crm", "Contacts", current.runId)));
  const sourceCommit = manifest.environment.verification_snapshot.commit;
  assert.throws(() => current.machine.completePhase({
    suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "08-verify",
    data: verificationData(current, sourceCommit, { evidence: [] }),
  }), /requires structured E4_JOURNEY evidence/);

  const completed = current.machine.completePhase({
    suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "08-verify",
    data: verificationData(current, sourceCommit),
  });
  assert.equal(completed.status, "completed");
  write(join(current.root, "docs/verification.md"), "Verification passed\n");
  current.machine.approve({ suite: "crm", moduleName: "Contacts", runId: current.runId, gate: "verification",
    approvedBy: "owner@example.com", role: "qa", artifact: "docs/verification.md", artifactFingerprint: checksum(join(current.root, "docs/verification.md")), source: "https://github.test/issues/1" });

  const reviewOutput = `docs/implementation/crm/contacts/runs/${current.runId}/review.md`;
  write(join(current.root, reviewOutput), "Review passed\n");
  current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "09-review", skill: "module-review" });
  current.machine.completePhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "09-review",
    data: { architecture_quality: "PASS", output_artifacts: [reviewOutput], validation: [{ command: "review", result: "passed" }] } });
  const release = current.machine.approve({ suite: "crm", moduleName: "Contacts", runId: current.runId, gate: "release",
    approvedBy: "owner@example.com", role: "release_manager", artifact: reviewOutput, artifactFingerprint: checksum(join(current.root, reviewOutput)), source: "https://github.test/issues/1" });
  assert.equal(release.status, "approved");
});

test("approval requires the fingerprint of an existing repository artifact", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  write(join(current.root, "docs/design.md"), "Approved design\n");
  assert.throws(() => current.machine.approve({ suite: "crm", moduleName: "Contacts", runId: current.runId, gate: "design",
    approvedBy: "owner@example.com", role: "product_owner", artifact: "docs/design.md", artifactFingerprint: validFingerprint,
    source: "https://github.test/issues/1" }), /fingerprint does not match file bytes/);
  assert.throws(() => current.machine.approve({ suite: "crm", moduleName: "Contacts", runId: current.runId, gate: "design",
    approvedBy: "owner@example.com", role: "product_owner", artifact: "../outside.md", artifactFingerprint: validFingerprint,
    source: "https://github.test/issues/1" }), /stay inside the repository/);
});

test("approval record binds gate, artifact bytes, approver and source snapshot", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const approval = approve(current.machine, current.runId, "design");
  assert.equal(approval.gate, "design");
  assert.equal(approval.artifact_fingerprint, checksum(join(current.root, approval.artifact)));
  assert.equal(approval.source_snapshot.commit, execFileSync("git", ["rev-parse", "HEAD"], { cwd: current.root, encoding: "utf8" }).trim());
  assert.match(approval.approval_fingerprint, /^sha256:[a-f0-9]{64}$/);
});

test("module-run validator rejects an approved artifact changed after approval", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const approval = approve(current.machine, current.runId, "design");
  write(join(current.root, approval.artifact), "Changed after approval\n");
  assert.throws(() => execFileSync(process.execPath, [join(repositoryRoot, "scripts/validate-module-runs.mjs")], {
    cwd: current.root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }), (error) => /approved gate "design" artifact fingerprint does not match its current bytes/.test(String(error.stderr)));
  write(join(current.root, approval.artifact), "# design approval artifact\n");
  const manifestFile = current.machine.manifestFile("crm", "Contacts", current.runId);
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  manifest.approvals.design.approved_by = "different@example.com";
  write(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.throws(() => execFileSync(process.execPath, [join(repositoryRoot, "scripts/validate-module-runs.mjs")], {
    cwd: current.root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }), (error) => /approved gate "design" approval fingerprint does not match its binding fields/.test(String(error.stderr)));
});

test("module-run validator rejects verification approval against a blocked ledger", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledgerFile = join(current.root, "docs/implementation/crm/contacts/delivery-ledger.json");
  const ledger = JSON.parse(readFileSync(ledgerFile, "utf8"));
  ledger.status = "blocked";
  ledger.blockers = ["Required journey evidence is missing"];
  ledger.tasks[0].status = "blocked";
  ledger.tasks[0].blocked_by = ["Required journey evidence is missing"];
  write(ledgerFile, `${JSON.stringify(ledger, null, 2)}\n`);

  const manifestFile = current.machine.manifestFile("crm", "Contacts", current.runId);
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  manifest.approvals.verification = { status: "approved", approved_by: "owner@example.com", approved_at: fixedClock().toISOString() };
  const checkpointPath = `docs/implementation/crm/contacts/runs/${current.runId}/08-verify.json`;
  manifest.checkpoint_paths = [checkpointPath];
  write(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  write(join(current.root, checkpointPath), `${JSON.stringify({
    schema_version: 1, run_id: current.runId, span_id: `${current.runId}:08-verify`, phase: "08-verify",
    skill: "module-verify", status: "running", decision_status: "open", architecture_quality: "PENDING",
    attempt: 1, started_at: fixedClock().toISOString(), completed_at: null,
    input_fingerprint: manifest.input_fingerprint, environment: manifest.environment,
    input_artifacts: [], output_artifacts: [], decisions: [], actions: [], validation: [], requirements: [], evidence: [],
    detected_failure: null, likely_failure_origin: null, next_handoff: null,
    approval_gate: { status: "not_required", approved_by: null, approved_at: null }, invalidated: false,
  })}\n`);

  assert.throws(() => execFileSync(process.execPath, [join(repositoryRoot, "scripts/validate-module-runs.mjs")], {
    cwd: current.root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }), (error) => /blocked ledger cannot pass approval gate verification/.test(String(error.stderr)));
});

test("all delivery schemas and the canonical workflow are valid JSON", () => {
  const schemas = ["delivery-workflow", "delivery-run", "delivery-checkpoint", "delivery-approval", "delivery-evidence", "delivery-task", "delivery-ledger"];
  for (const schema of schemas) assert.doesNotThrow(() => JSON.parse(readFileSync(join(repositoryRoot, `docs/implementation/_schemas/${schema}.schema.json`), "utf8")));
  assert.doesNotThrow(() => JSON.parse(readFileSync(join(repositoryRoot, "docs/03-platform/governance/delivery-workflow.json"), "utf8")));
  assert.doesNotThrow(() => JSON.parse(readFileSync(join(repositoryRoot, "docs/implementation/_templates/MODULE_RUN_TEMPLATE.json"), "utf8")));
  assert.doesNotThrow(() => JSON.parse(readFileSync(join(repositoryRoot, "docs/implementation/_templates/MODULE_CHECKPOINT_TEMPLATE.json"), "utf8")));
});

test("ledger rejects non-reciprocal requirement and capability links", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger();
  ledger.capabilities[0].requirement_ids = ["CONTACTS-REQ-OTHER"];
  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"), { stage: "plan" });
  assert.ok(errors.some((error) => error.includes("not reciprocal")));
});

test("ledger rejects a required platform without an implementation task", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger();
  ledger.tasks[0].platforms = ["shared", "desktop_web"];
  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"), { stage: "plan" });
  assert.ok(errors.some((error) => error.includes("no task for required platform mobile_web")));
});

test("ledger rejects a capability without operation-level platform coverage", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger();
  ledger.capabilities[0].operation_coverage = [];
  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"), { stage: "plan" });
  assert.ok(errors.some((error) => error.includes("operation listContacts has no platform coverage decision")));
});

test("approved ledger rejects an operation missing from a required platform", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({ status: "approved", approved_by: "owner@example.com", approved_at: "2026-09-14T12:00:00.000Z", approval_source: "https://github.test/issues/1", blockers: [] });
  ledger.tasks[0].status = "ready";
  ledger.capabilities[0].operation_coverage[0].mobile_web = "missing";
  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"));
  assert.ok(errors.some((error) => error.includes("operation listContacts is missing on required platform mobile_web")));
});

test("ledger rejects scope drop without an approved change request", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const previous = validLedger();
  previous.requirements.push({ ...previous.requirements[0], id: "CONTACTS-REQ-REMOVED", title: "Removed requirement" });
  previous.capabilities.push({ ...previous.capabilities[0], id: "CONTACTS-CAP-REMOVED", name: "Removed capability", requirement_ids: ["CONTACTS-REQ-REMOVED"] });
  write(join(current.root, "docs/implementation/crm/contacts/previous-ledger.json"), `${JSON.stringify(previous, null, 2)}\n`);
  const ledger = validLedger({ previous_ledger: "previous-ledger.json" });
  const errors = validateLedger(current.root, ledger, join(current.root, "docs/implementation/crm/contacts/delivery-ledger.json"));
  assert.ok(errors.some((error) => error.includes("scope drop requires approved change request for requirement CONTACTS-REQ-REMOVED")));
  assert.ok(errors.some((error) => error.includes("scope drop requires approved change request for capability CONTACTS-CAP-REMOVED")));
});

test("empty draft ledger is valid in workspace but cannot complete discovery", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const empty = validLedger({ requirements: [], capabilities: [], tasks: [], blockers: ["Populate ledger"] });
  const ledgerFile = join(current.root, "docs/implementation/crm/contacts/delivery-ledger.json");
  write(ledgerFile, `${JSON.stringify(empty, null, 2)}\n`);
  assert.deepEqual(validateLedger(current.root, empty, ledgerFile), []);
  current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", skill: "module-discovery" });
  write(join(current.root, "docs/implementation/crm/contacts/discovery-result.md"), "# Discovery\n");
  assert.throws(() => current.machine.completePhase({
    suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery",
    data: { architecture_quality: "PASS", output_artifacts: ["docs/implementation/crm/contacts/discovery-result.md"], validation: [{ command: "test", result: "passed" }] },
  }), /requirements must not be empty/);
});

test("discovery can complete before implementation tasks exist", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({ tasks: [] });
  ledger.capabilities[0].task_ids = [];
  const ledgerFile = join(current.root, "docs/implementation/crm/contacts/delivery-ledger.json");
  write(ledgerFile, `${JSON.stringify(ledger, null, 2)}\n`);
  assert.deepEqual(validateLedger(current.root, ledger, ledgerFile, { stage: "discovery" }), []);
  const checkpoint = complete(current.machine, current.runId, "00-discovery", "module-discovery");
  assert.equal(checkpoint.status, "completed");
});

test("approved ledger requires all tasks to be ready or done", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({ status: "approved", approved_by: "owner@example.com", approved_at: "2026-09-14T12:00:00.000Z", approval_source: "https://github.test/issues/1", blockers: [] });
  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"));
  assert.ok(errors.some((error) => error.includes("must be ready or done")));
});

test("ledger rejects task dependency cycles", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger();
  ledger.tasks[0].dependencies = [ledger.tasks[0].id];
  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"));
  assert.ok(errors.some((error) => error.includes("dependency cycle")));
});
