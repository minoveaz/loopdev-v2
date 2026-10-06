import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name.startsWith("_") ? [] : walk(path);
    return entry.name === "delivery-ledger.json" ? [path] : [];
  });
}

const report = walk(join(root, "docs", "implementation")).map((file) => {
  const ledger = JSON.parse(readFileSync(file, "utf8"));
  const taskStatuses = Object.fromEntries(["pending", "ready", "in_progress", "done", "blocked"].map((status) => [status, ledger.tasks.filter((task) => task.status === status).length]));
  const platformCoverage = Object.fromEntries(["desktop_web", "mobile_web", "ios", "android"].map((platform) => {
    const required = ledger.capabilities.filter((capability) => capability.platforms?.[platform]?.required);
    const covered = required.filter((capability) => capability.task_ids.some((taskId) => ledger.tasks.find((task) => task.id === taskId)?.platforms.includes(platform)));
    return [platform, { required: required.length, planned: covered.length }];
  }));
  return {
    file: relative(root, file), suite: ledger.suite, module: ledger.module, status: ledger.status,
    requirements: ledger.requirements.length, capabilities: ledger.capabilities.length,
    tasks: { total: ledger.tasks.length, ...taskStatuses }, platform_coverage: platformCoverage,
    blockers: ledger.blockers,
  };
});
console.log(JSON.stringify(report, null, 2));