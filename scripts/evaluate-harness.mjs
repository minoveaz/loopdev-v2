#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const workflowPath = join(root, "docs/03-platform/governance/delivery-workflow.json");
const workflow = readFileSync(workflowPath, "utf8");
const phases = JSON.parse(workflow).phases;
const runId = "MOD-HARNESS-EVAL-20260928-001";
const fingerprint = `sha256:${"a".repeat(64)}`;

function write(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, typeof value === "string" ? value : `${JSON.stringify(value)}\n`);
}

function run(validator, fixture) {
  const started = performance.now();
  const result = spawnSync(process.execPath, [validator], {
    cwd: fixture, encoding: "utf8",
  });
  return {
    status: result.status,
    elapsed_ms: Math.round((performance.now() - started) * 100) / 100,
    output: `${result.stdout}${result.stderr}`,
  };
}

function makeFixture() {
  const fixture = mkdtempSync(join(tmpdir(), "loopdev-harness-evaluation-"));
  const runDirectory = join(fixture, "docs", "06-product", "module-runs", runId);
  write(join(fixture, "docs", "03-platform", "governance", "delivery-workflow.json"), workflow);
  write(join(runDirectory, "07-build.json"), {
    run_id: runId, span_id: `${runId}:07-build`, phase: "07-build",
    skill: "module-build", status: "blocked", decision_status: "open",
    input_artifacts: [], output_artifacts: [], validation: [],
    detected_failure: { code: "BUILD-001" }, likely_failure_origin: null,
    next_handoff: "07-build", input_fingerprint: fingerprint,
    approval_gate: { status: "not_required" }, invalidated: false,
  });
  write(join(runDirectory, "07-build-data.json"), "{ auxiliary artifact");
  return fixture;
}

function baselineValidator(fixture) {
  const baselineFile = join(fixture, "validate-module-runs.mjs");
  write(baselineFile, execFileSync("git", ["show", "HEAD:scripts/validate-module-runs.mjs"], {
    cwd: root, encoding: "utf8",
  }));
  return baselineFile;
}

function currentValidator(fixture) {
  const currentFile = join(fixture, "validate-module-runs.mjs");
  write(currentFile, readFileSync(join(root, "scripts/validate-module-runs.mjs"), "utf8"));
  return currentFile;
}

const cases = [
  {
    id: "auxiliary-json",
    description: "Ignores non-checkpoint JSON data under a run",
    mutate: (fixture) => write(join(fixture, "docs", "06-product", "module-runs", runId, "07-build-data.json"), "{}"),
    expected: { baseline: 1, current: 0 },
    signal: "missing required field",
  },
  {
    id: "malformed-canonical-json",
    description: "Fails malformed canonical checkpoint JSON",
    mutate: (fixture) => write(join(fixture, "docs", "06-product", "module-runs", runId, "07-build.json"), "{ malformed"),
    expected: { baseline: 0, current: 1 },
    signal: "invalid JSON",
  },
  {
    id: "placeholder-fingerprint",
    description: "Rejects a synthetic all-zero fingerprint",
    mutate: (fixture) => write(join(fixture, "docs", "06-product", "module-runs", runId, "07-build.json"), {
      run_id: runId, span_id: `${runId}:07-build`, phase: "07-build",
      skill: "module-build", status: "blocked", decision_status: "open",
      input_artifacts: [], output_artifacts: [], validation: [],
      detected_failure: { code: "BUILD-001" }, likely_failure_origin: null,
      next_handoff: "07-build", input_fingerprint: `sha256:${"0".repeat(64)}`,
      approval_gate: { status: "not_required" }, invalidated: false,
    }),
    expected: { baseline: 0, current: 1 },
    signal: "placeholder",
  },
];

const results = [];
for (const evaluationCase of cases) {
  const baselineFixture = makeFixture();
  const currentFixture = makeFixture();
  evaluationCase.mutate(baselineFixture);
  evaluationCase.mutate(currentFixture);
  const baseline = run(baselineValidator(baselineFixture), baselineFixture);
  const current = run(currentValidator(currentFixture), currentFixture);
  results.push({
    id: evaluationCase.id,
    description: evaluationCase.description,
    baseline: { status: baseline.status, elapsed_ms: baseline.elapsed_ms, signal: baseline.output.includes(evaluationCase.signal) },
    current: { status: current.status, elapsed_ms: current.elapsed_ms, signal: current.output.includes(evaluationCase.signal) },
    expected: evaluationCase.expected,
  });
  rmSync(baselineFixture, { recursive: true, force: true });
  rmSync(currentFixture, { recursive: true, force: true });
}

const passed = results.every((result) =>
  result.baseline.status === result.expected.baseline &&
  result.current.status === result.expected.current &&
  (result.current.status === 0 || result.current.signal),
);
console.log(JSON.stringify({
  schema_version: 1,
  mode: "isolated-deterministic-comparison",
  baseline_ref: "HEAD",
  current_ref: "working-tree",
  cases: results,
  summary: {
    passed: results.filter((result) =>
      result.baseline.status === result.expected.baseline &&
      result.current.status === result.expected.current,
    ).length,
    total: results.length,
    outcome: passed ? "pass" : "fail",
    agent_cases: "not_available",
  },
}, null, 2));

if (!passed) process.exitCode = 1;
