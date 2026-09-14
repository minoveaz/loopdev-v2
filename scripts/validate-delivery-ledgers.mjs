import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { validateLedgerFile } from "./lib/delivery-ledger.mjs";

const root = process.cwd();

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "_templates" || entry.name === "_schemas" ? [] : walk(path);
    return entry.name === "delivery-ledger.json" ? [path] : [];
  });
}

const ledgers = walk(join(root, "docs", "implementation"));
const errors = ledgers.length ? ledgers.flatMap((file) => validateLedgerFile(root, file)) : ["docs/implementation: at least one delivery-ledger.json is required"];
if (errors.length) {
  console.error(`Delivery ledger validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Delivery ledger validation passed: ${ledgers.length} ledger(s) checked.`);
}