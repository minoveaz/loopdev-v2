import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { DeliveryStateMachine } from "./lib/delivery-state-machine.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const command = args[0];
const option = (name, fallback = null) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};
const moduleName = option("module");
const suite = option("suite");
const runId = option("run");
const machine = new DeliveryStateMachine(root);
const print = (value) => console.log(JSON.stringify(value, null, 2));
const context = () => {
  if (!suite || !moduleName || !runId) throw new Error("--suite, --module and --run are required");
  return { suite, moduleName, runId };
};
const phaseData = () => {
  const dataFile = option("data");
  return dataFile ? JSON.parse(readFileSync(join(root, dataFile), "utf8")) : {};
};

const commands = ["init", "start-phase", "complete-phase", "block", "approve", "handoff", "resume", "iterate", "inspect", "validate", "report"];
if (!command || !commands.includes(command)) {
  console.error(`Usage: delivery <${commands.join("|")}> --suite <suite> --module <module> [--run <run-id>]`);
  process.exit(2);
}

try {
  if (command === "init") {
    if (!suite || !moduleName) throw new Error("init requires --suite and --module");
    print(machine.initialize({ suite, moduleName, platformScope: option("platform-scope")?.split(","),
      profile: option("profile", "implementation-first"), sliceId: option("slice") }));
  } else if (command === "start-phase") {
    print(machine.startPhase({ ...context(), phaseId: option("phase"), skill: option("skill") }));
  } else if (command === "complete-phase") {
    print(machine.completePhase({ ...context(), phaseId: option("phase"), data: phaseData() }));
  } else if (command === "block") {
    print(machine.block({ ...context(), phaseId: option("phase"), reason: option("reason"), origin: option("origin") }));
  } else if (command === "approve") {
    print(machine.approve({ ...context(), gate: option("gate"), approvedBy: option("by"), role: option("role"),
      artifact: option("artifact"), artifactFingerprint: option("fingerprint"), source: option("source") }));
  } else if (command === "handoff") {
    print(machine.handoff({ ...context(), from: option("from"), to: option("to"), owner: option("owner", "delivery") }));
  } else if (command === "resume") {
    print(machine.resume({ ...context(), reason: option("reason") }));
  } else if (command === "iterate") {
    print(machine.iterate({ ...context(), reason: option("reason") }));
  } else if (command === "inspect") {
    print(machine.inspect(context()));
  } else {
    const script = command === "validate" ? "validate-module-runs.mjs" : "report-module-runs.mjs";
    const result = spawnSync(process.execPath, [join(root, "scripts", script)], { stdio: "inherit" });
    process.exitCode = result.status ?? 1;
  }
} catch (error) {
  console.error(`Delivery command failed: ${error.message}`);
  process.exitCode = 1;
}
