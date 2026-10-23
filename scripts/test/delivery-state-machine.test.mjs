import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { DeliveryStateMachine } from "../lib/delivery-state-machine.mjs";
import { validateLedger } from "../lib/delivery-ledger.mjs";

const repositoryRoot = new URL("../..", import.meta.url).pathname;
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

test("ledger rejects task dependency cycles", (context) => {
  const current = fixture();
  context.after(current.cleanup);
  const ledger = validLedger();
  ledger.tasks[0].dependencies = [ledger.tasks[0].id];
  const errors = validateLedger(current.root, ledger, join(current.root, "delivery-ledger.json"));
  assert.ok(errors.some((error) => error.includes("dependency cycle")));
});