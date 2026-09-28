import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

const root = process.cwd();
const workflow = JSON.parse(readFileSync(join(root, "docs", "03-platform", "governance", "delivery-workflow.json"), "utf8"));
const phaseById = new Map(workflow.phases.map((phase) => [phase.id, phase]));
const architectureCompletionStates = new Set(workflow.architecture_completion_states);
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
  "waiting_user",
  "paused",
]);
const allowedDecisionStatuses = new Set(["confirmed", "assumed", "open", "rejected"]);
const fingerprintPattern = /^sha256:[a-f0-9]{64}$/;
const placeholderFingerprint = `sha256:${"0".repeat(64)}`;
const canonicalCheckpointNames = new Set(workflow.phases.map((phase) => `${phase.id}.json`));
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

const phaseIds = new Set();
for (const phase of workflow.phases) {
  if (phaseIds.has(phase.id)) errors.push(`delivery-workflow.json: duplicate phase "${phase.id}"`);
  phaseIds.add(phase.id);
  if (!phase.skill) errors.push(`delivery-workflow.json: phase "${phase.id}" requires a skill owner`);
}
if (!phaseIds.has(workflow.initial_phase)) errors.push(`delivery-workflow.json: unknown initial phase "${workflow.initial_phase}"`);
if (!phaseIds.has(workflow.terminal_phase)) errors.push(`delivery-workflow.json: unknown terminal phase "${workflow.terminal_phase}"`);
for (const phase of workflow.phases) {
  for (const predecessor of phase.predecessors) if (!phaseIds.has(predecessor)) errors.push(`delivery-workflow.json: phase "${phase.id}" has unknown predecessor "${predecessor}"`);
  if (phase.required_gate && !workflow.gates.includes(phase.required_gate)) errors.push(`delivery-workflow.json: phase "${phase.id}" has unknown gate "${phase.required_gate}"`);
}

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

function isCheckpointFile(file) {
  return canonicalCheckpointNames.has(file.slice(file.lastIndexOf(sep) + 1));
}

function validateFingerprint(file, checkpoint) {
  if (checkpoint.input_fingerprint === placeholderFingerprint) {
    addError(file, "input_fingerprint is a placeholder, not input evidence");
  } else if (checkpoint.input_fingerprint === null) {
    if (
      checkpoint.schema_version !== undefined ||
      checkpoint.status !== "blocked" ||
      checkpoint.legacy_evidence?.input_fingerprint !== "unavailable" ||
      !checkpoint.legacy_evidence?.reason
    ) {
      addError(file, "unavailable fingerprint is only permitted for explicitly annotated, blocked legacy checkpoints");
    }
  } else if (!fingerprintPattern.test(checkpoint.input_fingerprint ?? "")) {
    addError(file, "input_fingerprint must be a sha256:<64 hex> value");
  }
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
  const phase = phaseById.get(checkpoint.phase);
  const filename = file.slice(file.lastIndexOf(sep) + 1);
  if (filename !== `${checkpoint.phase}.json`) addError(file, `phase "${checkpoint.phase}" does not match filename "${filename}"`);
  if (!phase) {
    addError(file, `unknown canonical phase "${checkpoint.phase}"`);
  } else if (checkpoint.skill !== phase.skill) {
    addError(file, `phase "${checkpoint.phase}" must be owned by skill "${phase.skill}", found "${checkpoint.skill}"`);
  }
  if (checkpoint.status === "completed") {
    if (checkpoint.decision_status !== "confirmed") addError(file, `completed checkpoint requires decision_status confirmed, found "${checkpoint.decision_status ?? "missing"}"`);
    if (!architectureCompletionStates.has(checkpoint.architecture_quality)) {
      addError(file, `completed checkpoint requires architecture_quality PASS or PASS_WITH_DEBT, found "${checkpoint.architecture_quality ?? "missing"}"`);
    }
    if (!["approved", "not_required"].includes(checkpoint.approval_gate?.status)) {
      addError(file, `completed checkpoint requires an approved or not_required approval gate, found "${checkpoint.approval_gate?.status ?? "missing"}"`);
    }
    if (!checkpoint.output_artifacts?.length) addError(file, "completed checkpoint requires output_artifacts");
    if (!checkpoint.validation?.length) addError(file, "completed checkpoint requires validation evidence");
    for (const validation of checkpoint.validation ?? []) {
      if (!/^(passed|pass)(\b|\s|\()/i.test(validation.result ?? "")) addError(file, `completed checkpoint contains non-passing validation result "${validation.result ?? "missing"}"`);
    }
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
  if (!fingerprintPattern.test(manifest.input_fingerprint ?? "") || manifest.input_fingerprint === placeholderFingerprint) {
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
  const workspace = dirname(dirname(dirname(file)));
  if (manifest.schema_version === 1) {
    for (const field of ["workflow_version", "suite", "platform_scope", "fingerprints", "handoffs"]) {
      if (!(field in manifest)) addError(file, `schema v1 manifest is missing "${field}"`);
    }
    if (!Array.isArray(manifest.platform_scope) || !manifest.platform_scope.length) addError(file, "schema v1 platform_scope must be a non-empty array");
    for (const category of Object.keys(workflow.fingerprint_invalidation)) {
      if (!fingerprintPattern.test(manifest.fingerprints?.[category] ?? "") || manifest.fingerprints?.[category] === placeholderFingerprint) addError(file, `schema v1 fingerprint "${category}" is missing or invalid`);
    }
    for (const requiredFile of workflow.required_schema_v1_files) {
      if (!existsSync(join(workspace, requiredFile))) addError(file, `schema v1 workspace is missing required file "${requiredFile}"`);
    }
  }

  for (const requiredFile of workflow.required_workspace_files) {
    if (!existsSync(join(workspace, requiredFile))) addError(file, `workspace is missing required file "${requiredFile}"`);
  }

  const runDirectory = dirname(file);
  const checkpoints = new Map();
  for (const checkpointFile of walk(runDirectory).filter(isCheckpointFile)) {
    try {
      const checkpoint = JSON.parse(readFileSync(checkpointFile, "utf8"));
      if (checkpoint.run_id === manifest.run_id && checkpoint.phase) checkpoints.set(checkpoint.phase, checkpoint);
    } catch {
      // Malformed JSON is reported by the checkpoint validator.
    }
  }
  for (const checkpointPath of manifest.checkpoint_paths ?? []) {
    if (!existsSync(join(root, checkpointPath))) addError(file, `checkpoint path does not exist: "${checkpointPath}"`);
  }
  for (const [phaseId, checkpoint] of checkpoints) {
    const phase = phaseById.get(phaseId);
    if (!phase || checkpoint.status !== "completed") continue;
    for (const predecessor of phase.predecessors) {
      if (checkpoints.get(predecessor)?.status !== "completed") addError(file, `completed phase "${phaseId}" requires completed predecessor "${predecessor}"`);
    }
    if (phase.required_gate) {
      const approval = manifest.approvals?.[phase.required_gate];
      const approvalStatus = typeof approval === "string" ? approval : approval?.status;
      if (approvalStatus !== "approved") addError(file, `completed phase "${phaseId}" requires approved gate "${phase.required_gate}"`);
    }
  }
}

function validateCheckpointApproval(file, checkpoint) {
  validateFingerprint(file, checkpoint);
  if (!checkpoint.approval_gate || typeof checkpoint.approval_gate !== "object") addError(file, "approval_gate must be an object");
  if (checkpoint.approval_gate?.status === "approved" && (!checkpoint.approval_gate.approved_by || !checkpoint.approval_gate.approved_at)) {
    addError(file, "approved checkpoint gate requires approved_by and approved_at");
  }
  if (typeof checkpoint.invalidated !== "boolean") addError(file, "invalidated must be boolean");
}

const runFiles = runsRoots
  .flatMap((runsRoot) => walk(runsRoot))
  .filter(
    (file) =>
      file.includes(`${sep}runs${sep}`) ||
      file.includes(`${sep}development-runs${sep}`) ||
      file.includes(`${sep}module-runs${sep}`),
  );

const checkpointFiles = runFiles.filter((file) => {
  const filename = file.slice(file.lastIndexOf(sep) + 1);
  return filename === "run.json" || isCheckpointFile(file) || /^\d{2}-.*\.json$/.test(filename) && !filename.endsWith("-data.json");
});

for (const file of checkpointFiles) {
  const filename = file.slice(file.lastIndexOf(sep) + 1);
  if (filename === "run.json") validateManifest(file);
  else if (!isCheckpointFile(file)) addError(file, `unknown checkpoint phase filename "${filename}"`);
  else {
    let checkpoint;
    try { checkpoint = JSON.parse(readFileSync(file, "utf8")); }
    catch (error) {
      addError(file, `invalid JSON (${error.message})`);
      continue;
    }
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
