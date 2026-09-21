# Communications Requirement Evidence Matrix

| Requirement | Evidence | Status | Next action |
|---|---|---|---|
| Shared Core/Inbox contract | `docs/06-product/communications/` | `PASS` | Keep as normative source |
| Tenant-scoped persistence and RLS | `supabase/migrations/20260829*`, `20260901*`, `20260907*`; tests `007-010` | `PARTIAL` | Execute against target Supabase project |
| Desktop authenticated tenant context | `src/loopdev/pages/crm/Communications.tsx` | `PARTIAL` | Validate remote reads and mutations |
| Mobile authenticated tenant and actor context | `apps/mobile/hooks/useMobileCommunications.ts` | `FAIL` | Remove hardcoded/local fallback for authenticated runtime |
| Server-side outbound dispatch | Direct `communication_messages` insert in Supabase adapter | `FAIL` | Add BFF/command/worker path |
| Settings reflects remote account state | `src/loopdev/pages/settings/Communications.tsx` | `FAIL` | Pass authenticated tenant context and remote adapter |
| UI regression coverage | Focused Vitest run | `FAIL` | Fix 11 failing tests and record output |
| Type safety | Desktop `npm run typecheck` | `PASS` | Preserve pending TS6 fix |
| Remote schema readiness | `20260925000000_communications_inbox_state.sql` present | `NOT_TESTED` | Verify migration history remotely |
