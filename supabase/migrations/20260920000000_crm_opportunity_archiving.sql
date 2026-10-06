-- CRM opportunity archiving for bulk table actions.

alter table public.crm_opportunities
  add column if not exists archived_at timestamptz;

create index if not exists crm_opportunities_active_idx
  on public.crm_opportunities (organization_id, updated_at desc)
  where archived_at is null;
