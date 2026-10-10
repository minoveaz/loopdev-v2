begin;

select plan(8);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.quant_book_metrics'::regclass),
  'experimental Quant book metrics have RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.quant_system_health'::regclass),
  'experimental Quant system health has RLS enabled'
);
select ok(
  not exists (
    select 1
    from (values ('anon'::name), ('authenticated'::name)) as client_roles(role_name)
    cross join (values ('quant_book_metrics'::text), ('quant_system_health'::text)) as client_tables(table_name)
    cross join (values
      ('SELECT'::text), ('INSERT'::text), ('UPDATE'::text), ('DELETE'::text),
      ('TRUNCATE'::text), ('REFERENCES'::text), ('TRIGGER'::text)
    ) as table_privileges(privilege_name)
    where has_table_privilege(
      client_roles.role_name,
      format('public.%I', client_tables.table_name),
      table_privileges.privilege_name
    )
  ),
  'client roles have no direct privileges on experimental Quant tables'
);
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_activities'
      and policyname = 'crm_activities_shared_read'
  ),
  'obsolete shared CRM activity read policy is absent'
);
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_activities'
      and policyname = 'crm_activities_shared_append'
  ),
  'obsolete shared CRM activity append policy is absent'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_activities'
      and policyname = 'crm_activities_crm_read'
      and cmd = 'SELECT'
  ),
  'current CRM activity read policy remains in place'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_activities'
      and policyname = 'crm_activities_crm_insert'
      and cmd = 'INSERT'
  ),
  'current CRM activity insert policy remains in place'
);
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'crm_lead_attributions'
      and column_name = 'external_lead_id'
  ),
  'unversioned attribution external ID column is absent'
);

select * from finish();
rollback;
