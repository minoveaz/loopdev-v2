import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const command = args[0];
const option = (name, fallback = null) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};
const now = new Date().toISOString();
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const moduleName = option("module", "Untitled module");
const suite = option("suite", "platform");
const implementationRoot = join(root, "docs", "implementation", slug(suite), slug(moduleName));
const contracts = join(root, "packages", "contracts", "src");
const fingerprint = () => {
  const files = existsSync(contracts) ? readdirSync(contracts).filter((file) => file.endsWith(".ts")).sort().map((file) => `${file}:${readFileSync(join(contracts, file), "utf8")}`).join("\n") : "";
  return `sha256:${createHash("sha256").update(files).digest("hex")}`;
};
const nextRun = () => {
  const date = now.slice(0, 10).replaceAll("-", "");
  const idPrefix = `MOD-${slug(moduleName).toUpperCase()}-${date}-`;
  const runs = join(implementationRoot, "runs");
  mkdirSync(runs, { recursive: true });
  const sequenceFile = join(runs, ".sequence");
  const existing = existsSync(sequenceFile) ? (readFileSync(sequenceFile, "utf8").trim() || "0") : "0";
  const sequence = String(Number(existing) + 1).padStart(3, "0");
  writeFileSync(join(runs, ".sequence"), sequence);
  return `${idPrefix}${sequence}`;
};
const runDir = (runId = option("run", "")) => join(implementationRoot, "runs", runId);
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

if (!command || !["init", "checkpoint", "handoff", "validate", "report", "resume"].includes(command)) {
  console.error("Usage: delivery <init|checkpoint|handoff|validate|report|resume> [--module name] [--suite suite] [--run id]");
  process.exit(2);
}

if (command === "init") {
  const runId = nextRun();
  const directory = runDir(runId);
  mkdirSync(directory, { recursive: true });
  const manifest = {
    run_id: runId, module: moduleName, status: "running", current_phase: "01-design",
    attempt: 1, started_at: now, updated_at: now, input_fingerprint: fingerprint(),
    approvals: { design: { status: "pending", approved_by: null, approved_at: null, gate: "design" }, plan: { status: "pending", approved_by: null, approved_at: null, gate: "plan" }, verification: { status: "pending", approved_by: null, approved_at: null, gate: "verification" }, release: { status: "pending", approved_by: null, approved_at: null, gate: "release" } },
    approval_gates: [], invalidated_phases: [], invalidation_reason: null, shared_contract_inputs: ["packages/contracts/src"],
    environment: { repository_path: root, head_commit: null, runtime_url: null, runtime_port: null },
    platform_impact: [], checkpoint_paths: [], evidence_links: [], change_requests: [], blocked_by: [],
    next_action: "Create the first checkpoint.", commit: null, pull_request: null,
    retention: { contains_pii: false, redacted: true, retention_class: "engineering-documentation" },
  };
  writeJson(join(directory, "run.json"), manifest);
  console.log(`Initialized ${runId} at ${directory}`);
} else if (command === "checkpoint") {
  const id = option("run");
  if (!id || !existsSync(runDir(id))) throw new Error("--run must identify an existing run");
  const phase = option("phase", "01-design");
  const file = join(runDir(id), `${phase}.json`);
  writeJson(file, { run_id: id, span_id: `${id}:${phase}`, phase, skill: option("skill", "delivery"), status: option("status", "pending"), decision_status: "open", module: moduleName, attempt: 1, started_at: now, completed_at: null, input_fingerprint: fingerprint(), input_artifacts: [], output_artifacts: [], decisions: [], actions: [], validation: [], requirements: [], detected_failure: null, likely_failure_origin: null, next_handoff: null, approval_gate: { status: "pending", approved_by: null, approved_at: null }, invalidated: false, environment: {} });
  console.log(`Created checkpoint ${phase} in ${id}`);
} else if (command === "handoff") {
  const id = option("run");
  const file = join(runDir(id), "run.json");
  if (!existsSync(file)) throw new Error("--run must identify an existing run");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  manifest.updated_at = now;
  manifest.next_action = option("next", manifest.next_action);
  manifest.handoff = { from: option("from", manifest.current_phase), to: option("to", "next-phase"), at: now, owner: option("owner", "delivery") };
  writeJson(file, manifest);
  console.log(`Recorded handoff for ${id}`);
} else if (command === "resume") {
  const id = option("run");
  const file = join(runDir(id), "run.json");
  if (!existsSync(file)) throw new Error("--run must identify an existing run");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const current = fingerprint();
  if (manifest.input_fingerprint && manifest.input_fingerprint !== current) {
    manifest.invalidated_phases = [...new Set([...(manifest.invalidated_phases ?? []), manifest.current_phase])];
    manifest.invalidation_reason = "Shared contract input fingerprint changed; downstream evidence requires revalidation.";
    manifest.status = "blocked";
    manifest.next_action = "Re-run affected checkpoints after reviewing the shared contract change.";
  }
  manifest.updated_at = now;
  writeJson(file, manifest);
  console.log(JSON.stringify({ run_id: id, status: manifest.status, invalidated_phases: manifest.invalidated_phases }, null, 2));
} else {
  const script = command === "validate" ? "validate-module-runs.mjs" : "report-module-runs.mjs";
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(process.execPath, [join(root, "scripts", script)], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
}
