import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { validateFinalDeliveryGate, validateLedgerFile } from "./delivery-ledger.mjs";

const sha256 = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const templateMap = {
  "README.md": "module-implementation-readme.md",
  "discovery.md": "discovery.md",
  "architecture-design.md": "architecture-design.md",
  "implementation-plan.md": "implementation-plan.md",
  "requirement-evidence-matrix.md": "requirement-evidence-matrix.md",
  "platform-scope.md": "platform-scope.md",
  "platform-evidence-matrix.md": "platform-evidence-matrix.md",
  "delivery-ledger.json": "delivery-ledger.json",
};

const ignoredDirectoryNames = new Set([".git", ".expo", "build", "coverage", "dist", "node_modules", "runs"]);

function listFiles(path) {
  if (!existsSync(path)) return [];
  const stats = statSync(path);
  if (stats.isFile()) return [path];
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => !entry.isDirectory() || !ignoredDirectoryNames.has(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => listFiles(join(path, entry.name)));
}

function fingerprintPaths(root, paths, excludedFragments = []) {
  const content = paths.flatMap((path) => listFiles(join(root, path)))
    .filter((file) => !excludedFragments.some((fragment) => relative(root, file).startsWith(fragment)))
    .sort()
    .map((file) => `${relative(root, file)}:${readFileSync(file)}`)
    .join("\n");
  return sha256(content);
}

function git(root, args, fallback = null) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return fallback;
  }
}

export class DeliveryStateMachine {
  constructor(root, clock = () => new Date()) {
    this.root = root;
    this.clock = clock;
    this.workflow = readJson(join(root, "docs", "03-platform", "governance", "delivery-workflow.json"));
    this.phaseById = new Map(this.workflow.phases.map((phase) => [phase.id, phase]));
  }

  now() {
    return this.clock().toISOString();
  }

  workspace(suite, moduleName) {
    return join(this.root, "docs", "implementation", slug(suite), slug(moduleName));
  }

  runDirectory(suite, moduleName, runId) {
    return join(this.workspace(suite, moduleName), "runs", runId);
  }

  manifestFile(suite, moduleName, runId) {
    return join(this.runDirectory(suite, moduleName, runId), "run.json");
  }

  loadRun(suite, moduleName, runId) {
    const file = this.manifestFile(suite, moduleName, runId);
    if (!existsSync(file)) throw new Error(`Run not found: ${runId}`);
    return { file, manifest: readJson(file) };
  }

  materializeWorkspace(suite, moduleName) {
    const workspace = this.workspace(suite, moduleName);
    const templates = join(this.root, "docs", "implementation", "_templates");
    mkdirSync(workspace, { recursive: true });
    const created = [];
    for (const requiredFile of [...this.workflow.required_workspace_files, ...this.workflow.required_schema_v1_files]) {
      const destination = join(workspace, requiredFile);
      if (existsSync(destination)) continue;
      const sourceName = templateMap[requiredFile];
      if (!sourceName || !existsSync(join(templates, sourceName))) throw new Error(`No template mapped for ${requiredFile}`);
      const content = readFileSync(join(templates, sourceName), "utf8")
        .replaceAll("<suite>", slug(suite))
        .replaceAll("<module>", slug(moduleName));
      writeFileSync(destination, content);
      created.push(relative(this.root, destination));
    }
    return created;
  }

  fingerprints(suite, moduleName) {
    const workspace = relative(this.root, this.workspace(suite, moduleName));
    return {
      product: fingerprintPaths(this.root, [join("docs", "06-product", slug(suite), slug(moduleName))]),
      scope: fingerprintPaths(this.root, [join(workspace, "delivery-ledger.json")]),
      design: fingerprintPaths(this.root, [join(workspace, "architecture-design.md"), join(workspace, "visual-design.md"), join(workspace, "view-state-matrix.md")]),
      plan: fingerprintPaths(this.root, [join(workspace, "implementation-plan.md")]),
      contracts: fingerprintPaths(this.root, [join("packages", "contracts", "src")]),
      code: fingerprintPaths(this.root, ["src", join("apps", "mobile")], [join("src", "test"), join("apps", "mobile", "test")]),
      tests: fingerprintPaths(this.root, [join("src", "test"), join("apps", "mobile", "test")]),
    };
  }

  initialize({ suite, moduleName, platformScope = ["desktop_web", "mobile_web", "ios", "android"] }) {
    if (!suite || !moduleName) throw new Error("--suite and --module are required");
    const createdFiles = this.materializeWorkspace(suite, moduleName);
    const runs = join(this.workspace(suite, moduleName), "runs");
    mkdirSync(runs, { recursive: true });
    const sequenceFile = join(runs, ".sequence");
    const sequence = String(Number(existsSync(sequenceFile) ? readFileSync(sequenceFile, "utf8").trim() || "0" : "0") + 1).padStart(3, "0");
    writeFileSync(sequenceFile, sequence);
    const runId = `MOD-${slug(moduleName).toUpperCase()}-${this.now().slice(0, 10).replaceAll("-", "")}-${sequence}`;
    const directory = this.runDirectory(suite, moduleName, runId);
    mkdirSync(directory, { recursive: true });
    const approvals = Object.fromEntries(this.workflow.gates.map((gate) => [gate, {
      status: "pending", approved_by: null, approved_at: null, role: null,
      artifact: null, artifact_fingerprint: null, source: null,
    }]));
    const fingerprints = this.fingerprints(suite, moduleName);
    const manifest = {
      schema_version: 1, workflow_version: this.workflow.schema_version, run_id: runId,
      suite: slug(suite), module: moduleName, status: "running", current_phase: this.workflow.initial_phase,
      attempt: 1, started_at: this.now(), updated_at: this.now(),
      input_fingerprint: sha256(JSON.stringify(fingerprints)), fingerprints,
      environment: {
        repository_path: this.root, checkout_type: "branch",
        branch: git(this.root, ["branch", "--show-current"]),
        base_branch: null, head_commit: git(this.root, ["rev-parse", "HEAD"]),
        working_tree: git(this.root, ["status", "--porcelain"], "") ? "modified" : "clean",
        runtime_url: null, runtime_port: null,
      },
      platform_scope: platformScope, approvals, approval_gates: [], architecture_quality: "PENDING",
      platform_impact: [], checkpoint_paths: [], evidence_links: [], change_requests: [], blocked_by: [],
      invalidated_phases: [], invalidation_reason: null, shared_contract_inputs: ["packages/contracts/src"],
      next_action: `Start phase ${this.workflow.initial_phase}.`, handoffs: [], commit: null, pull_request: null,
      retention: { contains_pii: false, redacted: true, retention_class: "engineering-documentation" },
    };
    writeJson(join(directory, "run.json"), manifest);
    return { run_id: runId, workspace: relative(this.root, this.workspace(suite, moduleName)), created_files: createdFiles };
  }

  checkpoints(suite, moduleName, runId) {
    const directory = this.runDirectory(suite, moduleName, runId);
    return new Map(listFiles(directory)
      .filter((file) => file.endsWith(".json") && basename(file) !== "run.json")
      .map((file) => [readJson(file).phase, { file, checkpoint: readJson(file) }]));
  }

  approvalStatus(manifest, gate) {
    const approval = manifest.approvals?.[gate];
    return typeof approval === "string" ? approval : approval?.status;
  }

  captureVerificationSnapshot(suite, moduleName) {
    const headCommit = git(this.root, ["rev-parse", "HEAD"]);
    if (!headCommit) throw new Error("Cannot verify without a committed source snapshot");
    const dirtySource = git(this.root, ["status", "--porcelain", "--untracked-files=all", "--",
      ".", ":(exclude,glob)docs/implementation/**/runs/**", ":(exclude,glob)docs/06-product/**/runs/**",
      ":(exclude,glob)docs/implementation/**/delivery-ledger.json"], "");
    if (dirtySource) throw new Error(`Verification requires committed source changes; uncommitted files remain:\n${dirtySource}`);
    const ledgerFile = join(this.workspace(suite, moduleName), "delivery-ledger.json");
    if (!existsSync(ledgerFile)) throw new Error(`Verification requires delivery ledger: ${relative(this.root, ledgerFile)}`);
    return {
      commit: headCommit,
      ledger_fingerprint: sha256(readFileSync(ledgerFile)),
      captured_at: this.now(),
      worktree: "clean_except_delivery_records",
    };
  }

  assertVerificationSnapshot(suite, moduleName, manifest, checkpoint) {
    const snapshot = manifest.environment?.verification_snapshot;
    if (!snapshot?.commit || !snapshot?.ledger_fingerprint) throw new Error("Verification requires a pinned source snapshot");
    const current = this.captureVerificationSnapshot(suite, moduleName);
    if (current.commit !== snapshot.commit) throw new Error(`Source HEAD changed during verification (${snapshot.commit} -> ${current.commit})`);
    if (current.ledger_fingerprint !== snapshot.ledger_fingerprint) throw new Error("Delivery ledger changed during verification");
    for (const validation of checkpoint.validation ?? []) {
      if (!Number.isInteger(validation.exit_code)) throw new Error("Verification validation entries require an integer exit_code");
      if (validation.exit_code !== 0) throw new Error(`Verification command failed with exit_code ${validation.exit_code}: ${validation.command}`);
      if (validation.source_commit !== snapshot.commit) throw new Error(`Verification validation must reference source_commit ${snapshot.commit}: ${validation.command}`);
    }
  }

  assertLedgerReady(suite, moduleName, context) {
    const ledgerFile = join(this.workspace(suite, moduleName), "delivery-ledger.json");
    const ledgerErrors = validateFinalDeliveryGate(this.root, ledgerFile, context);
    if (ledgerErrors.length) throw new Error(`Delivery ledger is invalid for ${context}:\n${ledgerErrors.join("\n")}`);
  }

  assertCanStart(manifest, checkpoints, phaseId, skill, suite, moduleName) {
    const phase = this.phaseById.get(phaseId);
    if (!phase) throw new Error(`Unknown phase: ${phaseId}`);
    if (skill !== phase.skill) throw new Error(`Phase ${phaseId} must be owned by ${phase.skill}`);
    if (checkpoints.get(phaseId)?.checkpoint.status === "completed" && !checkpoints.get(phaseId)?.checkpoint.invalidated) throw new Error(`Phase ${phaseId} is already completed`);
    for (const predecessor of phase.predecessors) {
      const checkpoint = checkpoints.get(predecessor)?.checkpoint;
      if (checkpoint?.status !== "completed" || checkpoint.invalidated) throw new Error(`Phase ${phaseId} requires completed predecessor ${predecessor}`);
    }
    if (phase.required_gate && this.approvalStatus(manifest, phase.required_gate) !== "approved") throw new Error(`Phase ${phaseId} requires approved gate ${phase.required_gate}`);
    if (manifest.workflow_version >= 2 && ["08-verify", "09-review", "10-git"].includes(phaseId)) {
      this.assertLedgerReady(suite, moduleName, `phase ${phaseId}`);
    }
  }

  startPhase({ suite, moduleName, runId, phaseId, skill }) {
    const { file, manifest } = this.loadRun(suite, moduleName, runId);
    const checkpoints = this.checkpoints(suite, moduleName, runId);
    this.assertCanStart(manifest, checkpoints, phaseId, skill, suite, moduleName);
    if (manifest.workflow_version >= 2 && phaseId === "08-verify") {
      manifest.environment.verification_snapshot = this.captureVerificationSnapshot(suite, moduleName);
    }
    const checkpoint = {
      schema_version: 1, run_id: runId, span_id: `${runId}:${phaseId}`, phase: phaseId, skill,
      parent_span_id: null, module: moduleName, status: "running", decision_status: "open",
      architecture_quality: "PENDING", attempt: manifest.attempt, started_at: this.now(), completed_at: null,
      input_fingerprint: manifest.input_fingerprint, environment: manifest.environment,
      input_artifacts: [], output_artifacts: [], decisions: [], actions: [], validation: [], requirements: [],
      evidence: [], detected_failure: null, likely_failure_origin: null, next_handoff: null,
      approval_gate: { status: "not_required", approved_by: null, approved_at: null }, invalidated: false,
    };
    const checkpointFile = join(this.runDirectory(suite, moduleName, runId), `${phaseId}.json`);
    writeJson(checkpointFile, checkpoint);
    const checkpointPath = relative(this.root, checkpointFile);
    manifest.status = "running";
    manifest.current_phase = phaseId;
    manifest.updated_at = this.now();
    manifest.next_action = `Complete or block phase ${phaseId}.`;
    manifest.checkpoint_paths = [...new Set([...(manifest.checkpoint_paths ?? []), checkpointPath])];
    writeJson(file, manifest);
    return checkpoint;
  }

  completePhase({ suite, moduleName, runId, phaseId, data }) {
    const { file, manifest } = this.loadRun(suite, moduleName, runId);
    const entry = this.checkpoints(suite, moduleName, runId).get(phaseId);
    if (!entry) throw new Error(`Phase ${phaseId} has not been started`);
    if (entry.checkpoint.status !== "running") throw new Error(`Phase ${phaseId} must be running before completion`);
    const checkpoint = {
      ...entry.checkpoint,
      architecture_quality: data.architecture_quality,
      input_artifacts: data.input_artifacts ?? entry.checkpoint.input_artifacts,
      output_artifacts: data.output_artifacts ?? entry.checkpoint.output_artifacts,
      decisions: data.decisions ?? entry.checkpoint.decisions,
      actions: data.actions ?? entry.checkpoint.actions,
      validation: data.validation ?? entry.checkpoint.validation,
      requirements: data.requirements ?? entry.checkpoint.requirements,
      evidence: data.evidence ?? entry.checkpoint.evidence,
      next_handoff: data.next_handoff ?? entry.checkpoint.next_handoff,
    };
    if (!this.workflow.architecture_completion_states.includes(checkpoint.architecture_quality)) throw new Error("Completion requires architecture_quality PASS or PASS_WITH_DEBT");
    if (!checkpoint.output_artifacts?.length) throw new Error("Completion requires output_artifacts");
    for (const artifact of checkpoint.output_artifacts) {
      if (!existsSync(join(this.root, artifact))) throw new Error(`Completion output artifact does not exist: ${artifact}`);
    }
    if (!checkpoint.validation?.length) throw new Error("Completion requires validation evidence");
    if (checkpoint.validation.some((validation) => !validation.command)) throw new Error("Every validation entry requires a command");
    if (checkpoint.validation.some((validation) => !/^(pass|passed)(\b|\s|\()/i.test(validation.result ?? ""))) throw new Error("Every validation result must pass before completion");
    if (["00-discovery", "01-design", "06-plan"].includes(phaseId)) {
      const ledgerFile = join(this.workspace(suite, moduleName), "delivery-ledger.json");
      const stage = phaseId === "06-plan" ? "plan" : phaseId === "01-design" ? "design" : "discovery";
      const ledgerErrors = validateLedgerFile(this.root, ledgerFile, { stage });
      if (ledgerErrors.length) throw new Error(`Delivery ledger is invalid:\n${ledgerErrors.join("\n")}`);
      const ledger = readJson(ledgerFile);
      if (ledger.status === "blocked") throw new Error(`Delivery ledger is blocked: ${(ledger.blockers ?? []).join("; ")}`);
      if (phaseId === "06-plan" && ledger.status !== "approved") throw new Error("Plan completion requires an approved delivery ledger");
    }
    if (manifest.workflow_version >= 2 && ["08-verify", "09-review", "10-git"].includes(phaseId)) {
      this.assertLedgerReady(suite, moduleName, `phase ${phaseId}`);
    }
    if (manifest.workflow_version >= 2 && phaseId === "08-verify") {
      this.assertVerificationSnapshot(suite, moduleName, manifest, checkpoint);
    }
    checkpoint.status = "completed";
    checkpoint.decision_status = "confirmed";
    checkpoint.completed_at = this.now();
    checkpoint.approval_gate = checkpoint.approval_gate?.status === "approved" ? checkpoint.approval_gate : { status: "not_required", approved_by: null, approved_at: null };
    writeJson(entry.file, checkpoint);
    manifest.updated_at = this.now();
    manifest.architecture_quality = checkpoint.architecture_quality;
    manifest.next_action = `Record the handoff from ${phaseId}.`;
    writeJson(file, manifest);
    return checkpoint;
  }

  block({ suite, moduleName, runId, phaseId, reason, origin = null }) {
    const { file, manifest } = this.loadRun(suite, moduleName, runId);
    const entry = this.checkpoints(suite, moduleName, runId).get(phaseId);
    if (!entry) throw new Error(`Phase ${phaseId} has not been started`);
    const checkpoint = { ...entry.checkpoint, status: "blocked", decision_status: "open", completed_at: null,
      detected_failure: reason, likely_failure_origin: origin, next_handoff: null };
    writeJson(entry.file, checkpoint);
    manifest.status = "blocked";
    manifest.updated_at = this.now();
    manifest.blocked_by = [...new Set([...(manifest.blocked_by ?? []), reason])];
    manifest.next_action = `Resolve blocker for ${phaseId}: ${reason}`;
    writeJson(file, manifest);
    return checkpoint;
  }

  approve({ suite, moduleName, runId, gate, approvedBy, role, artifact, artifactFingerprint, source }) {
    const { file, manifest } = this.loadRun(suite, moduleName, runId);
    if (!this.workflow.gates.includes(gate)) throw new Error(`Unknown approval gate: ${gate}`);
    if (!approvedBy || !role || !artifact || !artifactFingerprint || !source) throw new Error("Approval requires --by, --role, --artifact, --fingerprint and --source");
    if (!/^sha256:[a-f0-9]{64}$/.test(artifactFingerprint)) throw new Error("Approval fingerprint must be sha256:<64 hex>");
    if (manifest.workflow_version >= 2 && ["verification", "release"].includes(gate)) {
      this.assertLedgerReady(suite, moduleName, `approval gate ${gate}`);
      const requiredPhase = gate === "verification" ? "08-verify" : "09-review";
      const checkpoint = this.checkpoints(suite, moduleName, runId).get(requiredPhase)?.checkpoint;
      if (checkpoint?.status !== "completed" || checkpoint.invalidated) {
        throw new Error(`Approval gate ${gate} requires a completed, valid ${requiredPhase} checkpoint`);
      }
      if (gate === "release" && this.approvalStatus(manifest, "verification") !== "approved") {
        throw new Error("Approval gate release requires approved verification");
      }
    }
    manifest.approvals[gate] = { status: "approved", approved_by: approvedBy, approved_at: this.now(), role,
      artifact, artifact_fingerprint: artifactFingerprint, source };
    manifest.approval_gates = [...new Set([...(manifest.approval_gates ?? []), gate])];
    manifest.updated_at = this.now();
    writeJson(file, manifest);
    return manifest.approvals[gate];
  }

  handoff({ suite, moduleName, runId, from, to, owner = "delivery" }) {
    const { file, manifest } = this.loadRun(suite, moduleName, runId);
    const checkpoints = this.checkpoints(suite, moduleName, runId);
    if (checkpoints.get(from)?.checkpoint.status !== "completed") throw new Error(`Cannot hand off incomplete phase ${from}`);
    const target = this.phaseById.get(to);
    if (!target) throw new Error(`Unknown handoff target: ${to}`);
    this.assertCanStart(manifest, checkpoints, to, target.skill, suite, moduleName);
    const handoff = { from, to, owner, at: this.now(), input_fingerprint: manifest.input_fingerprint };
    manifest.handoffs = [...(manifest.handoffs ?? []), handoff];
    manifest.current_phase = to;
    manifest.updated_at = this.now();
    manifest.next_action = `Start phase ${to} with ${target.skill}.`;
    writeJson(file, manifest);
    return handoff;
  }

  resume({ suite, moduleName, runId, reason }) {
    const { file, manifest } = this.loadRun(suite, moduleName, runId);
    if (!reason) throw new Error("Resume requires --reason");
    const current = this.fingerprints(suite, moduleName);
    const changedCategories = Object.keys(current).filter((category) => manifest.fingerprints?.[category] !== current[category]);
    const invalidated = [...new Set(changedCategories.flatMap((category) => this.workflow.fingerprint_invalidation[category] ?? []))];
    const approvalInvalidation = {
      product: ["design", "visual_design", "plan", "verification", "release"],
      scope: ["design", "visual_design", "plan", "verification", "release"],
      design: ["design", "visual_design", "plan", "verification", "release"],
      plan: ["plan", "verification", "release"],
      contracts: ["plan", "verification", "release"],
      code: ["verification", "release"],
      tests: ["verification", "release"],
    };
    const invalidatedApprovals = [...new Set(changedCategories.flatMap((category) => approvalInvalidation[category] ?? []))];
    for (const gate of invalidatedApprovals) {
      const approval = manifest.approvals?.[gate];
      if (!approval || this.approvalStatus(manifest, gate) !== "approved") continue;
      manifest.approvals[gate] = { ...approval, status: "pending", invalidated_at: this.now(), invalidation_reason: `Changed inputs: ${changedCategories.join(", ")}` };
    }
    const checkpoints = this.checkpoints(suite, moduleName, runId);
    for (const phaseId of invalidated) {
      const entry = checkpoints.get(phaseId);
      if (!entry || entry.checkpoint.status !== "completed") continue;
      writeJson(entry.file, { ...entry.checkpoint, invalidated: true, invalidated_at: this.now(), invalidation_reason: `Changed inputs: ${changedCategories.join(", ")}` });
    }
    manifest.attempt = (manifest.attempt ?? 1) + 1;
    manifest.resolved_blockers = [...(manifest.resolved_blockers ?? []), ...(manifest.blocked_by ?? []).map((blocker) => ({ blocker, resolution: reason, resolved_at: this.now() }))];
    manifest.blocked_by = [];
    manifest.fingerprints = current;
    manifest.input_fingerprint = sha256(JSON.stringify(current));
    manifest.invalidated_phases = [...new Set([...(manifest.invalidated_phases ?? []), ...invalidated])];
    manifest.invalidation_reason = changedCategories.length ? `Changed inputs: ${changedCategories.join(", ")}` : null;
    manifest.updated_at = this.now();
    const refreshed = this.checkpoints(suite, moduleName, runId);
    const nextPhase = this.workflow.phases.find((phase) => {
      const checkpoint = refreshed.get(phase.id)?.checkpoint;
      if (checkpoint?.status === "completed" && !checkpoint.invalidated) return false;
      return phase.predecessors.every((predecessor) => {
        const predecessorCheckpoint = refreshed.get(predecessor)?.checkpoint;
        return predecessorCheckpoint?.status === "completed" && !predecessorCheckpoint.invalidated;
      }) && (!phase.required_gate || this.approvalStatus(manifest, phase.required_gate) === "approved");
    });
    manifest.current_phase = nextPhase?.id ?? manifest.current_phase;
    manifest.status = "running";
    manifest.next_action = nextPhase ? `Start phase ${nextPhase.id} with ${nextPhase.skill}.` : "Resolve blockers or invalidated predecessors.";
    writeJson(file, manifest);
    return {
      schema_version: 1, run_id: runId, attempt: manifest.attempt, reason,
      changed_categories: changedCategories, invalidated_phases: invalidated,
      invalidated_approvals: invalidatedApprovals,
      blockers: manifest.blocked_by ?? [], last_valid_phase: [...refreshed.values()].filter(({ checkpoint }) => checkpoint.status === "completed" && !checkpoint.invalidated).at(-1)?.checkpoint.phase ?? null,
      next_phase: nextPhase?.id ?? null, next_skill: nextPhase?.skill ?? null, next_action: manifest.next_action,
    };
  }
}
