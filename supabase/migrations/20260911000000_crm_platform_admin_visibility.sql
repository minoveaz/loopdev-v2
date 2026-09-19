-- Platform administrators may inspect and manage CRM data across organizations.
-- Normal users continue to use the organization/workspace policies defined by
-- the CRM security migrations.
do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'crm_contacts',
    'crm_companies',
    'crm_contact_companies',
    'crm_related_people',
    'crm_pipeline_stages',
    'crm_leads',
    'crm_lead_attributions',
    'crm_opportunities',
    'crm_activities',
    'crm_tasks',
    'crm_notes',
    'crm_contact_consents',
    'crm_audit_events',
    'crm_opportunity_products',
    'crm_contact_duplicate_reviews'
  ] loop
    policy_name := table_name || '_platform_admin_access';
    if to_regclass('public.' || table_name) is not null
      and not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = table_name
          and policyname = policy_name
      ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (public.is_platform_administrator()) with check (public.is_platform_administrator())',
        policy_name,
        table_name
      );
    end if;
  end loop;
end
$$;