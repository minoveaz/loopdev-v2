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
];

for (const relativePath of requiredFiles) {
  if (!existsSync(join(root, relativePath))) {
    failures.push(`Missing required harness artifact: ${relativePath}`);
  } else {
    checks.push(relativePath);
  }
}

try {
  JSON.parse(readFileSync(join(root, "docs/03-platform/governance/delivery-workflow.json"), "utf8"));
  checks.push("delivery workflow JSON parses");
} catch (error) {
  failures.push(`Invalid delivery workflow JSON: ${error.message}`);
}

const skillsRoot = join(root, ".github/skills");
if (!existsSync(skillsRoot)) {
  failures.push("Missing .github/skills directory");
} else {
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
  }

  if (skillDirectories.length === 0) {
    warnings.push("No project skills were found");
  } else {
    checks.push(`${skillDirectories.length} skill(s) checked`);
  }
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
for (const command of ["harness:doctor", "validate:delivery-ledgers", "validate:module-runs"]) {
  if (!packageJson.scripts?.[command]) {
    failures.push(`Missing package script: ${command}`);
  }
}
checks.push("harness validation commands declared");

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