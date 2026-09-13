import { existsSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md",
  "docs/implementation/_templates/platform-scope.md",
  "docs/implementation/_templates/platform-evidence-matrix.md",
  "apps/mobile/package.json",
  "apps/mobile/package-lock.json",
];
const errors = [];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) errors.push(`missing required file: ${file}`);
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (!entry.isDirectory() || entry.name === "_templates" || entry.name === "runs") return [];
    return [path, ...walk(path)];
  });
}

for (const directory of walk(join(root, "docs", "implementation"))) {
  if (directory === join(root, "docs", "implementation")) continue;
  if (!existsSync(join(directory, "README.md"))) continue;
  for (const file of ["platform-scope.md", "platform-evidence-matrix.md"]) {
    if (!existsSync(join(directory, file))) {
      errors.push(`${relative(root, directory)}: missing ${file}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Multiplatform delivery validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log("Multiplatform delivery validation passed.");
}
