---
title: Agent harness architecture
status: current-governance
owner: platform
---

# Agent Harness Architecture

## Purpose

LoopDev uses an agent harness: the versioned combination of instructions,
skills, agents, executable checks and evidence that helps an AI assistant make
safe, repeatable changes. This document separates the portable parts of that
harness from LoopDev-specific delivery governance.

The objective is twofold:

1. improve agent effectiveness and safety for LoopDev; and
2. make the resulting practices reusable in future software projects without
   copying LoopDev product, Platform or delivery rules into them.

This document does not replace the delivery workflow. For a LoopDev module,
`delivery-workflow.json`, `MODULE_DELIVERY_AGENT_CONTRACT.md` and the
specialized skills remain authoritative.

## Authority and boundaries

| Layer | Purpose | Current source | Portability |
|---|---|---|---|
| Harness core | Common agent operating rules, skill quality, tool safety and validation discipline | This document and `harness-governance` | Portable |
| Project profile | Stack, commands, repository layout, tests, security constraints and team conventions | Project-local instructions and configuration | Portable pattern; project-specific content |
| LoopDev extension | Product sources, Platform reuse, Rivera UI, delivery phases, ledgers and multiplatform evidence | `.github/agents/`, `.github/skills/`, `docs/03-platform/governance/` | LoopDev only |

When the layers conflict, the more specific project contract wins. A portable
rule must never weaken a LoopDev approval gate, evidence requirement or safety
boundary.

## Core principles

1. **Evidence before claims.** Source, runtime output and focused tests are
   stronger evidence than instructions, plans or a green build alone.
2. **Progressive disclosure.** Keep always-on instructions short. Load a skill
   only when its task trigger applies; move detailed references and scripts out
   of its main body.
3. **One owner per decision.** A workflow has one authoritative state machine.
   Do not add a second lifecycle, ledger or approval system for the same work.
4. **Smallest useful autonomy.** Start with a direct answer or a deterministic
   workflow. Add delegation, memory, hooks or multi-agent orchestration only
   when a measured failure requires it.
5. **Explicit human control.** Require approval for destructive actions,
   secrets, production access, external publication, migrations, permission
   changes and scope expansion.
6. **Least privilege.** A skill must name the tools, files, services and write
   scope it needs. Prefer read-only inspection before mutation.
7. **Validation is part of the capability.** Every new skill, agent or tool has
   a cheap deterministic check and at least one realistic behavioural example.
8. **Portable by design.** Generic patterns describe roles and interfaces;
   project profiles provide stack commands and domain facts.

## Standard capability model

Every harness capability is classified before it is added:

| Type | Use for | Required contents |
|---|---|---|
| Instruction | Rules that apply to most work in one project | Narrow scope, precedence and exceptions |
| Skill | A repeatable task with a clear trigger | Trigger, inputs, steps, boundaries, output and validation |
| Agent | Isolated role requiring a distinct context or tool boundary | Mission, allowed tools, handoff and failure boundary |
| Prompt | One focused, parameterized operation | Inputs, output format and no persistent policy |
| Tool or MCP server | Deterministic access to data or an action | Schema, authorization, consent, errors and observability |
| Hook | A deterministic lifecycle guard | Idempotency, failure mode, opt-out, owner and test |

Do not use a hook when an instruction or validation command can achieve the
goal. Hooks are executable local code and require the same review discipline as
CI or application code.

## Minimum portable project profile

Each project adopting the core pattern should maintain a small, versioned
profile that answers:

```text
PROJECT_PROFILE
- purpose and supported repositories
- runtime, package manager and primary validation commands
- source-of-truth documents and precedence order
- protected branches and Git policy
- secrets, production and external-service boundaries
- approved tools and required human approvals
- skill catalog, owner, version and test status
- known constraints and unsupported agent surfaces
```

The profile is not a dumping ground for all documentation. It links to the
authoritative project files and records only information needed to operate the
harness safely.

## Evaluation and change policy

Before adopting or changing a capability:

1. state the observed problem and a measurable success criterion;
2. identify the owning project contract and any overlap with existing skills;
3. create a small representative evaluation set, including a failure or refusal
   case where relevant;
4. run the existing focused validation before and after the change;
5. record changed context cost, tool calls, failures and human approvals when
   the capability is used in a real task;
6. retain, revise or remove the capability based on evidence.

A capability is not accepted merely because an agent follows it in one demo.
It must not regress existing workflows, bypass project policy or add continuous
context without a measured benefit.

## LoopDev mapping

| Harness concern | LoopDev implementation | Improvement direction |
|---|---|---|
| Delivery lifecycle | `delivery-workflow.json` and `delivery-run.mjs` | Preserve as the sole state machine |
| Task specialization | `.github/skills/` | Add trigger precision, ownership and focused evaluations |
| Orchestration | `delivery.agent.md` | Keep module delivery isolated from generic coding work |
| Evidence and recovery | delivery ledgers, run checkpoints and validators | Repair legacy checkpoint validation and expose a concise status report |
| Environment checks | `scripts/doctor.mjs` | Evolve into a read-only harness doctor; do not auto-create credentials or mutate configuration |
| Tool access | shell, Git, Supabase and future integrations | Document privilege, consent, tenant isolation and destructive-operation boundaries |

## Near-term roadmap

1. Establish a read-only `harness:doctor` that reports configuration, skill
   metadata, authoritative contracts, validation availability and drift without
   creating files or contacting production by default.
2. Add a portable project-profile template plus a LoopDev profile that points to
   existing authoritative contracts rather than duplicating them.
3. Add metadata and behavioural checks for each LoopDev skill: trigger,
   write scope, required evidence, owner and validation command.
4. Create a small held-out evaluation corpus from real development requests:
   discovery, safe refactor, migration refusal, cross-tenant access review and
   multiplatform regression.
5. Only after measured benefit, evaluate opt-in local session handoff and
   project hooks. Neither is part of the default harness.

## Non-goals

- Installing an external harness wholesale.
- Replacing LoopDev delivery governance with generic FTD, SDD or agent lanes.
- Adding autonomous production access, secret handling or destructive hooks.
- Treating a passing typecheck, commit or generated document as functional
  evidence.