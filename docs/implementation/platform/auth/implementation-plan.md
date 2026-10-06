# Platform Auth & Tenant Context Implementation Plan

## Inputs

- Product definition: `docs/implementation/platform/auth/HANDOFF.md`
- Design run: `MOD-AUTH-20260914-001`
- Track: `tracks/active/platform/2026-09-09-loopdev-v2-monorepo-multitenancy.md`
- Status: `ready_for_review`

---

## Environment Baseline

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout type | branch |
| Branch | `feature/crm-v2-foundation` |
| HEAD | `0423c81211993027f7ceb7894f8a7701edf5cfd1` |
| Runtime URL | desktop `http://localhost:5173`, mobile `http://localhost:8081` |
| Working tree | clean / modified documentation only |

---

## Ordered Work Breakdown (Phase 07-build)

| Task ID | Component / Area | Description | Target Files | Validation |
|---|---|---|---|---|
| **TASK-AUTH-001** | Shared Contracts | Implement neutral `AuthPort`, `TenantContextPort`, DTOs and `PlatformAuthStorage` | `packages/contracts/src/auth-port.ts`, `packages/contracts/src/index.ts` | `npm run typecheck` |
| **TASK-AUTH-002** | Web Supabase Adapter | Implement `SupabaseAuthAdapter` for browser runtime, managing tokens and subscriptions | `src/loopdev/domains/platform/adapter/auth-supabase.ts` | Unit tests |
| **TASK-AUTH-003** | Web Tenant Context | Implement `TenantContextProvider` with Super Admin directory support and atomic purge | `src/hooks/use-tenant-context.tsx`, `src/providers/TenantContextProvider.tsx` | Unit tests |
| **TASK-AUTH-004** | Web Hooks & Guards | Refactor `use-auth.tsx` and `ProtectedRoute.tsx` to consume `AuthPort` and `TenantContextPort` | `src/hooks/use-auth.tsx`, `src/components/layout/ProtectedRoute.tsx` | Route integration tests |
| **TASK-AUTH-005** | Web Topbar Integration | Embed Organization Selector in Topbar Account dropdown matching `desktop-account-org-selector.svg` | `src/components/layout/Topbar.tsx` | Visual / Component test |
| **TASK-AUTH-006** | Mobile Secure Adapter | Implement mobile `PlatformAuthStorage` adapter and mobile `AuthPort` without desktop DOM imports | `apps/mobile/adapters/auth.ts` | Mobile typecheck |
| **TASK-AUTH-007** | Mobile Account Sheet | Update `MobileAccountSheet.tsx` with organization switcher matching `mobile-account-sheet.svg` | `apps/mobile/components/MobileAccountSheet.tsx` | Component test |
| **TASK-AUTH-008** | Quality & Parity Suite | Execute quality suite, linting, tests, and delivery ledger validation | Test runners | `npm run test:quality` |

---

## Risks, Mitigations & Invariants

1. **Zero Cross-Tenant Leakage**:
   - Every tenant switch triggers `queryClient.clear()` synchronously, preventing stale cached data from rendering across organizations.
2. **Super Admin Isolation**:
   - Super Admin can list all platform organizations, but execution context is strictly bound to a single active `organizationId`.
3. **Password Recovery without SMTP**:
   - Local dev uses Inbucket; adapter returns graceful fallback (`email-service-unavailable` / CLI bypass instructions) without breaking application workflows.

