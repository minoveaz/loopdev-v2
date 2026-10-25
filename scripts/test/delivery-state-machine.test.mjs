import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { DeliveryStateMachine } from "../lib/delivery-state-machine.mjs";
import { validateLedger } from "../lib/delivery-ledger.mjs";

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
  const machine = new DeliveryStateMachine(root, fixedClock);
  const initialized = machine.initialize({ suite: "crm", moduleName: "Contacts", profile: "standard" });
  return { root, machine, runId: initialized.run_id, initialized, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

function bareFixture() {
  const root = mkdtempSync(join(tmpdir(), "loopdev-delivery-first-"));
  const copy = (source, destination = source) => {
    const target = join(root, destination);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(repositoryRoot, source), target, { recursive: true });
  };
  copy("docs/03-platform/governance/delivery-workflow.json");
  copy("docs/implementation/_templates");
  return { root, machine: new DeliveryStateMachine(root, fixedClock), cleanup: () => rmSync(root, { recursive: true, force: true }) };
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
  return machine.approve({
    suite: "crm", moduleName: "Contacts", runId, gate,
    approvedBy: "owner@example.com", role: "product_owner",
    artifact: `docs/${gate}.md`, artifactFingerprint: validFingerprint,
    source: `https://github.test/issues/1#${gate}`,
  });
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

test("CLI defaults to implementation-first with no pre-build documentation workspace", (context) => {
  const current = bareFixture();
  context.after(current.cleanup);
  const script = join(repositoryRoot, "scripts", "delivery-run.mjs");
  const result = spawnSync(process.execPath, [script, "init", "--suite", "crm", "--module", "Contacts"],
    { cwd: current.root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const initialized = JSON.parse(result.stdout);
  assert.deepEqual(initialized.created_files.map((file) => file.replaceAll("\\", "/")),
    ["docs/implementation/crm/contacts/delivery-ledger.json"]);
  const manifest = JSON.parse(readFileSync(join(current.root, "docs/implementation/crm/contacts/runs",
    initialized.run_id, "run.json"), "utf8"));
  assert.equal(manifest.profile, "implementation-first");
  assert.equal(manifest.current_phase, "06-plan");
  assert.deepEqual(manifest.platform_scope, ["desktop_web", "mobile_web"]);
  assert.ok(!existsSync(join(current.root, "docs/implementation/crm/contacts/architecture-design.md")));
  assert.ok(!existsSync(join(current.root, "docs/implementation/crm/contacts/implementation-plan.md")));
  const validated = spawnSync(process.execPath, [join(repositoryRoot, "scripts", "validate-module-runs.mjs")],
    { cwd: current.root, encoding: "utf8" });
  assert.equal(validated.status, 0, validated.stderr || validated.stdout);
});

test("implementation-first writes its report only after the approved code build", (context) => {
  const current = bareFixture();
  context.after(current.cleanup);
  write(join(current.root, "docs/06-product/crm/contacts/README.md"), "# Approved product scope\n");
  write(join(current.root, "packages/contracts/src/contact.ts"), "export type Contact = { id: string };\n");
  const initialized = current.machine.initialize({ suite: "crm", moduleName: "Contacts", profile: "implementation-first" });
  const scope = { suite: "crm", moduleName: "Contacts", runId: initialized.run_id };
  const workspace = current.machine.workspace("crm", "Contacts");
  const ledger = validLedger({
    status: "approved",
    approved_by: "owner",
    approved_at: fixedClock().toISOString(),
    approval_source: "Approved implementation scope",
    blockers: [],
  });
  ledger.tasks[0].status = "ready";
  write(join(workspace, "delivery-ledger.json"), `${JSON.stringify(ledger, null, 2)}\n`);

  const plan = current.machine.startPhase({ ...scope, phaseId: "06-plan", skill: "module-plan" });
  const ledgerPath = "docs/implementation/crm/contacts/delivery-ledger.json";
  const uiReuseReview = {
    ui_scope: true,
    new_component: false,
    rationale: "The approved Contacts scope includes desktop and mobile list views.",
    evidence: [
      { category: "loopdev_component", source: "src/components/common/DataTable.tsx", finding: "Reuse the typed shared table composition." },
      { category: "platform_capability", source: "docs/03-platform/frontend/PLATFORM_V2_UI_REFERENCE.md", finding: "No domain Platform capability applies to contact listing; shared UI primitives do." },
      { category: "cross_suite_module", suite: "erp", source: "src/loopdev/pages/erp/ProductRecordPages.tsx", finding: "Use the ERP list's search and row-action pattern as a reference." },
    ],
  };
  for (const item of uiReuseReview.evidence) write(join(current.root, item.source), `# ${item.category}\n`);
  const planData = {
    ...scope,
    phaseId: "06-plan",
    data: { architecture_quality: "PASS", output_artifacts: [ledgerPath], validation: [{ command: "validate plan", result: "passed" }] },
  };
  assert.throws(() => current.machine.completePhase(planData), /complete ui_reuse_review/);
  assert.throws(() => current.machine.completePhase({
    ...planData,
    data: { ...planData.data, ui_reuse_review: {
      ...uiReuseReview,
      evidence: uiReuseReview.evidence.filter((item) => item.category !== "cross_suite_module"),
    } },
  }), /comparable module from another suite or a documented cross-suite search/);
  assert.throws(() => current.machine.completePhase({
    ...planData,
    data: { ...planData.data, ui_reuse_review: {
      ...uiReuseReview,
      evidence: uiReuseReview.evidence.map((item) => item.category === "loopdev_component"
        ? { ...item, source: "src/components/common/MissingTable.tsx" }
        : item),
    } },
  }), /existing repository source and finding for loopdev_component/);
  assert.throws(() => current.machine.completePhase({
    ...planData,
    data: { ...planData.data, ui_reuse_review: {
      ...uiReuseReview,
      evidence: uiReuseReview.evidence.map((item) => item.category === "cross_suite_module"
        ? { ...item, suite: "crm" }
        : item),
    } },
  }), /comparable module from another suite or a documented cross-suite search/);
  assert.throws(() => current.machine.completePhase({
    ...planData,
    data: { ...planData.data, ui_reuse_review: { ...uiReuseReview, new_component: true } },
  }), /existing Rivera template source/);
  assert.throws(() => current.machine.completePhase({
    ...planData,
    data: { ...planData.data, ui_reuse_review: {
      ui_scope: false,
      new_component: true,
      rationale: "Contradictory review",
      evidence: [],
    } },
  }), /cannot be proposed when ui_scope is false/);
  const completedPlan = current.machine.completePhase({
    ...scope,
    phaseId: "06-plan",
    data: {
      architecture_quality: "PASS",
      output_artifacts: [ledgerPath],
      validation: [{ command: "validate plan", result: "passed" }],
      ui_reuse_review: uiReuseReview,
    },
  });
  assert.deepEqual(completedPlan.ui_reuse_review, uiReuseReview);
  assert.throws(() => current.machine.startPhase({ ...scope, phaseId: "07-build", skill: "module-build" }), /approved gate plan/);
  current.machine.approve({ ...scope, gate: "plan", approvedBy: "owner", role: "product_owner",
    artifact: ledgerPath, artifactFingerprint: validFingerprint, source: "Explicit scope approval" });

  const build = current.machine.startPhase({ ...scope, phaseId: "07-build", skill: "module-build" });
  assert.deepEqual(build.task_ids, plan.task_ids);
  write(join(current.root, "src/contact.ts"), "export const contact = true;\n");
  write(join(current.root, "src/test/contact.test.ts"), "// passing behavior test\n");
  ledger.tasks[0].status = "done";
  ledger.tasks[0].evidence_refs = ["src/test/contact.test.ts"];
  write(join(workspace, "delivery-ledger.json"), `${JSON.stringify(ledger, null, 2)}\n`);
  current.machine.completePhase({
    ...scope,
    phaseId: "07-build",
    data: { architecture_quality: "PASS", output_artifacts: ["src/contact.ts"], validation: [{ command: "npm test -- contact", result: "passed" }] },
  });
  assert.ok(!existsSync(join(workspace, "implementation-report.md")));

  current.machine.startPhase({ ...scope, phaseId: "08-verify", skill: "module-verify" });
  assert.throws(() => current.machine.completePhase({
    ...scope,
    phaseId: "08-verify",
    data: { architecture_quality: "PASS", output_artifacts: ["src/contact.ts"], validation: [{ command: "npm test", result: "passed" }] },
  }), /must produce implementation-report\.md/);
  const report = "docs/implementation/crm/contacts/implementation-report.md";
  write(join(current.root, report), "# Implemented scope and verification\n");
  const verified = current.machine.completePhase({
    ...scope,
    phaseId: "08-verify",
    data: { architecture_quality: "PASS", output_artifacts: [report], validation: [{ command: "npm run build", result: "passed" }] },
  });
  assert.ok(verified.output_artifacts.includes(report));
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

test("task progress and evidence do not invalidate the approved scope fingerprint", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const before = current.machine.fingerprints("crm", "Contacts").scope;
  const ledgerFile = join(current.root, "docs/implementation/crm/contacts/delivery-ledger.json");
  const ledger = JSON.parse(readFileSync(ledgerFile, "utf8"));
  ledger.tasks[0].owner = "Platform owner";
  ledger.tasks[0].status = "done";
  ledger.tasks[0].blocked_by = ["Waiting for runtime access"];
  ledger.tasks[0].evidence_refs = ["docs/evidence.md#task"];
  write(ledgerFile, `${JSON.stringify(ledger, null, 2)}\n`);
  assert.equal(current.machine.fingerprints("crm", "Contacts").scope, before);
  const resumed = current.machine.resume({
    suite: "crm",
    moduleName: "Contacts",
    runId: current.runId,
    reason: "Task execution state changed",
  });
  assert.deepEqual(resumed.changed_categories, []);

  ledger.requirements[0].acceptance_criteria.push("Changed approved outcome");
  write(ledgerFile, `${JSON.stringify(ledger, null, 2)}\n`);
  assert.notEqual(current.machine.fingerprints("crm", "Contacts").scope, before);
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

test("resume can resolve selected blockers without clearing the remaining gates", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", skill: "module-discovery" });
  current.machine.block({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", reason: "Missing product decision" });
  const manifestPath = current.machine.manifestFile("crm", "Contacts", current.runId);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.blocked_by.push("Platform owner approval required");
  write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const resumed = current.machine.resume({
    suite: "crm",
    moduleName: "Contacts",
    runId: current.runId,
    reason: "Product owner supplied the product decision",
    resolveBlockers: ["Missing product decision"],
  });

  assert.deepEqual(resumed.blockers, ["Platform owner approval required"]);
  const updated = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.deepEqual(updated.resolved_blockers.map(({ blocker }) => blocker), ["Missing product decision"]);
  assert.equal(updated.status, "running");
});

test("restarting a blocked phase preserves its evidence and decisions", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const checkpoint = current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", skill: "module-discovery" });
  const checkpointFile = join(current.machine.runDirectory("crm", "Contacts", current.runId), "00-discovery.json");
  checkpoint.actions.push("Recorded initial source review");
  checkpoint.evidence.push({ type: "source", path: "src/contact.ts", result: "Inspected" });
  write(checkpointFile, `${JSON.stringify(checkpoint, null, 2)}\n`);
  current.machine.block({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", reason: "Missing product decision" });
  current.machine.resume({
    suite: "crm",
    moduleName: "Contacts",
    runId: current.runId,
    reason: "Product owner supplied the decision",
  });

  const restarted = current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "00-discovery", skill: "module-discovery" });

  assert.equal(restarted.status, "running");
  assert.deepEqual(restarted.actions, ["Recorded initial source review"]);
  assert.deepEqual(restarted.evidence, [{ type: "source", path: "src/contact.ts", result: "Inspected" }]);
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

test("plan approval requires an explicit task for each missing required operation and platform", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger();
  ledger.capabilities[0].operation_coverage[0].mobile_web = "missing";
  let errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"), { stage: "plan" });
  assert.ok(errors.some((error) => error.includes("without an operation-level task")));
  ledger.tasks[0].operation_ids = ["listContacts"];
  errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"), { stage: "plan" });
  assert.deepEqual(errors, []);
});

test("approved ledger does not require implementation tasks for deferred capabilities", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({
    status: "approved",
    approved_by: "owner@example.com",
    approved_at: "2026-09-14T12:00:00.000Z",
    approval_source: "https://github.test/issues/1",
    blockers: [],
  });
  ledger.tasks[0].status = "ready";
  ledger.requirements.push({
    id: "CONTACTS-REQ-FOLLOW-UP",
    title: "Future commerce integration",
    classification: "REQUIRED_FOLLOW_UP",
    source: "docs/06-product/crm/contacts/README.md",
    platforms: ["desktop_web", "mobile_web"],
    acceptance_criteria: ["Future integration scope is discovered separately"],
    evidence_level: "E4_JOURNEY",
    capability_ids: ["CONTACTS-CAP-FOLLOW-UP"],
  });
  ledger.capabilities.push({
    ...structuredClone(ledger.capabilities[0]),
    id: "CONTACTS-CAP-FOLLOW-UP",
    name: "Future commerce integration",
    classification: "REQUIRED_FOLLOW_UP",
    requirement_ids: ["CONTACTS-REQ-FOLLOW-UP"],
    semantics: { operations: ["connectFutureCommerce"], errors: ["FORBIDDEN"] },
    operation_coverage: [{
      id: "connectFutureCommerce",
      desktop_web: "missing",
      mobile_web: "missing",
      ios: "not_applicable",
      android: "not_applicable",
      adaptation_ref: null,
    }],
    task_ids: [],
  });

  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"));
  assert.deepEqual(errors, []);
});

test("task-scoped approval validates only its approved operation while preserving unrelated blockers", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({ task_scoped_approvals: true, blockers: ["Unrelated Platform audit prerequisite"] });
  ledger.capabilities[0].semantics.operations.push("updateContacts");
  ledger.capabilities[0].operation_coverage.push({
    id: "updateContacts", desktop_web: "implemented", mobile_web: "missing",
    ios: "not_applicable", android: "not_applicable", adaptation_ref: null,
  });
  ledger.tasks[0].status = "ready";
  ledger.tasks[0].operation_ids = ["listContacts"];
  ledger.tasks[0].approval = {
    approved_by: "owner@example.com",
    approved_at: "2026-09-14T12:00:00.000Z",
    approval_source: "https://github.test/issues/1",
  };
  const ledgerFile = join(current.root, "delivery-ledger.json");
  assert.deepEqual(validateLedger(current.root, ledger, ledgerFile, { stage: "plan", taskIds: ["CONTACTS-TASK-LIST"] }), []);
  const globalErrors = validateLedger(current.root, ledger, ledgerFile, { stage: "plan" });
  assert.ok(globalErrors.some((error) => error.includes("updateContacts is missing on required platform mobile_web")));
});

test("task-scoped mode rejects a ready task without its own approval", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({ task_scoped_approvals: true, blockers: ["Unrelated Platform audit prerequisite"] });
  ledger.tasks[0].status = "ready";
  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"));
  assert.ok(errors.some((error) => error.includes("requires a complete task-scoped approval")));
});

test("approved plan may preserve missing operation status when an explicit task is blocked", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({ status: "approved", approved_by: "owner@example.com", approved_at: "2026-09-14T12:00:00.000Z", approval_source: "https://github.test/issues/1", blockers: [] });
  ledger.tasks[0].status = "blocked";
  ledger.tasks[0].blocked_by = ["PLATFORM-OWNER-APPROVAL"];
  ledger.tasks[0].operation_ids = ["listContacts"];
  ledger.capabilities[0].operation_coverage[0].mobile_web = "missing";
  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"));
  assert.deepEqual(errors, []);
});

test("implementation and verification gates reject missing operations even when planned", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({ status: "approved", approved_by: "owner@example.com", approved_at: "2026-09-14T12:00:00.000Z", approval_source: "https://github.test/issues/1", blockers: [] });
  ledger.tasks[0].status = "ready";
  ledger.tasks[0].operation_ids = ["listContacts"];
  ledger.capabilities[0].operation_coverage[0].mobile_web = "missing";
  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"), { stage: "implementation" });
  assert.ok(errors.some((error) => error.includes("operation listContacts is missing on required platform mobile_web")));
  ledger.capabilities[0].operation_coverage[0].mobile_web = "adapted";
  ledger.capabilities[0].operation_coverage[0].adaptation_ref = "PLATFORM-MOBILE-ADAPTATION-001";
  const adaptedErrors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"), { stage: "verification" });
  assert.deepEqual(adaptedErrors, []);
  const releaseErrors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"), { stage: "release" });
  assert.deepEqual(releaseErrors, []);
});

test("verification cannot start while a required operation is still missing", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({
    status: "approved",
    approved_by: "owner@example.com",
    approved_at: "2026-09-14T12:00:00.000Z",
    approval_source: "https://github.test/issues/1",
    blockers: [],
  });
  ledger.tasks[0].status = "ready";
  ledger.tasks[0].operation_ids = ["listContacts"];
  ledger.capabilities[0].operation_coverage[0].mobile_web = "missing";
  write(join(current.machine.workspace("crm", "Contacts"), "delivery-ledger.json"), `${JSON.stringify(ledger, null, 2)}\n`);

  const predecessorPhases = ["00-discovery", "01-design", "01-visual-design", "02-domain", "03-access", "04-api", "05-sync", "06-plan", "07-build"];
  const runDirectory = current.machine.runDirectory("crm", "Contacts", current.runId);
  for (const phase of predecessorPhases) {
    write(join(runDirectory, `${phase}.json`), JSON.stringify({ phase, status: "completed", invalidated: false }));
  }

  assert.throws(
    () => current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "08-verify", skill: "module-verify" }),
    /Operation parity gate failed:[\s\S]*missing on required platform mobile_web/,
  );
});

test("build cannot complete while a required operation is still missing", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({
    status: "approved",
    approved_by: "owner@example.com",
    approved_at: "2026-09-14T12:00:00.000Z",
    approval_source: "https://github.test/issues/1",
    blockers: [],
  });
  ledger.tasks[0].status = "done";
  ledger.tasks[0].operation_ids = ["listContacts"];
  ledger.tasks[0].evidence_refs = ["test evidence"];
  ledger.capabilities[0].operation_coverage[0].mobile_web = "missing";
  write(join(current.machine.workspace("crm", "Contacts"), "delivery-ledger.json"), `${JSON.stringify(ledger, null, 2)}\n`);
  write(join(current.machine.runDirectory("crm", "Contacts", current.runId), "06-plan.json"), JSON.stringify({ phase: "06-plan", status: "completed", invalidated: false }));
  current.machine.approve({
    suite: "crm", moduleName: "Contacts", runId: current.runId, gate: "plan",
    approvedBy: "owner@example.com", role: "product_owner", artifact: "docs/implementation/crm/contacts/delivery-ledger.json",
    artifactFingerprint: validFingerprint, source: "https://github.test/issues/1",
  });
  current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "07-build", skill: "module-build" });
  const output = "docs/implementation/crm/contacts/build-evidence.md";
  write(join(current.root, output), "# Build evidence\n");

  assert.throws(
    () => current.machine.completePhase({
      suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "07-build",
      data: { architecture_quality: "PASS", output_artifacts: [output], validation: [{ command: "test", result: "passed" }] },
    }),
    /operation listContacts is missing on required platform mobile_web/,
  );
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

test("approved ledger allows in-progress tasks but rejects pending tasks", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({ status: "approved", approved_by: "owner@example.com", approved_at: "2026-09-14T12:00:00.000Z", approval_source: "https://github.test/issues/1", blockers: [] });
  ledger.tasks[0].status = "in_progress";
  let errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"));
  assert.ok(!errors.some((error) => error.includes("approved ledger task")));
  ledger.tasks[0].status = "pending";
  errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"));
  assert.ok(errors.some((error) => error.includes("must be ready, in_progress, done or explicitly blocked")));
});

test("scoped plan and build phases can run with unrelated global blockers", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger({ task_scoped_approvals: true, blockers: ["Unrelated Platform audit prerequisite"] });
  ledger.tasks[0].status = "ready";
  ledger.tasks[0].operation_ids = ["listContacts"];
  ledger.tasks[0].approval = {
    approved_by: "owner@example.com",
    approved_at: "2026-09-14T12:00:00.000Z",
    approval_source: "https://github.test/issues/1",
  };
  write(join(current.machine.workspace("crm", "Contacts"), "delivery-ledger.json"), `${JSON.stringify(ledger, null, 2)}\n`);

  complete(current.machine, current.runId, "00-discovery", "module-discovery");
  complete(current.machine, current.runId, "01-design", "module-design");
  approve(current.machine, current.runId, "design");
  complete(current.machine, current.runId, "01-visual-design", "module-visual-design");
  approve(current.machine, current.runId, "visual_design");
  complete(current.machine, current.runId, "02-domain", "domain-model");
  complete(current.machine, current.runId, "03-access", "access-design");
  complete(current.machine, current.runId, "04-api", "api-contracts");
  complete(current.machine, current.runId, "05-sync", "sync-design");

  const plan = current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "06-plan", skill: "module-plan" });
  assert.deepEqual(plan.task_ids, ["CONTACTS-TASK-LIST"]);
  const planOutput = "docs/implementation/crm/contacts/scoped-plan.md";
  write(join(current.root, planOutput), "# Scoped plan\n");
  current.machine.completePhase({
    suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "06-plan",
    data: { architecture_quality: "PASS", output_artifacts: [planOutput], validation: [{ command: "scoped plan validation", result: "passed" }] },
  });

  const build = current.machine.startPhase({ suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "07-build", skill: "module-build" });
  assert.deepEqual(build.task_ids, ["CONTACTS-TASK-LIST"]);
  ledger.tasks[0].status = "done";
  ledger.tasks[0].evidence_refs = ["src/test/contact.test.ts"];
  write(join(current.machine.workspace("crm", "Contacts"), "delivery-ledger.json"), `${JSON.stringify(ledger, null, 2)}\n`);
  const buildOutput = "docs/implementation/crm/contacts/scoped-build.md";
  write(join(current.root, buildOutput), "# Scoped build\n");
  const checkpoint = current.machine.completePhase({
    suite: "crm", moduleName: "Contacts", runId: current.runId, phaseId: "07-build",
    data: { architecture_quality: "PASS", output_artifacts: [buildOutput], validation: [{ command: "scoped build validation", result: "passed" }] },
  });
  assert.deepEqual(checkpoint.task_ids, ["CONTACTS-TASK-LIST"]);
  assert.equal(checkpoint.status, "completed");
});

test("ledger rejects task dependency cycles", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger();
  ledger.tasks[0].dependencies = [ledger.tasks[0].id];
  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"));
  assert.ok(errors.some((error) => error.includes("dependency cycle")));
});

function pilotFixture(context) {
  const current = fixture();
  context.after(current.cleanup);
  const workspace = current.machine.workspace("erp", "Proveedores");
  const ledger = validLedger({ suite: "erp", module: "proveedores" });
  write(join(workspace, "delivery-ledger.json"), JSON.stringify(ledger));
  const initialized = current.machine.initialize({ suite: "erp", moduleName: "Proveedores",
    profile: "supplier-pilot", sliceId: "supplier-directory" });
  const scope = { suite: "erp", moduleName: "Proveedores", runId: initialized.run_id };
  const readLedger = () => JSON.parse(readFileSync(join(workspace, "delivery-ledger.json"), "utf8"));
  const updateLedger = (update) => {
    const value = readLedger();
    update(value);
    write(join(workspace, "delivery-ledger.json"), JSON.stringify(value));
  };
  const finish = (phaseId, data = {}) => {
    const phase = current.machine.workflow.experimental_profiles["supplier-pilot"].phases.find((phase) => phase.id === phaseId);
    const output = `docs/implementation/erp/proveedores/${phaseId}.md`;
    write(join(current.root, output), `# ${phaseId}\n`);
    current.machine.startPhase({ ...scope, phaseId, skill: phase.skill });
    return current.machine.completePhase({ ...scope, phaseId, data: {
      architecture_quality: "PASS", output_artifacts: [output],
      validation: [{ command: `validate ${phaseId}`, result: "passed" }], ...data,
    } });
  };
  const authorize = (gate, phaseId = "01-visual-design") => {
    const artifact = `docs/implementation/erp/proveedores/${phaseId}.md`;
    return current.machine.approve({ ...scope, gate, approvedBy: "owner", role: "product",
      artifact, artifactFingerprint: `sha256:${createHash("sha256").update(readFileSync(join(current.root, artifact))).digest("hex")}`,
      source: "Explicit fixture approval" });
  };
  const plan = () => {
    finish("00-discovery");
    finish("01-design");
    finish("01-visual-design");
    authorize("visual_design");
    updateLedger((value) => {
      value.status = "approved";
      value.approved_by = "owner";
      value.approved_at = fixedClock().toISOString();
      value.approval_source = "Explicit fixture scope approval";
      value.tasks[0].status = "ready";
    });
    finish("06-plan", { prebuild_decisions: {
      domain: "Unique organization-owned supplier identity",
      access: "Server-enforced organization isolation and explicit read/write permissions",
      persistence: "Online adapter with validated commands",
      platform_reuse: "Reuse shared controls and Platform capabilities",
      rollback: "Disable the route; retain existing records",
    } });
  };
  const build = () => {
    updateLedger((value) => {
      value.tasks[0].status = "done";
      value.tasks[0].evidence_refs = ["src/test/contact.test.ts"];
    });
    finish("07-build");
  };
  return { ...current, scope, workspace, readLedger, updateLedger, finish, authorize, plan, build };
}

test("pilot is opt-in, restricted to suppliers, and requires a named slice", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  assert.equal(current.machine.loadRun("crm", "Contacts", current.runId).manifest.profile, undefined);
  assert.throws(() => current.machine.initialize({ suite: "erp", moduleName: "Proveedores", profile: "unknown" }), /Unknown delivery profile/);
  assert.throws(() => current.machine.initialize({ suite: "crm", moduleName: "Contacts", profile: "supplier-pilot", sliceId: "list" }), /restricted/);
  assert.throws(() => current.machine.initialize({ suite: "erp", moduleName: "Proveedores", profile: "supplier-pilot" }), /slice_id/);
  assert.throws(() => current.machine.initialize({ suite: "erp", moduleName: "Proveedores", profile: "supplier-pilot", sliceId: "list", platformScope: ["desktop_web"] }), /desktop_web and mobile_web/);
});

test("pilot requires one combined scope/visual approval and records safety decisions before build", (context) => {
  const current = pilotFixture(context);
  current.finish("00-discovery");
  current.finish("01-design");
  current.finish("01-visual-design");
  assert.throws(() => current.machine.startPhase({ ...current.scope, phaseId: "06-plan", skill: "module-plan" }), /approved gate visual_design/);
  const artifact = "docs/implementation/erp/proveedores/01-visual-design.md";
  assert.throws(() => current.machine.approve({ ...current.scope, gate: "visual_design", approvedBy: "owner",
    role: "product", artifact, artifactFingerprint: validFingerprint, source: "approval" }), /does not match/);
  const approval = current.authorize("visual_design");
  assert.equal(approval.slice_id, "supplier-directory");
  current.machine.startPhase({ ...current.scope, phaseId: "06-plan", skill: "module-plan" });
  assert.throws(() => current.machine.completePhase({ ...current.scope, phaseId: "06-plan", data: {} }), /prebuild_decisions.domain/);
  assert.throws(() => current.machine.startPhase({ ...current.scope, phaseId: "02-domain", skill: "domain-model" }), /Unknown phase/);
});

test("pilot execution progress does not invalidate scope, design or plan", (context) => {
  const current = pilotFixture(context);
  current.plan();
  current.updateLedger((value) => {
    value.tasks[0].status = "in_progress";
    value.tasks[0].evidence_refs = ["src/test/contact.test.ts"];
    value.capabilities[0].parity.renderer = "verified";
    value.capabilities[0].operation_coverage[0].mobile_web = "missing";
  });
  const resumed = current.machine.resume({ ...current.scope, reason: "Record execution progress" });
  assert.deepEqual(resumed.changed_categories, []);
  assert.equal(current.machine.inspect(current.scope).approvals.visual_design.status, "approved");
  assert.equal(current.machine.inspect(current.scope).platform_scope.join(","), "desktop_web,mobile_web");
  assert.equal(current.machine.inspect(current.scope).milestones.implemented, false);
  assert.throws(() => current.build(), /operation listContacts/);
});

test("pilot material scope changes invalidate approval even without an explicit resume", (context) => {
  const current = pilotFixture(context);
  current.plan();
  current.updateLedger((value) => value.capabilities[0].permissions.push("suppliers.write"));
  assert.throws(() => current.machine.startPhase({ ...current.scope, phaseId: "07-build", skill: "module-build" }), /Approved scope changed/);
  const resumed = current.machine.resume({ ...current.scope, reason: "Permission model changed" });
  assert.ok(resumed.invalidated_approvals.includes("visual_design"));
  assert.equal(current.machine.inspect(current.scope).approvals.visual_design.status, "pending");
  assert.ok(!resumed.invalidated_phases.includes("02-domain"));
});

test("pilot task definition changes reopen planning, not product approval", (context) => {
  const current = pilotFixture(context);
  current.plan();
  current.updateLedger((value) => value.tasks[0].validation.push({ command: "extra validation", required: true }));
  assert.throws(() => current.machine.startPhase({ ...current.scope, phaseId: "07-build", skill: "module-build" }), /Plan inputs changed/);
  const resumed = current.machine.resume({ ...current.scope, reason: "Plan checks changed" });
  assert.deepEqual(resumed.changed_categories, ["plan"]);
  assert.equal(current.machine.inspect(current.scope).approvals.visual_design.status, "approved");
});

test("pilot build stays within planned tasks and ignores unrelated blockers", (context) => {
  const current = pilotFixture(context);
  current.updateLedger((value) => {
    value.task_scoped_approvals = true;
    value.blockers = ["Unrelated Finance/Legal prerequisite"];
    value.tasks[0].status = "ready";
    value.tasks[0].approval = {
      approved_by: "owner",
      approved_at: fixedClock().toISOString(),
      approval_source: "Explicit task approval",
    };
    value.tasks.push({
      ...value.tasks[0],
      id: "CONTACTS-TASK-DEFERRED",
      title: "Handle a deferred contact operation",
      status: "blocked",
      blocked_by: ["Waiting on unrelated prerequisite"],
      approval: undefined,
      evidence_refs: [],
    });
    value.capabilities[0].task_ids.push("CONTACTS-TASK-DEFERRED");
  });
  current.finish("00-discovery");
  current.finish("01-design");
  current.finish("01-visual-design");
  current.authorize("visual_design");
  current.finish("06-plan", { prebuild_decisions: {
    domain: "Keep contact records organization-owned",
    access: "Enforce organization-scoped access",
    persistence: "Use the existing persistence adapter",
    platform_reuse: "Reuse shared contact controls",
    rollback: "Retain records and disable the feature safely",
  } });
  current.updateLedger((value) => {
    value.tasks[1].status = "ready";
    value.tasks[1].blocked_by = [];
    value.tasks[1].approval = {
      approved_by: "owner",
      approved_at: fixedClock().toISOString(),
      approval_source: "Explicit task approval",
    };
  });

  const build = current.machine.startPhase({ ...current.scope, phaseId: "07-build", skill: "module-build" });
  assert.deepEqual(build.task_ids, ["CONTACTS-TASK-LIST"]);
  current.updateLedger((value) => {
    value.tasks[0].status = "done";
    value.tasks[0].evidence_refs = ["src/test/contact.test.ts"];
  });
  const output = "docs/implementation/erp/proveedores/scoped-build.md";
  write(join(current.root, output), "# Scoped build\n");
  current.machine.completePhase({
    ...current.scope,
    phaseId: "07-build",
    data: { architecture_quality: "PASS", output_artifacts: [output], validation: [{ command: "scoped build validation", result: "passed" }] },
  });
  assert.equal(current.machine.inspect(current.scope).milestones.implemented, true);
});

test("pilot distinguishes implementation, product acceptance, verification and release", (context) => {
  const current = pilotFixture(context);
  current.plan();
  assert.throws(() => current.authorize("product_acceptance"), /requires completed phase 07-build/);
  current.build();
  assert.equal(current.machine.inspect(current.scope).milestones.implemented, true);
  assert.equal(current.machine.inspect(current.scope).milestones.verified, false);
  current.finish("08-verify");
  assert.throws(() => current.machine.startPhase({ ...current.scope, phaseId: "09-review", skill: "module-review" }), /approved gate product_acceptance/);
  current.authorize("product_acceptance", "07-build");
  current.finish("09-review");
  assert.equal(current.machine.inspect(current.scope).milestones.ready_for_delivery, false);
  current.authorize("release", "09-review");
  const inspected = current.machine.inspect(current.scope);
  assert.equal(inspected.milestones.product_accepted, true);
  assert.equal(inspected.milestones.verified, true);
  assert.equal(inspected.milestones.ready_for_delivery, true);
  assert.equal(inspected.milestones.publication, "not_recorded");
  assert.equal(inspected.approvals.push.status, "pending");
  assert.equal(inspected.approvals.pull_request.status, "pending");
});

test("pilot feedback repeats build in the same slice and preserves prior evidence", (context) => {
  const current = pilotFixture(context);
  current.plan();
  current.build();
  current.authorize("product_acceptance", "07-build");
  current.machine.iterate({ ...current.scope, reason: "Refine spacing without changing approved behavior" });
  const inspected = current.machine.inspect(current.scope);
  assert.equal(inspected.approvals.visual_design.status, "approved");
  assert.equal(inspected.approvals.product_acceptance.status, "pending");
  assert.equal(inspected.milestones.implemented, false);
  assert.equal(inspected.iterations.length, 1);
  assert.equal(inspected.attempt, 2);
  assert.ok(inspected.iterations[0].checkpoints.some((checkpoint) => checkpoint.phase === "07-build" && !checkpoint.invalidated));
  current.build();
  assert.equal(current.machine.inspect(current.scope).milestones.implemented, true);
});

test("pilot rejects stale acceptance and hides stale implementation evidence", (context) => {
  const current = pilotFixture(context);
  current.plan();
  current.build();
  write(join(current.root, "src/contact.ts"), "export const contact = false;\n");
  assert.equal(current.machine.inspect(current.scope).milestones.implemented, false);
  assert.throws(() => current.authorize("product_acceptance", "07-build"), /current implementation\/test evidence/);
  assert.throws(() => current.machine.startPhase({ ...current.scope, phaseId: "08-verify", skill: "module-verify" }), /Build inputs changed/);
});

test("standard runs cannot enter the experimental iteration loop", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  assert.throws(() => current.machine.iterate({ suite: "crm", moduleName: "Contacts", runId: current.runId, reason: "feedback" }), /only available for supplier-pilot/);
});

test("CLI can initialize and inspect the explicitly selected pilot", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const script = join(repositoryRoot, "scripts", "delivery-run.mjs");
  const initialized = spawnSync(process.execPath, [script, "init", "--suite", "erp", "--module", "Proveedores",
    "--profile", "supplier-pilot", "--slice", "supplier-directory"], { cwd: current.root, encoding: "utf8" });
  assert.equal(initialized.status, 0, initialized.stderr);
  const { run_id: runId } = JSON.parse(initialized.stdout);
  const inspected = spawnSync(process.execPath, [script, "inspect", "--suite", "erp", "--module", "Proveedores",
    "--run", runId], { cwd: current.root, encoding: "utf8" });
  assert.equal(inspected.status, 0, inspected.stderr);
  const manifest = JSON.parse(inspected.stdout);
  assert.equal(manifest.profile, "supplier-pilot");
  assert.deepEqual(manifest.completion_scope, { type: "slice", id: "supplier-directory" });
  assert.equal(manifest.milestones.prototype, false);
});

test("CI validator accepts pilot iterations and rejects foreign profiles and missing safety decisions", (context) => {
  const current = pilotFixture(context);
  current.plan();
  current.build();
  current.authorize("product_acceptance", "07-build");
  current.machine.iterate({ ...current.scope, reason: "Feedback" });
  const validate = () => spawnSync(process.execPath, [join(repositoryRoot, "scripts", "validate-module-runs.mjs")],
    { cwd: current.root, encoding: "utf8" });
  let result = validate();
  assert.equal(result.status, 0, result.stderr);
  const planFile = join(current.workspace, "runs", current.scope.runId, "06-plan.json");
  const plan = JSON.parse(readFileSync(planFile, "utf8"));
  delete plan.prebuild_decisions;
  write(planFile, JSON.stringify(plan));
  result = validate();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /prebuild_decisions.domain/);
  const manifestFile = current.machine.manifestFile("erp", "Proveedores", current.scope.runId);
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  manifest.profile = "unknown";
  write(manifestFile, JSON.stringify(manifest));
  result = validate();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown delivery profile/);
});

test("pilot cannot claim delivery after operation coverage or task readiness regresses", (context) => {
  const current = pilotFixture(context);
  current.plan();
  current.build();
  current.finish("08-verify");
  current.authorize("product_acceptance", "07-build");
  current.finish("09-review");
  current.authorize("release", "09-review");
  current.updateLedger((value) => { value.capabilities[0].operation_coverage[0].mobile_web = "missing"; });
  assert.equal(current.machine.inspect(current.scope).milestones.ready_for_delivery, false);
  current.updateLedger((value) => {
    value.capabilities[0].operation_coverage[0].mobile_web = "implemented";
    value.tasks[0].status = "ready";
  });
  assert.equal(current.machine.inspect(current.scope).milestones.implemented, false);
});

test("pilot invalidation preserves product approval for code changes but reopens acceptance and publication", (context) => {
  const current = pilotFixture(context);
  current.plan();
  current.build();
  current.finish("08-verify");
  current.authorize("product_acceptance", "07-build");
  current.finish("09-review");
  current.authorize("release", "09-review");
  current.authorize("push", "09-review");
  write(join(current.root, "src/contact.ts"), "export const contact = 'refined';\n");
  const resumed = current.machine.resume({ ...current.scope, reason: "Refine approved behavior" });
  assert.ok(!resumed.invalidated_approvals.includes("visual_design"));
  const inspected = current.machine.inspect(current.scope);
  assert.equal(inspected.approvals.visual_design.status, "approved");
  assert.equal(inspected.approvals.product_acceptance.status, "pending");
  assert.equal(inspected.approvals.release.status, "pending");
  assert.equal(inspected.approvals.push.status, "pending");
  assert.equal(inspected.iterations.length, 1);
});

test("pilot contract changes reopen product approval", (context) => {
  const current = pilotFixture(context);
  current.plan();
  write(join(current.root, "packages/contracts/src/contact.ts"), "export type Contact = { tenantId: string };\n");
  assert.throws(() => current.machine.startPhase({ ...current.scope, phaseId: "07-build", skill: "module-build" }), /Approved contracts changed/);
  const resumed = current.machine.resume({ ...current.scope, reason: "Shared contract changed" });
  assert.ok(resumed.invalidated_approvals.includes("visual_design"));
});

test("pilot ignores unrelated contracts but reopens approval for semantic design changes", (context) => {
  const current = pilotFixture(context);
  current.plan();
  write(join(current.root, "packages/contracts/src/unrelated.ts"), "export type Other = string;\n");
  let resumed = current.machine.resume({ ...current.scope, reason: "Another module changed" });
  assert.deepEqual(resumed.changed_categories, []);
  assert.equal(current.machine.inspect(current.scope).approvals.visual_design.status, "approved");
  write(join(current.workspace, "architecture-design.md"), "# Different domain architecture\n");
  assert.throws(() => current.machine.startPhase({ ...current.scope, phaseId: "07-build", skill: "module-build" }), /Approved design changed/);
  resumed = current.machine.resume({ ...current.scope, reason: "Architecture changed" });
  assert.ok(resumed.invalidated_approvals.includes("visual_design"));
});

test("pilot approval must reference an actual phase output and its unchanged reviewed version", (context) => {
  const current = pilotFixture(context);
  current.plan();
  const unrelated = "src/contact.ts";
  assert.throws(() => current.machine.approve({ ...current.scope, gate: "visual_design", artifact: unrelated,
    artifactFingerprint: validFingerprint, approvedBy: "owner", role: "product", source: "approval" }), /output artifact/);
  write(join(current.workspace, "01-visual-design.md"), "# Different reviewed version\n");
  assert.throws(() => current.machine.startPhase({ ...current.scope, phaseId: "07-build", skill: "module-build" }), /visual artifact changed/);
});