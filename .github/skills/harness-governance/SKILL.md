---
name: harness-governance
description: "Use when reviewing, designing, adding, removing, or validating agent instructions, skills, agents, prompts, hooks, MCP tools, or project harness governance."
user-invocable: true
---

# Harness Governance

Improve the project harness without creating duplicated workflows, permanent
context bloat or unaudited execution paths.

## Read first

1. `docs/03-platform/governance/AGENT_HARNESS_ARCHITECTURE.md`.
2. The target project's source-of-truth and Git workflow documents.
3. Existing instructions, skills, agents, prompts, hooks and validation scripts
   nearest to the requested change.

For LoopDev module delivery, also read and preserve
`delivery-workflow.json` and `MODULE_DELIVERY_AGENT_CONTRACT.md`. They override
this skill for module lifecycle, approvals and evidence.

## Capability decision

Classify the request before creating files:

| Need | Use |
|---|---|
| Always-applicable project rule | Instruction |
| Repeatable task with a distinct trigger | Skill |
| Isolated specialist or restricted tools | Agent |
| Single parameterized operation | Prompt |
| Deterministic data or action interface | Tool or MCP server |
| Enforced lifecycle behavior | Hook |

Choose the least invasive type. A hook requires a written reason why an
instruction, script or CI check is insufficient.

## Required analysis

For every proposed capability, record:

- user or engineering problem and success measure;
- intended trigger and explicit non-triggers;
- authoritative project contracts it must obey;
- read/write scope, tools, services and permissions;
- human approvals and failure behavior;
- existing capability overlap and a reuse, extension or rejection decision;
- focused validation and at least one realistic negative case;
- context and maintenance cost.

Do not install external catalogs, MCP servers, hooks, session memory or
always-on instructions without explicit approval of their exact file and
execution footprint.

## Delivery rules

1. Keep portable core practices separate from project-specific facts.
2. Prefer progressive disclosure: concise metadata, focused instructions and
   references loaded only when needed.
3. Keep one authority for every workflow state, ledger and approval gate.
4. Treat executable hooks, prompt-injected external content and tool responses
   as security-sensitive code.
5. Validate in an isolated checkout or sandbox before team-wide adoption.
6. Record version, license, owner, update path and rollback plan for third-party
   capabilities.
7. Never claim a harness improves outcomes without comparison evidence.

## Required output

Report the selected capability type, affected files, authority precedence,
security and consent implications, focused validation result, residual risks and
the next review point.

## Action boundaries

This skill may create or update harness documentation and configuration within
the approved scope. It must not silently modify Git hooks, install external
packages, connect external MCP servers, access secrets or replace LoopDev
delivery governance.