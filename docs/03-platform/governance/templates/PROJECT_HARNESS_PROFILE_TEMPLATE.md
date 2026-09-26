---
title: Project harness profile template
status: template
---

# Project Harness Profile

Use this template in a new repository after identifying its actual source of
truth. Delete guidance comments and replace bracketed values before adoption.

## Project and Runtime

| Concern | Decision |
|---|---|
| Product | [What the project delivers] |
| Runtime | [Runtime versions and supported environments] |
| Package manager | [Package manager and lockfile policy] |
| Primary stack | [Languages, frameworks and data stores] |

## Authority Precedence

1. [Current source, tests and runtime evidence].
2. [Project source-of-truth document].
3. [Delivery, security and Git contracts].
4. This profile and portable harness guidance.
5. External catalogs and integrations, only after explicit review and approval.

## Harness Surfaces

| Surface | Location | Owner | Boundary |
|---|---|---|---|
| Instructions | [Path] | [Owner] | [Scope and precedence] |
| Skills | [Path] | [Owner] | [Trigger, write scope and validation] |
| Agents | [Path] | [Owner] | [Mission and handoff] |
| Delivery state | [Path] | [Owner] | [Single state-machine authority] |
| Validation | [Path/commands] | [Owner] | [Read/write behavior] |

## Standard Validation Commands

| Purpose | Command |
|---|---|
| Harness structure | [Command] |
| Types and lint | [Command] |
| Tests | [Command] |
| Security or contract checks | [Command] |

## Security and Consent

- [Secret handling and prohibited files].
- [Actions requiring human approval].
- [Production, external-service and destructive-operation boundary].
- [Policy for hooks, MCP servers, local memory and always-on instructions].

## Git Policy

[Protected branches, branch naming, commit format, push and pull-request policy.]

## Current Constraints

- [Supported agent surfaces and known unsupported capabilities].
- [Known validation gaps, technical debt or environment limitations].
- [Explicit non-goals for the default harness].