begin;

revoke all on table public.quant_book_metrics from anon, authenticated;
revoke all on table public.quant_system_health from anon, authenticated;

alter table public.quant_book_metrics enable row level security;
alter table public.quant_system_health enable row level security;

drop policy if exists crm_activities_shared_read on public.crm_activities;
drop policy if exists crm_activities_shared_append on public.crm_activities;

alter table public.crm_lead_attributions
  drop column if exists external_lead_id;

commit;
