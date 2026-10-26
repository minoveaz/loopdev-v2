begin;

\ir helpers/rls_helpers.sql

select plan(17);

insert into auth.users (id, aud, role, email, encrypted_password, confirmed_at)
values
  ('00000000-0000-4000-8700-000000000041', 'authenticated', 'authenticated', 'erp-audit-owner@example.test', '', now()),
  ('00000000-0000-4000-8700-000000000042', 'authenticated', 'authenticated', 'erp-audit-agent-a@example.test', '', now()),
  ('00000000-0000-4000-8700-000000000043', 'authenticated', 'authenticated', 'erp-audit-agent-b@example.test', '', now());

insert into public.organizations (id, name, slug)
values
  ('00000000-0000-4000-9700-000000000041', 'ERP Audit A', 'erp-audit-a'),
  ('00000000-0000-4000-9700-000000000042', 'ERP Audit B', 'erp-audit-b');

insert into public.organization_memberships (organization_id, user_id, role)
values
  ('00000000-0000-4000-9700-000000000041', '00000000-0000-4000-8700-000000000041', 'owner'),
  ('00000000-0000-4000-9700-000000000041', '00000000-0000-4000-8700-000000000042', 'agent'),
  ('00000000-0000-4000-9700-000000000042', '00000000-0000-4000-8700-000000000043', 'agent');

insert into public.platform_administrators (user_id, role)
values ('00000000-0000-4000-8700-000000000041', 'owner');

select ok(
  not public.erp_product_writes_enabled('00000000-0000-4000-9700-000000000041'),
  'Products writes are disabled by default'
);
select is(
  (select security_gates_ready from public.erp_product_write_controls where scope = 'global'),
  true,
  'Products security gate is ready only after operation-specific RLS is installed'
);
select ok(
  not has_table_privilege('authenticated', 'public.erp_product_write_controls', 'select'),
  'authenticated users cannot read write-control state directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.erp_product_write_controls', 'update'),
  'authenticated users cannot update write-control state directly'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.set_erp_product_write_control(text,uuid,boolean,text)',
    'execute'
  ),
  'authenticated users can call the owner-checked write-control function'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.set_erp_product_write_control(text,uuid,boolean,text)',
    'execute'
  ),
  'anonymous users cannot call the write-control function'
);

set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000042');
select throws_ok(
  $$ select public.set_erp_product_write_control('global', null, true, 'test_enable') $$,
  '42501',
  'Only a Platform owner can change Products write controls',
  'catalog agents cannot change Platform write controls'
);
select throws_ok(
  $$ insert into public.erp_product_references (organization_id, kind, key, name)
     values ('00000000-0000-4000-9700-000000000041', 'category', 'disabled', 'Disabled') $$,
  '42501',
  'ERP Products writes are disabled by safety control',
  'the database guard rejects writes while controls are disabled'
);

reset role;
update public.erp_product_write_controls
   set enabled = true,
       security_gates_ready = true,
       reason_code = 'test_fixture',
       updated_at = now()
 where scope = 'global';
insert into public.erp_product_write_controls (scope, organization_id, enabled, reason_code)
values ('organization', '00000000-0000-4000-9700-000000000041', true, 'test_fixture');

set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000042');
select lives_ok(
  $$ insert into public.erp_product_references (organization_id, kind, key, name)
     values ('00000000-0000-4000-9700-000000000041', 'category', 'audit-target', 'Audit target') $$,
  'an authorized mutation succeeds after both write gates are enabled'
);
select is(
  (select count(*)::integer
     from public.platform_audit_events
    where organization_id = '00000000-0000-4000-9700-000000000041'
      and event_type = 'erp.product_references.insert'
      and entity_id = (
        select id::text from public.erp_product_references
         where organization_id = '00000000-0000-4000-9700-000000000041'
           and key = 'audit-target'
      )),
  1,
  'a successful product mutation appends an audit event'
);

select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000043');
select throws_ok(
  $$ insert into public.erp_product_references (organization_id, kind, key, name)
     values ('00000000-0000-4000-9700-000000000042', 'category', 'org-b', 'Organization B') $$,
  '42501',
  'ERP Products writes are disabled by safety control',
  'an enabled organization cannot write while another organization remains disabled'
);

select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000041');
select lives_ok(
  $$ select public.set_erp_product_write_control('global', null, false, 'test_disable') $$,
  'a Platform owner can disable the global write control'
);
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000042');
select throws_ok(
  $$ update public.erp_product_references
        set name = 'Must remain unchanged'
      where organization_id = '00000000-0000-4000-9700-000000000041'
        and key = 'audit-target' $$,
  '42501',
  'ERP Products writes are disabled by safety control',
  'global disable blocks writes even when the organization control is enabled'
);

select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000041');
select lives_ok(
  $$ select public.set_erp_product_write_control('global', null, true, 'test_enable') $$,
  'a Platform owner can re-enable writes after the security gate is ready'
);

reset role;
create or replace function public.test_reject_erp_product_audit()
returns trigger
language plpgsql
as $$
begin
  if new.event_type = 'erp.product_references.update' then
    raise exception 'test audit failure';
  end if;
  return new;
end;
$$;
create trigger test_reject_erp_product_audit
before insert on public.platform_audit_events
for each row execute function public.test_reject_erp_product_audit();

set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000042');
select throws_ok(
  $$ update public.erp_product_references
        set name = 'Must roll back'
      where organization_id = '00000000-0000-4000-9700-000000000041'
        and key = 'audit-target' $$,
  'P0001',
  'test audit failure',
  'an audit persistence failure rejects the product mutation'
);
reset role;

select is(
  (select name
     from public.erp_product_references
    where organization_id = '00000000-0000-4000-9700-000000000041'
      and key = 'audit-target'),
  'Audit target',
  'the product row remains unchanged when audit persistence fails'
);
select ok(
  exists (
    select 1
      from public.platform_audit_events
     where organization_id = '00000000-0000-4000-9700-000000000041'
       and event_type = 'erp.write_control.changed'
       and actor_user_id = '00000000-0000-4000-8700-000000000041'
  ),
  'Platform write-control changes are audited'
);

select * from finish();
rollback;
