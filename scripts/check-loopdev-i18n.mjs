import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const DEFAULT_ROOTS = ["src/loopdev", "apps/mobile"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORED_PARTS = new Set(["__tests__", "__snapshots__", "fixtures", "data", "assets", "node_modules"]);
const TECHNICAL_LITERAL = /^(?:[a-z][a-z0-9_]*(?:[.-][a-z0-9_]+)*|https?:\/\/|#[0-9a-f]{3,8}$|(?:bg|text|border|ring|flex|grid|items|justify|rounded|space|px|py|h|w|m|p|gap|sm|md|lg|xl|2xl)-)/i;
const jsxText = />\s*([^<>{}\n]{3,})\s*</g;
const visibleProps = /\b(?:title|description|placeholder|aria-label|label)\s*=\s*(["'`])([^"'`\n]{3,})\1/g;

function filesUnder(directory) {
  const absolute = resolve(directory);
  if (!statSync(absolute, { throwIfNoEntry: false })?.isDirectory()) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return IGNORED_PARTS.has(entry.name) ? [] : filesUnder(path);
    return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });
}

function isCommentOrImport(source, index) {
  const lineStart = source.lastIndexOf("\n", index - 1) + 1;
  const lineEnd = source.indexOf("\n", index) === -1 ? source.length : source.indexOf("\n", index);
  return /^\s*(?:import|export\s+type|\/\/|\*|\/\*|\*\/)/.test(source.slice(lineStart, lineEnd));
}

function looksLikeVisibleText(value) {
  const text = value.trim();
  if (!text || TECHNICAL_LITERAL.test(text)) return false;
  if (/[=?:;()[\]{}|&`]/.test(text) || /^\d+\s/.test(text)) return false;
  if (/^[A-Z_$][\w$]*(?:\.[A-Z_$][\w$]*)*$/.test(text) || /^[a-z]+(?:[A-Z][a-z]+)+$/.test(text)) return false;
  if (/^[\w./:-]+$/.test(text) && !/\s/.test(text)) return false;
  return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(text);
}

const findingsByFile = new Map();
function scanFile(file) {
  const source = readFileSync(file, "utf8");
  const findings = new Map();
  const add = (index, value, kind) => {
    if (!looksLikeVisibleText(value) || isCommentOrImport(source, index)) return;
    const line = source.slice(0, index).split("\n").length;
    findings.set(`${line}:${value.trim()}`, { line, value: value.trim(), kind });
  };
  for (const pattern of [jsxText, visibleProps]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source))) add(match.index, match[2] ?? match[1], pattern === jsxText ? "jsx-text" : "attribute");
  }
  return [...findings.values()];
}

const args = process.argv.slice(2);
const strictIndex = args.indexOf("--strict");
const strictRoot = strictIndex === -1 ? null : args[strictIndex + 1];
const roots = args.filter((value, index) => value !== "--strict" && args[index - 1] !== "--strict" && !value.startsWith("--"));
for (const root of roots.length ? roots : DEFAULT_ROOTS) {
  for (const file of filesUnder(root)) {
    const findings = scanFile(file);
    if (findings.length) findingsByFile.set(relative(process.cwd(), file), findings);
  }
}

const total = [...findingsByFile.values()].reduce((count, findings) => count + findings.length, 0);
console.log(`LoopDev i18n review: ${total} real visible-text candidate(s) in ${findingsByFile.size} file(s).`);
for (const [file, findings] of findingsByFile) {
  console.log(`\n${file} (${findings.length})`);
  findings.forEach((finding) => console.log(`- ${finding.line}: [${finding.kind}] ${finding.value}`));
}
if (strictRoot) {
  const normalizedRoot = strictRoot.replace(/\\/g, "/").replace(/\/$/, "");
  const strictTotal = [...findingsByFile.entries()]
    .filter(([file]) => file === normalizedRoot || file.startsWith(`${normalizedRoot}/`))
    .reduce((count, [, findings]) => count + findings.length, 0);
  console.log(`\nStrict scope ${normalizedRoot}: ${strictTotal} candidate(s).`);
  if (strictTotal > 0) process.exitCode = 1;
}