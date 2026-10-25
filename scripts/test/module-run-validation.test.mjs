import assert from "node:assert/strict";
import test from "node:test";
import { validateCurrentPhaseDependencies } from "../lib/module-run-validation.mjs";

test("ignores completed checkpoints invalidated by a newer run phase", () => {
  const manifest = { invalidated_phases: ["02-domain", "04-api"] };
  const checkpoints = new Map([
    ["02-domain", { status: "running", invalidated: false }],
    ["04-api", { status: "completed", invalidated: true }],
  ]);
  const phases = new Map([
    ["02-domain", { predecessors: [] }],
    ["04-api", { predecessors: ["02-domain"] }],
  ]);

  assert.deepEqual(validateCurrentPhaseDependencies(manifest, checkpoints, phases), []);
});

test("rejects a current completed checkpoint when its predecessor is invalidated", () => {
  const manifest = { invalidated_phases: ["02-domain"] };
  const checkpoints = new Map([
    ["02-domain", { status: "completed", invalidated: true }],
    ["04-api", { status: "completed", invalidated: false }],
  ]);
  const phases = new Map([
    ["02-domain", { predecessors: [] }],
    ["04-api", { predecessors: ["02-domain"] }],
  ]);

  assert.deepEqual(
    validateCurrentPhaseDependencies(manifest, checkpoints, phases),
    ['completed phase "04-api" requires completed predecessor "02-domain"'],
  );
});
