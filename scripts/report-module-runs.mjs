import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";

const root = process.cwd();
const runsRoots = [
  join(root, "docs", "implementation"),
  join(root, "docs", "06-product"),
];
const checkpoints = [];
const workflow = JSON.parse(readFileSync(join(root, "docs/03-platform/governance/delivery-workflow.json"), "utf8"));
const phaseFiles = new Set(workflow.phases.map((phase) => `${phase.id}.json`));

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.name.endsWith(".json") ? [path] : [];
  });
}

for (const file of runsRoots.flatMap((runsRoot) => walk(runsRoot))) {
  if (
    !file.includes(`${sep}runs${sep}`) &&
    !file.includes(`${sep}development-runs${sep}`) &&
    !file.includes(`${sep}module-runs${sep}`)
  ) {
    continue;
  }
  if (!phaseFiles.has(file.slice(file.lastIndexOf(sep) + 1))) continue;
  try {
    checkpoints.push(JSON.parse(readFileSync(file, "utf8")));
  } catch {
    // The validator is responsible for reporting malformed JSON.
  }
}

const count = (predicate) => checkpoints.filter(predicate).length;
const validationEntries = checkpoints.flatMap((checkpoint) =>
  Array.isArray(checkpoint.validation) ? checkpoint.validation : [],
);
const requirements = checkpoints.flatMap((checkpoint) =>
  Array.isArray(checkpoint.requirements) ? checkpoint.requirements : [],
);
const attempts = checkpoints.reduce(
  (total, checkpoint) => total + (Number.isInteger(checkpoint.attempt) ? checkpoint.attempt : 1),
  0,
);

const report = {
  checkpoint_count: checkpoints.length,
  phase_status: {
    completed: count((checkpoint) => checkpoint.status === "completed"),
    blocked: count((checkpoint) => checkpoint.status === "blocked"),
    failed: count((checkpoint) => checkpoint.status === "failed"),
    deviated: count((checkpoint) => checkpoint.status === "deviated"),
    pending: count((checkpoint) => checkpoint.status === "pending"),
  },
  attempts,
  detected_failures: count((checkpoint) => checkpoint.detected_failure != null),
  validation: {
    passed: validationEntries.filter((entry) => entry.result === "passed").length,
    failed: validationEntries.filter((entry) => entry.result === "failed").length,
  },
  requirements: {
    pass: requirements.filter((requirement) => requirement.status === "PASS").length,
    partial: requirements.filter((requirement) => requirement.status === "PARTIAL").length,
    fail: requirements.filter((requirement) => requirement.status === "FAIL").length,
    not_tested: requirements.filter((requirement) => requirement.status === "NOT_TESTED").length,
  },
};

console.log(JSON.stringify(report, null, 2));
