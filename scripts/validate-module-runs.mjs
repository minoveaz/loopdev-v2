import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";
import { validateFinalDeliveryGate } from "./lib/delivery-ledger.mjs";
import { validateEvidenceRecords } from "./lib/delivery-evidence.mjs";

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
const requiredCheckpointFields = [
  "schema_version",
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
  "schema_version",
  "workflow_version",
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
let legacyRecordCount = 0;

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

function validateCheckpoint(file) {
  let checkpoint;
  try {
    checkpoint = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    addError(file, `invalid JSON (${error.message})`);
    return;
  }

  if (checkpoint.schema_version === 0) {
    legacyRecordCount += 1;
    if (typeof checkpoint.legacy_schema_reason !== "string" || !checkpoint.legacy_schema_reason.trim()) {
      addError(file, "legacy records require a legacy_schema_reason");
    }
    return;
  }
  if (checkpoint.schema_version !== 1) {
    addError(file, `unsupported schema_version "${checkpoint.schema_version}"`);
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

  if (manifest.schema_version === 0) {
    legacyRecordCount += 1;
    if (typeof manifest.legacy_schema_reason !== "string" || !manifest.legacy_schema_reason.trim()) {
      addError(file, "legacy records require a legacy_schema_reason");
    }
    return;
  }
  if (manifest.schema_version !== 1) {
    addError(file, `unsupported schema_version "${manifest.schema_version}"`);
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
  const workspace = dirname(dirname(dirname(file)));
  if (manifest.schema_version === 1) {
    for (const field of ["workflow_version", "suite", "platform_scope", "fingerprints", "handoffs"]) {
      if (!(field in manifest)) addError(file, `schema v1 manifest is missing "${field}"`);
    }
    if (!Array.isArray(manifest.platform_scope) || !manifest.platform_scope.length) addError(file, "schema v1 platform_scope must be a non-empty array");
    for (const category of Object.keys(workflow.fingerprint_invalidation)) {
      if (!/^sha256:[a-f0-9]{64}$/.test(manifest.fingerprints?.[category] ?? "")) addError(file, `schema v1 fingerprint "${category}" is missing or invalid`);
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
  for (const checkpointFile of walk(runDirectory).filter((candidate) => !candidate.endsWith(`${sep}run.json`))) {
    try {
      const checkpoint = JSON.parse(readFileSync(checkpointFile, "utf8"));
      if (checkpoint.run_id === manifest.run_id && checkpoint.phase) checkpoints.set(checkpoint.phase, checkpoint);
    } catch {
      // Malformed JSON is reported by the checkpoint validator.
    }
  }
  for (const checkpointPath of manifest.checkpoint_paths ?? []) {
    const candidates = [join(workspace, checkpointPath), join(root, checkpointPath)];
    if (!candidates.some(existsSync)) addError(file, `checkpoint path does not exist: "${checkpointPath}"`);
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
  if (manifest.workflow_version >= 2) {
    const blockedCheckpoint = [...checkpoints.entries()].find(([, checkpoint]) => checkpoint.status === "blocked");
    if (blockedCheckpoint && manifest.status !== "blocked") {
      addError(file, `blocked phase "${blockedCheckpoint[0]}" requires manifest status blocked`);
    }
    if (manifest.status === "blocked" && !(manifest.blocked_by ?? []).length) {
      addError(file, "blocked manifest requires at least one blocked_by reason");
    }
    if (manifest.status === "completed" && checkpoints.get(workflow.terminal_phase)?.checkpoint.status !== "completed") {
      addError(file, `completed manifest requires completed terminal phase "${workflow.terminal_phase}"`);
    }
    const ledgerFile = join(workspace, "delivery-ledger.json");
    const verification = checkpoints.get("08-verify");
    if (verification?.status === "completed" && !verification.invalidated) {
      const snapshot = manifest.environment?.verification_snapshot;
      if (!snapshot?.commit || !/^sha256:[a-f0-9]{64}$/.test(snapshot.ledger_fingerprint ?? "")) {
        addError(file, "completed verification requires a pinned commit and ledger fingerprint");
      } else {
        const currentLedgerFingerprint = `sha256:${createHash("sha256").update(readFileSync(ledgerFile)).digest("hex")}`;
        if (snapshot.ledger_fingerprint !== currentLedgerFingerprint) addError(file, "delivery ledger changed after the verification snapshot");
      }
      if (verification.environment?.verification_snapshot?.commit !== snapshot?.commit) {
        addError(file, "verification checkpoint source snapshot does not match the run manifest");
      }
      const ledger = JSON.parse(readFileSync(ledgerFile, "utf8"));
      const evidenceResult = validateEvidenceRecords(root, verification.evidence, {
        head: snapshot?.commit,
        requirementIds: new Set((ledger.requirements ?? []).map((requirement) => requirement.id)),
        tasks: new Map((ledger.tasks ?? []).map((task) => [task.id, task])),
        requiredTaskIds: (ledger.tasks ?? []).filter((task) => task.status === "done" && ["E4_JOURNEY", "E5_DEVICE"].includes(task.evidence_level)).map((task) => task.id),
        strict: true,
        label: "verification evidence",
      });
      for (const error of evidenceResult.errors) addError(file, error);
      for (const validation of verification.validation ?? []) {
        if (validation.exit_code !== 0) addError(file, `verification command must have exit_code 0: ${validation.command ?? "missing command"}`);
        if (validation.source_commit !== snapshot?.commit) addError(file, `verification command must reference pinned source_commit: ${validation.command ?? "missing command"}`);
      }
    }
    for (const gate of ["verification", "release"]) {
      const approval = manifest.approvals?.[gate];
      const approvalStatus = typeof approval === "string" ? approval : approval?.status;
      if (approvalStatus !== "approved") continue;
      const gateErrors = validateFinalDeliveryGate(root, ledgerFile, `approval gate ${gate}`);
      for (const error of gateErrors) addError(file, error.replace(`${relative(root, ledgerFile)}: `, ""));
      const requiredPhase = gate === "verification" ? "08-verify" : "09-review";
      const checkpoint = checkpoints.get(requiredPhase);
      if (checkpoint?.status !== "completed" || checkpoint.invalidated) {
        addError(file, `approved gate "${gate}" requires completed, valid phase "${requiredPhase}"`);
      }
      if (gate === "release") {
        const verification = manifest.approvals?.verification;
        const verificationStatus = typeof verification === "string" ? verification : verification?.status;
        if (verificationStatus !== "approved") addError(file, "approved release gate requires approved verification gate");
      }
    }
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
  .filter((file) => {
    const name = basename(file);
    return (
      name === "run.json" ||
      (/^\d{2}-[a-z0-9][a-z0-9-]*\.json$/.test(name) && !name.endsWith("-data.json"))
    );
  });

for (const file of checkpointFiles) {
  if (file.endsWith(`${sep}run.json`)) validateManifest(file);
  else {
    let checkpoint;
    try { checkpoint = JSON.parse(readFileSync(file, "utf8")); } catch { continue; }
    validateCheckpoint(file);
    if (checkpoint.schema_version === 1) validateCheckpointApproval(file, checkpoint);
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
      : `Module run validation passed: ${checkpointFiles.length} checkpoint file(s) checked (${legacyRecordCount} archived legacy record(s)).`,
  );
}
