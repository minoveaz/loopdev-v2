import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

const sourceRoot = new URL("../..", import.meta.url).pathname;
const workflow = JSON.parse(readFileSync(join(sourceRoot, "docs/03-platform/governance/delivery-workflow.json")));

function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

test("doctor reports missing skill ownership and remains read-only", (context) => {
  const root = mkdtempSync(join(tmpdir(), "harness-doctor-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const script = join(root, "scripts/harness-doctor.mjs");
  mkdirSync(dirname(script), { recursive: true });
  cpSync(join(sourceRoot, "scripts/harness-doctor.mjs"), script);
  const required = [
    "AGENT_HARNESS_ARCHITECTURE.md", "LOOPDEV_HARNESS_PROFILE.md",
    "V2_DOCUMENTATION_SOURCE_OF_TRUTH.md", "MODULE_DELIVERY_AGENT_CONTRACT.md",
    "MODULE_DEVELOPMENT_TRACEABILITY.md", "GIT_WORKFLOW.md",
  ];
  for (const name of required) write(join(root, "docs/03-platform/governance", name), "# Fixture\n");
  write(join(root, "docs/03-platform/governance/delivery-workflow.json"), JSON.stringify(workflow));
  write(join(root, ".github/agents/delivery.agent.md"), "# Agent\n");
  for (const skill of new Set([...workflow.phases.map((phase) => phase.skill), "harness-governance"])) {
    write(join(root, ".github/skills", skill, "SKILL.md"),
      `---\nname: ${skill}\ndescription: Fixture\n---\n`);
  }
  write(join(root, "package.json"), JSON.stringify({ scripts: {
    "harness:doctor": "node scripts/harness-doctor.mjs",
    "evaluate:harness": "node scripts/evaluate-harness.mjs",
    "validate:delivery-ledgers": "node scripts/validate-delivery-ledgers.mjs",
    "validate:module-runs": "node scripts/validate-module-runs.mjs",
    "test:delivery": "node --test",
  } }));
  for (const entrypoint of ["scripts/evaluate-harness.mjs", "scripts/validate-delivery-ledgers.mjs", "scripts/validate-module-runs.mjs"]) {
    write(join(root, entrypoint), "// Fixture entrypoint\n");
  }
  const run = () => spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(run().status, 0);
  const missing = join(root, ".github/skills/module-build/SKILL.md");
  rmSync(missing);
  const failed = run();
  assert.equal(failed.status, 1);
  assert.match(failed.stdout, /Phase 07-build has no installed skill: module-build/);
  write(missing, "---\nname: module-build\ndescription: Fixture\n---\n");
  rmSync(join(root, "scripts/validate-module-runs.mjs"));
  assert.match(run().stdout, /Command validate:module-runs references missing entrypoint/);
  assert.equal(readFileSync(script, "utf8"), readFileSync(join(sourceRoot, "scripts/harness-doctor.mjs"), "utf8"));
});
