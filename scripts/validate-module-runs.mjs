import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const runsRoots = [
  join(root, "docs", "implementation"),
  join(root, "docs", "06-product"),
];
const allowedPhaseStatuses = new Set([
  "pending",
  "running",
  "completed",
  "blocked",
  "failed",
  "deviated",
  "skipped",
]);
const allowedDecisionStatuses = new Set(["confirmed", "assumed", "open", "rejected"]);
const requiredCheckpointFields = [
  "run_id",
  "span_id",
  "phase",
  "skill",
  "status",
  "decision_status",
  "input_artifacts",
  "output_artifacts",
  "validation",
  "detected_failure",
  "likely_failure_origin",
  "next_handoff",
  "input_fingerprint",
  "approval_gate",
  "invalidated",
];
const requiredManifestFields = [
  "run_id",
  "module",
  "status",
  "current_phase",
  "attempt",
  "environment",
  "approvals",
  "platform_impact",
  "checkpoint_paths",
  "evidence_links",
  "change_requests",
  "blocked_by",
  "next_action",
  "retention",
  "input_fingerprint",
  "approval_gates",
  "invalidated_phases",
  "shared_contract_inputs",
];

const errors = [];

function addError(file, message) {
  errors.push(`${relative(root, file)}: ${message}`);
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.name.endsWith(".json") ? [path] : [];
  });
}

function validateCheckpoint(file) {
  let checkpoint;
  try {
    checkpoint = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    addError(file, `invalid JSON (${error.message})`);
    return;
  }

  for (const field of requiredCheckpointFields) {
    if (!(field in checkpoint)) addError(file, `missing required field "${field}"`);
  }

  if (checkpoint.status && !allowedPhaseStatuses.has(checkpoint.status)) {
    addError(file, `invalid phase status "${checkpoint.status}"`);
  }
  if (checkpoint.decision_status && !allowedDecisionStatuses.has(checkpoint.decision_status)) {
    addError(file, `invalid decision status "${checkpoint.decision_status}"`);
  }
  if (checkpoint.status === "completed" && !checkpoint.completed_at) {
    addError(file, "completed checkpoints require completed_at");
  }
  if (checkpoint.status === "blocked" && !checkpoint.detected_failure) {
    addError(file, "blocked checkpoints require detected_failure");
  }
  if (!Array.isArray(checkpoint.input_artifacts)) {
    addError(file, "input_artifacts must be an array");
  }
  if (!Array.isArray(checkpoint.output_artifacts)) {
    addError(file, "output_artifacts must be an array");
  }
  if (!Array.isArray(checkpoint.validation)) {
    addError(file, "validation must be an array");
  }
  if (checkpoint.environment && typeof checkpoint.environment !== "object") {
    addError(file, "environment must be an object when present");
  }
}

function validateManifest(file) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    addError(file, `invalid JSON (${error.message})`);
    return;
  }

  for (const field of requiredManifestFields) {
    if (!(field in manifest)) addError(file, `missing required field "${field}"`);
  }
  if (manifest.status && !allowedPhaseStatuses.has(manifest.status)) {
    addError(file, `invalid phase status "${manifest.status}"`);
  }
  if (!Number.isInteger(manifest.attempt) || manifest.attempt < 1) {
    addError(file, "attempt must be a positive integer");
  }
  for (const field of [
    "platform_impact",
    "checkpoint_paths",
    "evidence_links",
    "change_requests",
    "blocked_by",
  ]) {
    if (manifest[field] && !Array.isArray(manifest[field])) {
      addError(file, `${field} must be an array`);
    }
  }
  if (manifest.retention && typeof manifest.retention !== "object") {
    addError(file, "retention must be an object");
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(manifest.input_fingerprint ?? "")) {
    addError(file, "input_fingerprint must be a sha256:<64 hex> value");
  }
  if (!Array.isArray(manifest.approval_gates) || !Array.isArray(manifest.invalidated_phases) || !Array.isArray(manifest.shared_contract_inputs)) {
    addError(file, "approval_gates, invalidated_phases and shared_contract_inputs must be arrays");
  }
  if (manifest.approvals && typeof manifest.approvals !== "object") addError(file, "approvals must be an object");
  for (const [gate, approval] of Object.entries(manifest.approvals ?? {})) {
    if (typeof approval === "string") continue; // legacy manifests remain readable
    if (!approval || !["pending", "approved", "rejected"].includes(approval.status)) addError(file, `approval "${gate}" has invalid status`);
    if (approval.status === "approved" && (!approval.approved_by || !approval.approved_at)) addError(file, `approved "${gate}" requires approved_by and approved_at`);
  }
}

function validateCheckpointApproval(file, checkpoint) {
  if (!/^sha256:[a-f0-9]{64}$/.test(checkpoint.input_fingerprint ?? "")) addError(file, "input_fingerprint must be a sha256:<64 hex> value");
  if (!checkpoint.approval_gate || typeof checkpoint.approval_gate !== "object") addError(file, "approval_gate must be an object");
  if (checkpoint.approval_gate?.status === "approved" && (!checkpoint.approval_gate.approved_by || !checkpoint.approval_gate.approved_at)) {
    addError(file, "approved checkpoint gate requires approved_by and approved_at");
  }
  if (typeof checkpoint.invalidated !== "boolean") addError(file, "invalidated must be boolean");
}

const checkpointFiles = runsRoots
  .flatMap((runsRoot) => walk(runsRoot))
  .filter(
    (file) =>
      file.includes(`${sep}runs${sep}`) ||
      file.includes(`${sep}development-runs${sep}`) ||
      file.includes(`${sep}module-runs${sep}`),
  );

for (const file of checkpointFiles) {
  if (file.endsWith(`${sep}run.json`)) validateManifest(file);
  else {
    let checkpoint;
    try { checkpoint = JSON.parse(readFileSync(file, "utf8")); } catch { continue; }
    validateCheckpoint(file);
    validateCheckpointApproval(file, checkpoint);
  }
}

if (errors.length > 0) {
  console.error(`Module run validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    checkpointFiles.length === 0
      ? "Module run validation passed: no production checkpoints are currently recorded."
      : `Module run validation passed: ${checkpointFiles.length} checkpoint file(s) checked.`,
  );
}
