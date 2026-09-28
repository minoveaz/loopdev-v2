import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

const repositoryRoot = new URL("../..", import.meta.url).pathname;
const validator = join(repositoryRoot, "scripts/validate-module-runs.mjs");
const runId = "MOD-TEST-20260928-001";

function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, typeof content === "string" ? content : `${JSON.stringify(content)}\n`);
}

function fixture(context) {
  const root = mkdtempSync(join(tmpdir(), "module-run-validation-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  write(join(root, "docs/03-platform/governance/delivery-workflow.json"),
    readFileSync(join(repositoryRoot, "docs/03-platform/governance/delivery-workflow.json"), "utf8"));
  const runDirectory = join(root, "docs/06-product/module-runs", runId);
  const checkpoint = {
    run_id: runId, span_id: `${runId}:07-build`, phase: "07-build",
    skill: "module-build", status: "blocked", decision_status: "open",
    input_artifacts: [], output_artifacts: [], validation: [],
    detected_failure: { code: "BUILD-001" }, likely_failure_origin: null,
    next_handoff: "07-build", input_fingerprint: `sha256:${"a".repeat(64)}`,
    approval_gate: { status: "not_required" }, invalidated: false,
  };
  const file = join(runDirectory, "07-build.json");
  write(file, checkpoint);
  const run = () => spawnSync(process.execPath, [validator], { cwd: root, encoding: "utf8" });
  return { runDirectory, checkpoint, file, run };
}

test("validates canonical checkpoints but not auxiliary data", (context) => {
  const current = fixture(context);
  write(join(current.runDirectory, "07-build-data.json"), "{not a checkpoint");
  const result = current.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 checkpoint file/);
});

test("rejects malformed canonical JSON rather than silently succeeding", (context) => {
  const current = fixture(context);
  write(current.file, "{not json");
  assert.match(current.run().stderr, /invalid JSON/);
  assert.equal(current.run().status, 1);
});

test("rejects an unknown phase file and a mismatched canonical filename", (context) => {
  const current = fixture(context);
  write(join(current.runDirectory, "99-invented.json"), current.checkpoint);
  assert.match(current.run().stderr, /unknown checkpoint phase filename/);
  rmSync(join(current.runDirectory, "99-invented.json"));
  write(current.file, { ...current.checkpoint, phase: "03-access" });
  assert.match(current.run().stderr, /does not match filename/);
});

test("refuses a placeholder hash and limits unavailable evidence to blocked legacy records", (context) => {
  const current = fixture(context);
  write(current.file, { ...current.checkpoint, input_fingerprint: `sha256:${"0".repeat(64)}` });
  assert.match(current.run().stderr, /placeholder/);
  const unavailable = {
    ...current.checkpoint, input_fingerprint: null,
    legacy_evidence: { input_fingerprint: "unavailable", reason: "Original inputs not retained" },
  };
  write(current.file, unavailable);
  assert.equal(current.run().status, 0);
  write(current.file, { ...unavailable, schema_version: 1 });
  assert.match(current.run().stderr, /only permitted/);
  write(current.file, { ...unavailable, status: "completed" });
  assert.match(current.run().stderr, /only permitted/);
});
