begin;

\ir helpers/rls_helpers.sql

select plan(7);

insert into auth.users (id, aud, role, email, encrypted_password)
values ('00000000-0000-4000-8700-000000000092', 'authenticated', 'authenticated', 'physical-attributes-owner@example.test', '');

insert into public.organizations (id, name, slug)
values ('00000000-0000-4000-9700-000000000092', 'Physical attributes test', 'physical-attributes-test');

insert into public.organization_memberships (organization_id, user_id, role)
values ('00000000-0000-4000-9700-000000000092', '00000000-0000-4000-8700-000000000092', 'owner');

update public.erp_product_write_controls
   set enabled = true,
       security_gates_ready = true,
       reason_code = 'test_fixture',
       updated_at = now()
 where scope = 'global';

insert into public.erp_product_write_controls (scope, organization_id, enabled, reason_code)
values ('organization', '00000000-0000-4000-9700-000000000092', true, 'test_fixture');

set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000092');

select has_column('public', 'erp_catalog_items', 'physical_attributes', 'products have typed physical-attribute storage');
select has_column('public', 'erp_catalog_variants', 'physical_attributes', 'SKUs have independent physical-attribute storage');

insert into public.erp_catalogs (organization_id, key, name, kind, status)
values ('00000000-0000-4000-9700-000000000092', 'products', 'Products', 'products', 'active');

insert into public.erp_catalog_items (organization_id, catalog_id, type, name, physical_attributes)
values (
  '00000000-0000-4000-9700-000000000092',
  (select id from public.erp_catalogs where organization_id = '00000000-0000-4000-9700-000000000092' and key = 'products'),
  'physical_product',
  'Measured product',
  '{"weightKg":0.45,"lengthCm":18,"widthCm":12,"heightCm":5.5}'
);

insert into public.erp_catalog_variants (organization_id, catalog_item_id, name, status, physical_attributes)
values (
  '00000000-0000-4000-9700-000000000092',
  (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000092' and name = 'Measured product'),
  'Measured SKU',
  'draft',
  '{"weightKg":0.2,"lengthCm":10}'
);

select is(
  (select physical_attributes ->> 'weightKg' from public.erp_catalog_items
    where organization_id = '00000000-0000-4000-9700-000000000092' and name = 'Measured product'),
  '0.45',
  'product-managed measurements are stored as canonical kg/cm'
);

select is(
  (select physical_attributes ->> 'weightKg' from public.erp_catalog_variants
    where organization_id = '00000000-0000-4000-9700-000000000092' and name = 'Measured SKU'),
  '0.2',
  'SKU-managed measurements are stored independently'
);

select throws_ok(
  $$ update public.erp_catalog_items
        set physical_attributes = '{"weightKg":-0.1}'::jsonb
      where organization_id = '00000000-0000-4000-9700-000000000092' and name = 'Measured product' $$,
  '23514',
  null,
  'negative product measurements are rejected'
);

select throws_ok(
  $$ update public.erp_catalog_variants
        set physical_attributes = '{"lengthCm":"10"}'::jsonb
      where organization_id = '00000000-0000-4000-9700-000000000092' and name = 'Measured SKU' $$,
  '23514',
  null,
  'string SKU measurements are rejected'
);

select throws_ok(
  $$ update public.erp_catalog_items
        set physical_attributes = '{"weightKg":1,"unit":"lb"}'::jsonb
      where organization_id = '00000000-0000-4000-9700-000000000092' and name = 'Measured product' $$,
  '23514',
  null,
  'unknown fields cannot bypass canonical metric units'
);

select * from finish();
rollback;
