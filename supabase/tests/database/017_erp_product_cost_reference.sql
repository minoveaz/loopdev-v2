begin;

\ir helpers/rls_helpers.sql

select plan(10);

insert into auth.users (id, aud, role, email, encrypted_password, confirmed_at)
values
  ('00000000-0000-4000-8700-000000000081', 'authenticated', 'authenticated', 'cost-owner@example.test', '', now()),
  ('00000000-0000-4000-8700-000000000082', 'authenticated', 'authenticated', 'cost-viewer@example.test', '', now());

insert into public.organizations (id, name, slug)
values ('00000000-0000-4000-9700-000000000081', 'Product cost test', 'product-cost-test');

insert into public.organization_memberships (organization_id, user_id, role)
values
  ('00000000-0000-4000-9700-000000000081', '00000000-0000-4000-8700-000000000081', 'owner'),
  ('00000000-0000-4000-9700-000000000081', '00000000-0000-4000-8700-000000000082', 'viewer');

update public.erp_product_write_controls
   set enabled = true,
       security_gates_ready = true,
       reason_code = 'test_fixture',
       updated_at = now()
 where scope = 'global';

insert into public.erp_product_write_controls (scope, organization_id, enabled, reason_code)
values ('organization', '00000000-0000-4000-9700-000000000081', true, 'test_fixture');

set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000081');

insert into public.erp_catalogs (organization_id, key, name, kind, status)
values ('00000000-0000-4000-9700-000000000081', 'products', 'Products', 'products', 'active');

insert into public.erp_catalog_items (organization_id, catalog_id, type, name)
values (
  '00000000-0000-4000-9700-000000000081',
  (select id from public.erp_catalogs where organization_id = '00000000-0000-4000-9700-000000000081' and key = 'products'),
  'physical_product',
  'Costed product'
);

insert into public.erp_catalog_variants (organization_id, catalog_item_id, name)
values (
  '00000000-0000-4000-9700-000000000081',
  (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed product'),
  'Costed SKU'
);

select is(
  (public.save_erp_product_cost_reference(
    '00000000-0000-4000-9700-000000000081',
    (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed product'),
    (select id from public.erp_catalog_variants where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed SKU'),
    12.50, 'EUR', 0, 'cost-create-0001'
  )).version,
  1::bigint,
  'an owner can create a versioned SKU cost'
);

select is(
  (public.save_erp_product_cost_reference(
    '00000000-0000-4000-9700-000000000081',
    (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed product'),
    (select id from public.erp_catalog_variants where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed SKU'),
    12.50, 'EUR', 0, 'cost-create-0001'
  )).version,
  1::bigint,
  'retrying the same key returns the original result without another write'
);

select throws_ok(
  $$ select public.save_erp_product_cost_reference(
       '00000000-0000-4000-9700-000000000081',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed product'),
       (select id from public.erp_catalog_variants where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed SKU'),
       13.00, 'EUR', 0, 'cost-create-0001'
     ) $$,
  '40001',
  'PRODUCT_COST_CONFLICT',
  'an idempotency key cannot be reused with a different payload'
);

select throws_ok(
  $$ select public.save_erp_product_cost_reference(
       '00000000-0000-4000-9700-000000000081',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed product'),
       (select id from public.erp_catalog_variants where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed SKU'),
       13.00, 'EUR', 0, 'cost-stale-0001'
     ) $$,
  '40001',
  'PRODUCT_COST_CONFLICT',
  'a stale expected version is rejected'
);

select is(
  (public.save_erp_product_cost_reference(
    '00000000-0000-4000-9700-000000000081',
    (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed product'),
    (select id from public.erp_catalog_variants where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed SKU'),
    14.25, 'USD', 1, 'cost-update-0001'
  )).version,
  2::bigint,
  'a matching expected version permits an update'
);

select throws_ok(
  $$ select public.save_erp_product_cost_reference(
       '00000000-0000-4000-9700-000000000081',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed product'),
       (select id from public.erp_catalog_variants where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed SKU'),
       14.257, 'USD', 2, 'cost-scale-0001'
     ) $$,
  '22023',
  'Invalid purchase cost mutation',
  'amount precision is bounded to the stored currency scale'
);

select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000082');
select throws_ok(
  $$ select public.save_erp_product_cost_reference(
       '00000000-0000-4000-9700-000000000081',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed product'),
       (select id from public.erp_catalog_variants where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed SKU'),
       15.00, 'USD', 2, 'cost-denied-0001'
     ) $$,
  '42501',
  'Purchase cost management is not permitted',
  'a viewer cannot write purchase costs'
);

select is(
  (select count(*)::integer
     from public.erp_product_cost_references
    where organization_id = '00000000-0000-4000-9700-000000000081'),
  0,
  'a viewer cannot read purchase cost rows'
);

reset role;
update public.erp_product_write_controls
   set enabled = false,
       reason_code = 'test_fixture',
       updated_at = now()
 where scope = 'organization'
   and organization_id = '00000000-0000-4000-9700-000000000081';
set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000081');
select throws_ok(
  $$ select public.save_erp_product_cost_reference(
       '00000000-0000-4000-9700-000000000081',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed product'),
       (select id from public.erp_catalog_variants where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Costed SKU'),
       15.00, 'USD', 2, 'cost-control-0001'
     ) $$,
  '55000',
  'ERP_PRODUCT_WRITES_DISABLED',
  'cost mutations remain disabled until the write control is enabled'
);

select is(
  (select count(*)::integer
     from public.erp_product_cost_references
    where organization_id = '00000000-0000-4000-9700-000000000081'),
  1,
  'denied and conflicting operations do not create extra cost rows'
);

select * from finish();
rollback;
