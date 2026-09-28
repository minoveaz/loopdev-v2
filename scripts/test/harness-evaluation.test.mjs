import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../..", import.meta.url);
const cases = JSON.parse(readFileSync(new URL("docs/03-platform/governance/harness-evaluation-cases.json", root)));
const workflow = JSON.parse(readFileSync(new URL("docs/03-platform/governance/delivery-workflow.json", root)));

test("held-out cases cover delivery gates and negative outcomes without claiming agent results", () => {
  assert.equal(cases.execution, "manual-isolated-checkout");
  assert.equal(cases.measurement.before_after_trials, "not_run");
  assert.deepEqual(cases.authority[0], "docs/03-platform/governance/delivery-workflow.json");
  assert.equal(new Set(cases.cases.map((entry) => entry.id)).size, cases.cases.length);
  assert.ok(cases.cases.length >= 5);
  for (const entry of cases.cases) {
    assert.ok(entry.trigger && entry.expected.length && entry.must_not.length && entry.evidence.length, entry.id);
  }
  for (const phase of ["00-discovery", "01-design", "07-build"]) {
    assert.ok(workflow.phases.some((entry) => entry.id === phase));
  }
  for (const gate of ["design", "plan"]) assert.ok(workflow.gates.includes(gate));
});
