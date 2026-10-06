-- Real CRM activity projections for Customer 360 and module timelines.
-- Events are append-only and scoped by organization through crm_activities RLS.

alter table public.crm_activities
  alter column lead_id drop not null,
  add column if not exists contact_id uuid references public.crm_contacts(id) on delete cascade,
  add column if not exists opportunity_id uuid references public.crm_opportunities(id) on delete cascade;

create index if not exists crm_activities_contact_idx
  on public.crm_activities(organization_id, contact_id, occurred_at desc)
  where contact_id is not null;
create index if not exists crm_activities_opportunity_idx
  on public.crm_activities(organization_id, opportunity_id, occurred_at desc)
  where opportunity_id is not null;

create or replace function public.project_crm_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_source_type text;
  target_source_id uuid;
  target_summary text;
  target_contact_id uuid;
  target_lead_id uuid;
  target_opportunity_id uuid;
begin
  target_source_type := case
    when tg_table_name = 'crm_contacts' then 'contact'
    when tg_table_name = 'crm_leads' then 'lead'
    when tg_table_name = 'crm_opportunities' then 'opportunity'
    else tg_table_name
  end;
  target_source_id := coalesce(new.id, old.id);
  target_contact_id := case when tg_table_name = 'crm_contacts' then target_source_id when tg_table_name = 'crm_leads' then coalesce(new.contact_id, old.contact_id) when tg_table_name = 'crm_opportunities' then coalesce(new.contact_id, old.contact_id) end;
  target_lead_id := case when tg_table_name = 'crm_leads' then target_source_id when tg_table_name = 'crm_opportunities' then coalesce(new.lead_id, old.lead_id) end;
  target_opportunity_id := case when tg_table_name = 'crm_opportunities' then target_source_id end;
  target_summary := case tg_op
    when 'INSERT' then initcap(replace(target_source_type, '_', ' ')) || ' created'
    when 'UPDATE' then initcap(replace(target_source_type, '_', ' ')) || ' updated'
    when 'DELETE' then initcap(replace(target_source_type, '_', ' ')) || ' deleted'
  end;

  insert into public.crm_activities (
    organization_id, lead_id, contact_id, opportunity_id, type, summary, details,
    actor_user_id, occurred_at, source_type, source_id, source_key, metadata
  ) values (
    coalesce(new.organization_id, old.organization_id), target_lead_id, target_contact_id,
    target_opportunity_id, 'status_change', target_summary, null, auth.uid(), now(),
    target_source_type, target_source_id, null,
    jsonb_build_object('operation', tg_op, 'table', tg_table_name)
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.project_crm_activity() from public;

drop trigger if exists crm_contacts_activity_projection on public.crm_contacts;
create trigger crm_contacts_activity_projection
after insert or update on public.crm_contacts
for each row execute function public.project_crm_activity();

drop trigger if exists crm_leads_activity_projection on public.crm_leads;
create trigger crm_leads_activity_projection
after insert or update on public.crm_leads
for each row execute function public.project_crm_activity();

drop trigger if exists crm_opportunities_activity_projection on public.crm_opportunities;
create trigger crm_opportunities_activity_projection
after insert or update on public.crm_opportunities
for each row execute function public.project_crm_activity();
