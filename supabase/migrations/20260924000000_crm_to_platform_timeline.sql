-- Project CRM mutations and existing activities into the canonical Platform Timeline.

create or replace function public.project_crm_to_platform_timeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entity_type text;
  entity_id uuid;
  contact_id uuid;
  lead_id uuid;
  opportunity_id uuid;
  source text;
  summary text;
begin
  entity_type := case when tg_table_name = 'crm_contacts' then 'contact' when tg_table_name = 'crm_leads' then 'lead' else 'opportunity' end;
  entity_id := coalesce(new.id, old.id);
  contact_id := case when tg_table_name = 'crm_contacts' then entity_id else coalesce(new.contact_id, old.contact_id) end;
  lead_id := case when tg_table_name = 'crm_leads' then entity_id when tg_table_name = 'crm_opportunities' then coalesce(new.lead_id, old.lead_id) end;
  opportunity_id := case when tg_table_name = 'crm_opportunities' then entity_id end;
  source := entity_type || ':' || entity_id::text || ':' || extract(epoch from clock_timestamp())::text;
  summary := initcap(replace(entity_type, '_', ' ')) || ' ' || lower(tg_op);

  insert into public.platform_timeline_events (
    organization_id, relation_type, relation_id, type, actor_id, actor_type, origin,
    source_type, source_id, dedupe_key, summary, metadata, occurred_at
  ) values (
    coalesce(new.organization_id, old.organization_id), entity_type, entity_id,
    case when tg_table_name = 'crm_opportunities' then 'stage_change' else 'assignment' end,
    auth.uid(), case when auth.uid() is null then 'system' else 'user' end, 'entity',
    entity_type, entity_id, source, summary,
    jsonb_build_object('operation', tg_op, 'table', tg_table_name, 'contact_id', contact_id, 'lead_id', lead_id, 'opportunity_id', opportunity_id), now()
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.project_crm_to_platform_timeline() from public;

drop trigger if exists crm_contacts_platform_timeline_projection on public.crm_contacts;
create trigger crm_contacts_platform_timeline_projection after insert or update on public.crm_contacts for each row execute function public.project_crm_to_platform_timeline();
drop trigger if exists crm_leads_platform_timeline_projection on public.crm_leads;
create trigger crm_leads_platform_timeline_projection after insert or update on public.crm_leads for each row execute function public.project_crm_to_platform_timeline();
drop trigger if exists crm_opportunities_platform_timeline_projection on public.crm_opportunities;
create trigger crm_opportunities_platform_timeline_projection after insert or update on public.crm_opportunities for each row execute function public.project_crm_to_platform_timeline();

-- Backfill the historical CRM activity read model into the canonical timeline.
insert into public.platform_timeline_events (
  organization_id, relation_type, relation_id, type, actor_id, actor_type, origin,
  source_type, source_id, dedupe_key, summary, metadata, occurred_at
)
select
  activity.organization_id,
  coalesce(activity.source_type, case when activity.opportunity_id is not null then 'opportunity' when activity.contact_id is not null then 'contact' else 'lead' end),
  coalesce(activity.source_id, activity.opportunity_id, activity.contact_id, activity.lead_id),
  activity.type,
  activity.actor_user_id,
  case when activity.actor_user_id is null then 'system' else 'user' end,
  'entity',
  coalesce(activity.source_type, activity.type),
  coalesce(activity.source_id, activity.opportunity_id, activity.contact_id, activity.lead_id),
  'crm-activity:' || activity.id::text,
  activity.summary,
  coalesce(activity.metadata, '{}'::jsonb),
  activity.occurred_at
from public.crm_activities activity
where coalesce(activity.source_id, activity.opportunity_id, activity.contact_id, activity.lead_id) is not null
on conflict (organization_id, dedupe_key) do nothing;
