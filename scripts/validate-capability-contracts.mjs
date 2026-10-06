import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const contractsRoot = join(root, "packages", "contracts", "src");
const errors = [];
const warnings = [];
const addError = (file, message) => errors.push(`${relative(root, file)}: ${message}`);
const read = (file) => readFileSync(file, "utf8");
const files = existsSync(contractsRoot)
  ? readdirSync(contractsRoot).filter((file) => file.endsWith(".ts")).map((file) => join(contractsRoot, file))
  : [];

if (!existsSync(contractsRoot)) addError(contractsRoot, "shared contract directory is missing");
if (!files.some((file) => file.endsWith("index.ts"))) addError(contractsRoot, "index.ts must export shared contracts");

const source = files.map((file) => ({ file, text: read(file) }));
const idPattern = /\bid\s*:\s*["'`]([^"'`]+)["'`]/g;
const ids = new Map();
for (const { file, text } of source) {
  const localIds = new Set();
  for (const match of text.matchAll(idPattern)) {
    const id = match[1];
    if (localIds.has(id)) addError(file, `duplicate stable id "${id}" in the same contract`);
    localIds.add(id);
  }
  if (/CapabilityContract|capabilityContract|Capability\s*[:=]/.test(text)) {
    const capabilityId = text.match(/\bid\s*:\s*["'`]([^"'`]+)["'`]/)?.[1];
    if (capabilityId) {
      if (ids.has(capabilityId)) addError(file, `duplicate capability id "${capabilityId}" also declared in ${relative(root, ids.get(capabilityId))}`);
      else ids.set(capabilityId, file);
    }
  }
}

for (const { file, text } of source) {
  const isCapability = /CapabilityContract|capabilityContract|Capability\s*[:=]/.test(text);
  if (isCapability) {
    for (const field of ["id", "owner", "actions", "states", "labels", "validation", "navigation", "permissions", "platforms"]) {
      if (!new RegExp(`\\b${field}\\s*:`).test(text)) addError(file, `capability contract is missing "${field}"`);
    }
  }
  if (text.includes("contactActions") && !file.endsWith("contact-actions.ts")) {
    if (!text.includes("from \"./contact-actions\"")) addError(file, "contactActions must be imported from the shared action contract");
  }
  if (text.includes("contactFormSections") && !file.endsWith("contact-form.ts") && !text.includes("from \"./contact-form\"")) {
    addError(file, "contactFormSections must be imported from the shared form contract");
  }
  if (/\b(const|let)\s+\w*(actions|Actions)\s*=\s*\[/.test(text) && !file.includes("contact-actions.ts") && !file.includes("-capability.ts")) {
    warnings.push(`${relative(root, file)}: local action array found; prefer a shared capability action catalog`);
  }
}

const rendererRoots = [join(root, "src"), join(root, "apps")];
function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") return walk(path);
    return entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name) ? [path] : [];
  });
}
for (const file of rendererRoots.flatMap(walk)) {
  const text = read(file);
  if (!/contact/i.test(file) && !/Contact Customer|Archive contact|Create contact/.test(text)) continue;
  const hasContactActions = /View Customer 360|Edit contact|Archive contact|Add note|Create task/.test(text);
  if (hasContactActions && !file.includes(`${join("src", "template")}`) && !/packages\/contracts\/src\/(?:contact-actions|contact-capability)/.test(text)) {
    addError(file, "Contacts renderer contains shared action labels but does not import the shared action/capability contract");
  }
}

if (errors.length) {
  console.error(`Capability contract validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Capability contract validation passed: ${files.length} contract file(s), ${ids.size} stable id(s).`);
  if (warnings.length) warnings.forEach((warning) => console.warn(`WARN: ${warning}`));
}
