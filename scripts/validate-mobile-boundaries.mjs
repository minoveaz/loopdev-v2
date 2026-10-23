import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = process.cwd();
const mobileRoot = join(root, "apps", "mobile");
const webRoot = join(root, "src");
const sharedLocaleDataRoot = join(webRoot, "i18n", "locales");
const errors = [];

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", ".expo", "dist", "web-build"].includes(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(?:js|jsx|ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function importedSpecifiers(source) {
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  return patterns.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]));
}

for (const file of walk(mobileRoot)) {
  for (const specifier of importedSpecifiers(readFileSync(file, "utf8"))) {
    const target = specifier.startsWith("@/")
      ? join(webRoot, specifier.slice(2))
      : specifier.startsWith(".") ? resolve(dirname(file), specifier) : null;
    // Locale JSON is shared content; mobile must not import executable src/ modules.
    const isSharedLocaleData = target?.startsWith(`${sharedLocaleDataRoot}${sep}`)
      && target.endsWith(".json");
    if (target && !isSharedLocaleData && (target === webRoot || target.startsWith(`${webRoot}${sep}`))) {
      errors.push(`${relative(root, file)} imports desktop runtime ${specifier}`);
    }
  }
}

if (errors.length) {
  console.error(`Mobile boundary validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log("Mobile boundary validation passed: apps/mobile has no imports from src/.");
}