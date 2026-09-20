alter table public.crm_leads
  add column if not exists archived_at timestamptz;

create index if not exists crm_leads_active_scope_idx
  on public.crm_leads(organization_id, updated_at desc)
  where archived_at is null;