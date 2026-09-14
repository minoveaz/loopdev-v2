import { validateEvidence } from "./lib/delivery-evidence.mjs";

const { errors, evidenceFiles } = validateEvidence(process.cwd());
if (errors.length) {
  console.error(`Delivery evidence validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Delivery evidence validation passed: ${evidenceFiles.length} evidence file(s) checked.`);
}