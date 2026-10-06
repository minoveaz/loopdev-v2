import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const evidenceTypes = new Set(["command_result", "test_result", "runtime_journey", "screenshot", "manual_approval"]);
const platforms = new Set(["shared", "desktop_web", "mobile_web", "ios", "android"]);

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.name.endsWith(".json") ? [path] : [];
  });
}

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

export function checksum(file) {
  return `sha256:${createHash("sha256").update(readFileSync(file)).digest("hex")}`;
}

export function collectRequirementIds(root) {
  const files = walk(join(root, "docs", "implementation")).filter((file) => file.endsWith("delivery-ledger.json"));
  const ids = new Set();
  for (const file of files) {
    const ledger = JSON.parse(readFileSync(file, "utf8"));
    for (const requirement of ledger.requirements ?? []) ids.add(requirement.id);
  }
  return ids;
}

export function collectTasks(root) {
  const files = walk(join(root, "docs", "implementation")).filter((file) => file.endsWith("delivery-ledger.json"));
  const tasks = new Map();
  for (const file of files) {
    const ledger = JSON.parse(readFileSync(file, "utf8"));
    for (const task of ledger.tasks ?? []) tasks.set(task.id, task);
  }
  return tasks;
}

export function validateEvidence(root, options = {}) {
  const errors = [];
  const head = options.head ?? git(root, ["rev-parse", "HEAD"]);
  const worktreeClean = options.worktreeClean ?? git(root, ["status", "--porcelain"]) === "";
  const requirementIds = options.requirementIds ?? collectRequirementIds(root);
  const tasks = options.tasks ?? collectTasks(root);
  const evidenceFiles = options.files ?? walk(join(root, "docs", "implementation")).filter((file) => file.includes(`${sep}evidence${sep}`));
  const evidencedTaskIds = new Set();

  for (const file of evidenceFiles) {
    let records;
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8"));
      records = Array.isArray(parsed) ? parsed : parsed.evidence;
    } catch (error) {
      errors.push(`${relative(root, file)}: invalid JSON (${error.message})`);
      continue;
    }
    if (!Array.isArray(records)) {
      errors.push(`${relative(root, file)}: evidence file must contain an array or an evidence array`);
      continue;
    }
    for (const [index, record] of records.entries()) {
      const prefix = `${relative(root, file)} record ${index + 1}`;
      if (!record || typeof record !== "object") {
        errors.push(`${prefix}: evidence must be an object`);
        continue;
      }
      for (const field of ["type", "created_at", "commit", "platform", "requirement_id", "task_id"]) {
        if (!record[field]) errors.push(`${prefix}: missing ${field}`);
      }
      if (!evidenceTypes.has(record.type)) errors.push(`${prefix}: invalid type "${record.type ?? ""}"`);
      if (!platforms.has(record.platform)) errors.push(`${prefix}: invalid platform "${record.platform ?? ""}"`);
      if (!requirementIds.has(record.requirement_id)) errors.push(`${prefix}: unknown requirement "${record.requirement_id ?? ""}"`);
      const task = tasks.get(record.task_id);
      if (!task) errors.push(`${prefix}: unknown task "${record.task_id ?? ""}"`);
      else if (!task.requirement_ids?.includes(record.requirement_id)) errors.push(`${prefix}: requirement "${record.requirement_id}" is not covered by task "${record.task_id}"`);
      else evidencedTaskIds.add(record.task_id);
      if (record.commit !== head) errors.push(`${prefix}: commit must equal current HEAD ${head}`);
      if (!/^\d{4}-\d{2}-\d{2}T/.test(record.created_at ?? "")) errors.push(`${prefix}: created_at must be an ISO timestamp`);
      if (["command_result", "test_result"].includes(record.type) && (!record.command || !Number.isInteger(record.exit_code))) errors.push(`${prefix}: ${record.type} requires command and integer exit_code`);
      if (["command_result", "test_result"].includes(record.type) && record.exit_code !== 0) errors.push(`${prefix}: non-zero exit_code cannot be accepted as PASS evidence`);
      if (record.type === "runtime_journey" && (!record.url || !record.path)) errors.push(`${prefix}: runtime_journey requires url and path`);
      if (record.type === "screenshot" && !record.path) errors.push(`${prefix}: screenshot requires path`);
      if (record.path) {
        const artifact = join(root, record.path);
        if (!existsSync(artifact)) errors.push(`${prefix}: artifact path does not exist: ${record.path}`);
        else if (record.checksum !== checksum(artifact)) errors.push(`${prefix}: checksum does not match artifact`);
      }
    }
  }
  for (const task of tasks.values()) {
    if (task.status === "done" && ["E4_JOURNEY", "E5_DEVICE"].includes(task.evidence_level) && !evidencedTaskIds.has(task.id)) {
      errors.push(`completed task "${task.id}" requires structured ${task.evidence_level} evidence`);
    }
  }
  if (evidenceFiles.length && !worktreeClean) errors.push("runtime evidence requires a clean worktree so it can be attributed to the recorded commit");
  return { errors, evidenceFiles };
}