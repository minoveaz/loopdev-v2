#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const failures = [];
const warnings = [];
const checks = [];

const requiredFiles = [
  "docs/03-platform/governance/AGENT_HARNESS_ARCHITECTURE.md",
  "docs/03-platform/governance/LOOPDEV_HARNESS_PROFILE.md",
  "docs/03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md",
  "docs/03-platform/governance/delivery-workflow.json",
  ".github/agents/delivery.agent.md",
  ".github/skills/harness-governance/SKILL.md",
  "docs/03-platform/governance/MODULE_DELIVERY_AGENT_CONTRACT.md",
  "docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md",
  "docs/03-platform/governance/GIT_WORKFLOW.md",
];

for (const relativePath of requiredFiles) {
  if (!existsSync(join(root, relativePath))) {
    failures.push(`Missing required harness artifact: ${relativePath}`);
  } else {
    checks.push(relativePath);
  }
}

let workflow;
try {
  workflow = JSON.parse(readFileSync(join(root, "docs/03-platform/governance/delivery-workflow.json"), "utf8"));
  if (!Array.isArray(workflow.phases) || !Array.isArray(workflow.gates)) throw new Error("missing phases or gates");
  checks.push("delivery workflow structure parses");
} catch (error) {
  failures.push(`Invalid delivery workflow JSON: ${error.message}`);
}

const skillsRoot = join(root, ".github/skills");
if (!existsSync(skillsRoot)) {
  failures.push("Missing .github/skills directory");
} else {
  const availableSkills = new Set();
  const skillDirectories = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const skillName of skillDirectories) {
    const skillFile = join(skillsRoot, skillName, "SKILL.md");
    if (!existsSync(skillFile)) {
      failures.push(`Skill ${skillName} is missing SKILL.md`);
      continue;
    }

    const content = readFileSync(skillFile, "utf8");
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatter) {
      failures.push(`Skill ${skillName} is missing YAML frontmatter`);
      continue;
    }

    const declaredName = frontmatter[1].match(/^name:\s*([^\n]+)$/m)?.[1]?.trim();
    const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
    if (declaredName !== skillName) {
      failures.push(`Skill ${skillName} declares name ${declaredName || "<missing>"}`);
    }
    if (!description) {
      failures.push(`Skill ${skillName} is missing a description`);
    }
    if (declaredName === skillName && description) availableSkills.add(skillName);
  }

  if (workflow) {
    const phaseIds = new Set();
    for (const phase of workflow.phases) {
      if (phaseIds.has(phase.id)) failures.push(`Duplicate delivery phase: ${phase.id}`);
      phaseIds.add(phase.id);
      if (!availableSkills.has(phase.skill)) failures.push(`Phase ${phase.id} has no installed skill: ${phase.skill}`);
      if (phase.required_gate && !workflow.gates.includes(phase.required_gate)) failures.push(`Phase ${phase.id} has unknown gate: ${phase.required_gate}`);
    }
    for (const phase of workflow.phases) {
      for (const predecessor of phase.predecessors ?? []) {
        if (!phaseIds.has(predecessor)) failures.push(`Phase ${phase.id} has unknown predecessor: ${predecessor}`);
      }
    }
  }

  if (skillDirectories.length === 0) {
    warnings.push("No project skills were found");
  } else {
    checks.push(`${skillDirectories.length} skill(s) checked`);
  }
}

let packageJson;
try {
  packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
} catch (error) {
  failures.push(`Missing or invalid package.json: ${error.message}`);
}
for (const command of ["harness:doctor", "evaluate:harness", "validate:delivery-ledgers", "validate:module-runs", "test:delivery"]) {
  if (!packageJson?.scripts?.[command]) {
    failures.push(`Missing package script: ${command}`);
    continue;
  }
  const entrypoint = packageJson.scripts[command].match(/^node (?:--test )?(scripts\/[^\s]+\.mjs)/)?.[1];
  if (entrypoint && !existsSync(join(root, entrypoint))) failures.push(`Command ${command} references missing entrypoint: ${entrypoint}`);
}
if (packageJson) checks.push("harness validation commands declared");

console.log("LoopDev Harness Doctor");
for (const check of checks) console.log(`PASS ${check}`);
for (const warning of warnings) console.log(`WARN ${warning}`);
for (const failure of failures) console.log(`FAIL ${failure}`);

if (failures.length) {
  console.log(`Harness doctor failed: ${failures.length} issue(s)`);
  process.exitCode = 1;
} else {
  console.log("Harness doctor passed");
}