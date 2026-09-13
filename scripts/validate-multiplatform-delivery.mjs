import { existsSync, readdirSync, readFileSync } from "node:fs";
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
const statuses = new Set(["PASS", "PARTIAL", "FAIL", "NOT_TESTED", "N/A"]);

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
  const matrix = join(directory, "platform-evidence-matrix.md");
  if (!existsSync(matrix)) continue;
  const lines = readFileSync(matrix, "utf8").split(/\r?\n/);
  const header = lines.find((line) => line.trim().startsWith("|") && line.includes("Requirement"));
  const requiredColumns = ["Requirement", "Desktop web evidence", "Mobile web evidence", "Shared contract", "Status", "Owner", "Gap/next action"];
  if (!header) {
    errors.push(`${relative(root, matrix)}: evidence matrix must contain a markdown table header`);
    continue;
  }
  for (const column of requiredColumns) if (!header.includes(column)) errors.push(`${relative(root, matrix)}: missing required column "${column}"`);
  const matrixLines = lines.slice(0, Math.max(1, lines.findIndex((line) => line.startsWith("## Runtime snapshot"))));
  const rows = matrixLines.filter((line) => line.trim().startsWith("|") && !line.includes("---") && !line.includes("Requirement"));
  if (!rows.length) errors.push(`${relative(root, matrix)}: evidence matrix must contain at least one requirement row`);
  rows.forEach((row, index) => {
    const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
    const statusIndex = header.split("|").findIndex((cell) => cell.trim() === "Status") - 1;
    const status = cells[statusIndex];
    if (!status || !statuses.has(status)) errors.push(`${relative(root, matrix)} row ${index + 1}: invalid status "${status ?? ""}"`);
    if (!cells[0] || /^\[.*\]$/.test(cells[0])) errors.push(`${relative(root, matrix)} row ${index + 1}: requirement is required`);
    if (!cells[1] || /^\[.*\]$/.test(cells[1])) errors.push(`${relative(root, matrix)} row ${index + 1}: desktop evidence is required`);
    if (!cells[2] || /^\[.*\]$/.test(cells[2])) errors.push(`${relative(root, matrix)} row ${index + 1}: mobile web evidence is required`);
    const contractIndex = header.split("|").findIndex((cell) => cell.trim() === "Shared contract") - 1;
    if (!cells[contractIndex] || /^\[.*\]$/.test(cells[contractIndex])) errors.push(`${relative(root, matrix)} row ${index + 1}: shared contract path is required`);
    const ownerIndex = header.split("|").findIndex((cell) => cell.trim() === "Owner") - 1;
    const followUpIndex = header.split("|").findIndex((cell) => cell.trim() === "Gap/next action") - 1;
    if (["NOT_TESTED", "N/A"].includes(status) && (!cells[ownerIndex] || !cells[followUpIndex] || /^(none|n\/a|-|planned)$/i.test(cells[followUpIndex]))) {
      errors.push(`${relative(root, matrix)} row ${index + 1}: ${status} requires an owner and follow-up`);
    }
    if (status === "PASS" && !/(commit|timestamp|runtime|http|test)/i.test(row)) {
      errors.push(`${relative(root, matrix)} row ${index + 1}: PASS requires commit, timestamp, runtime or test evidence`);
    }
  });
  const snapshot = lines.findIndex((line) => /Validation timestamp/i.test(line));
  if (snapshot < 0) errors.push(`${relative(root, matrix)}: runtime snapshot requires a validation timestamp`);
}

if (errors.length > 0) {
  console.error(`Multiplatform delivery validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log("Multiplatform delivery validation passed.");
}
