create or replace function public.crm_convert_lead_to_opportunity(
  p_lead_id uuid,
  p_organization_id uuid,
  p_name text,
  p_amount numeric default null,
  p_currency text default 'EUR',
  p_stage_key text default 'qualified',
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_lead public.crm_leads%rowtype;
  existing_opportunity public.crm_opportunities%rowtype;
  created_opportunity public.crm_opportunities%rowtype;
begin
  if not public.has_organization_permission(p_organization_id, 'crm.manage') then raise exception 'CRM conversion is forbidden'; end if;
  select * into source_lead from public.crm_leads where id = p_lead_id and organization_id = p_organization_id and archived_at is null for update;
  if not found then raise exception 'Lead not found or archived'; end if;
  select * into existing_opportunity from public.crm_opportunities where organization_id = p_organization_id and lead_id = p_lead_id and origin = 'lead_conversion' order by created_at desc limit 1;
  if found then return jsonb_build_object('lead', to_jsonb(source_lead), 'opportunity', to_jsonb(existing_opportunity)); end if;
  insert into public.crm_opportunities (organization_id, contact_id, lead_id, product_key, name, stage_key, stage, amount, currency, assigned_to_user_id, version, origin, idempotency_key)
  values (p_organization_id, source_lead.contact_id, p_lead_id, lower(regexp_replace(trim(coalesce(source_lead.interest, 'converted-lead')), '\s+', '-', 'g')), coalesce(nullif(trim(p_name), ''), source_lead.interest, 'Converted opportunity'), p_stage_key, p_stage_key, p_amount, p_currency, source_lead.assigned_to_user_id, 1, 'lead_conversion', p_idempotency_key)
  returning * into created_opportunity;
  update public.crm_leads set status = 'convertido', stage = 'won', updated_at = now() where id = p_lead_id and organization_id = p_organization_id returning * into source_lead;
  return jsonb_build_object('lead', to_jsonb(source_lead), 'opportunity', to_jsonb(created_opportunity));
end;
$$;