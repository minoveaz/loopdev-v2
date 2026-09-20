-- Make CRM projection triggers safe across tables with different record shapes.
-- The previous CASE expressions referenced NEW.contact_id on crm_contacts.

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

  if tg_table_name = 'crm_contacts' then
    target_contact_id := target_source_id;
  elsif tg_table_name = 'crm_leads' then
    target_contact_id := coalesce(new.contact_id, old.contact_id);
    target_lead_id := target_source_id;
  elsif tg_table_name = 'crm_opportunities' then
    target_contact_id := coalesce(new.contact_id, old.contact_id);
    target_lead_id := coalesce(new.lead_id, old.lead_id);
    target_opportunity_id := target_source_id;
  end if;

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
  entity_type := case
    when tg_table_name = 'crm_contacts' then 'contact'
    when tg_table_name = 'crm_leads' then 'lead'
    else 'opportunity'
  end;
  entity_id := coalesce(new.id, old.id);

  if tg_table_name = 'crm_contacts' then
    contact_id := entity_id;
  elsif tg_table_name = 'crm_leads' then
    lead_id := entity_id;
    contact_id := coalesce(new.contact_id, old.contact_id);
  elsif tg_table_name = 'crm_opportunities' then
    opportunity_id := entity_id;
    contact_id := coalesce(new.contact_id, old.contact_id);
    lead_id := coalesce(new.lead_id, old.lead_id);
  end if;

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
