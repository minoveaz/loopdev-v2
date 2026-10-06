---
id: launchpad-multiplatform-contract
title: Launchpad Multiplatform Contract
status: proposed
version: 0.1.0
owner: platform
suite: launchpad
track: loopdev-v2-multiplatform-foundation
---

# Launchpad Multiplatform Contract

## 1. Purpose

Define the first LoopDev vertical slice across web desktop, web responsive, iOS and
Android. Launchpad is the authenticated entry point from which a user selects an
available suite or workspace.

This document defines the shared product contract and platform-specific surfaces. It
does not authorize a mobile implementation, persistence migration or a new suite that
has not been approved separately.

## 2. Current web baseline

The current web implementation provides:

- route: `/launchpad`;
- authenticated display name with an `Admin` fallback;
- a workspace-launcher header;
- a `SuiteCatalog` surface;
- links into the existing CRM workspace;
- responsive layout based on the current web shell.

Current evidence:

- `src/loopdev/pages/Launchpad.tsx`
- `src/routes/LoopdevRoutes.tsx`
- `src/app/navigation.ts`
- `src/loopdev/components/`

The baseline is evidence of existing behavior, not proof that the multiplatform contract
is complete.

## 3. Product outcome

An authenticated user must be able to:

1. identify the active organization and workspace context;
2. see only suites available to that user and organization;
3. understand why a suite is unavailable, when applicable;
4. open an available suite using a platform-appropriate navigation pattern;
5. recover from loading, empty, error, offline and permission states;
6. return to Launchpad without losing the active session or tenant context.

## 4. Shared domain contract

### 4.1 Context

```ts
type LaunchpadContext = {
  userId: string;
  organizationId: string;
  organizationName: string;
  membershipRole: "owner" | "admin" | "member" | "viewer";
  generatedAt: string;
};
```

`organizationId` is mandatory for every suite query. A client must not infer tenant
identity from a route, local storage value or a suite card.

### 4.2 Suite entry

```ts
type LaunchpadSuite = {
  id: string;
  key: string;
  name: string;
  description: string;
  iconKey: string;
  status: "available" | "coming_soon" | "disabled";
  entryPath: string;
  requiredPermission?: string;
  sortOrder: number;
};
```

Rules:

- `id` is stable and unique within the platform.
- `key` is a code identifier, not display text.
- `entryPath` is resolved by the client router and must not bypass authorization.
- `coming_soon` and `disabled` entries may be shown only when product explicitly
  approves discoverability for that suite.
- The server remains authoritative for availability and permissions.

### 4.3 Read contract

The future API/SDK operation is conceptually:

```text
getLaunchpadContext() -> {
  context: LaunchpadContext,
  suites: LaunchpadSuite[]
}
```

The concrete transport, endpoint and persistence model remain pending platform approval.
All clients must consume the same typed result rather than maintaining separate suite
catalogs.

### 4.4 Error categories

Clients must preserve machine-readable categories:

- `AUTH_REQUIRED`
- `TENANT_CONTEXT_REQUIRED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `NETWORK_ERROR`
- `SERVICE_UNAVAILABLE`
- `UNKNOWN_ERROR`

User-facing copy and presentation may differ by platform, but the category and recovery
behavior must remain consistent.

## 5. Platform surfaces

### 5.1 Web desktop

- Keep the current `/launchpad` route.
- Use the existing web shell and desktop information density.
- Support keyboard navigation and visible focus.
- Present suites as a responsive catalog with clear primary actions.

### 5.2 Web responsive

- Preserve the same route and context contract.
- Collapse the catalog into a single-column or compact grid layout.
- Keep suite name, availability and primary action visible without hover.
- Do not introduce mobile-only business rules.

### 5.3 iOS and Android

- Implement as one React Native + Expo application with platform-adapted navigation.
- Use a native navigation stack or tab pattern appropriate to the approved mobile shell.
- Use touch targets of at least 44 points/dp.
- Support safe areas, system back behavior, loading recovery and offline messaging.
- Do not render the web DOM or import web-only layout components.
- Keep the same context, suite, permission and error contracts.

## 6. Required states

| State | Shared meaning | Required behavior |
|---|---|---|
| Loading | Context or suites are being resolved | Show non-blocking progress and preserve shell context |
| Ready | At least one available suite exists | Show catalog and primary navigation actions |
| Empty | No suite is available for the tenant/user | Explain the state and provide a safe recovery or support action |
| Coming soon | Approved discoverable suite is not released | Show non-actionable status; do not create a fake route |
| Forbidden | Session exists but access is denied | Explain insufficient permission; do not expose protected data |
| Auth required | No valid session exists | Redirect to the platform login flow |
| Offline | Network unavailable with no valid cached result | Explain limited availability and provide retry |
| Stale | Cached result exists but refresh failed | Show cached data with an explicit stale indicator and retry |
| Error | Service or unexpected failure | Show recoverable error and correlation-safe support guidance |

## 7. Navigation contract

Launchpad is the platform entry point:

- web uses `/launchpad`;
- mobile uses the approved mobile route equivalent;
- suite entry must preserve `organizationId` and session context;
- unauthorized deep links must resolve through the same auth and permission guards;
- logout must clear active tenant and cached protected Launchpad data.

## 8. Security and tenancy requirements

- Never trust client-provided suite availability or organization identity.
- Resolve tenant membership server-side.
- Enforce tenant isolation in the backend/database layer.
- Do not place privileged credentials in web or mobile clients.
- Do not cache protected data across users or organizations.
- Audit suite-entry mutations or administrative actions when they are introduced.

## 9. Acceptance matrix

| Capability | Web desktop | Web responsive | iOS | Android |
|---|---:|---:|---:|---:|
| Authenticated entry | Required | Required | Required | Required |
| Tenant-aware context | Required | Required | Required | Required |
| Available suite catalog | Required | Required | Required | Required |
| Permission filtering | Required | Required | Required | Required |
| Loading state | Required | Required | Required | Required |
| Empty state | Required | Required | Required | Required |
| Error and retry | Required | Required | Required | Required |
| Offline/stale handling | Required | Required | Required | Required |
| Accessible keyboard/focus behavior | Required | Required | N/A | N/A |
| Touch-safe controls | N/A | Required | Required | Required |
| Native back behavior | N/A | N/A | Required | Required |

## 10. Implementation boundaries

The first implementation must introduce boundaries in this order:

1. shared schemas and result types;
2. an SDK/service interface for the Launchpad read operation;
3. a web adapter that preserves the existing baseline;
4. the mobile Expo app consuming the same interface;
5. backend persistence and RLS after the contract is approved.

Do not start by moving the entire web application or duplicating `SuiteCatalog` into a
mobile-specific web implementation.

## 11. Open decisions

- Final API transport and endpoint naming.
- Supabase versus server-side API ownership for the read operation.
- Cache lifetime and stale-data policy.
- Initial suite catalog and treatment of undisclosed suites.
- Mobile navigation shell and push/deep-link behavior.
- Exact design tokens and final copy.

## 12. Gate

This contract is complete for implementation only when:

- product approves the shared domain and states;
- platform approves tenancy, auth and error contracts;
- visual design covers all four surfaces;
- the initial suite catalog is explicitly approved;
- implementation evidence is linked to this document.
