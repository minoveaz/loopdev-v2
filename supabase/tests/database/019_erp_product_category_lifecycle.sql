begin;

\ir helpers/rls_helpers.sql

select plan(7);

insert into auth.users (id, aud, role, email, encrypted_password)
values ('00000000-0000-4000-8700-000000000091', 'authenticated', 'authenticated', 'category-owner@example.test', '');

insert into public.organizations (id, name, slug)
values ('00000000-0000-4000-9700-000000000091', 'Product category test', 'product-category-test');

insert into public.organization_memberships (organization_id, user_id, role)
values ('00000000-0000-4000-9700-000000000091', '00000000-0000-4000-8700-000000000091', 'owner');

update public.erp_product_write_controls
   set enabled = true,
       security_gates_ready = true,
       reason_code = 'test_fixture',
       updated_at = now()
 where scope = 'global';

insert into public.erp_product_write_controls (scope, organization_id, enabled, reason_code)
values ('organization', '00000000-0000-4000-9700-000000000091', true, 'test_fixture');

set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000091');

insert into public.erp_catalogs (organization_id, key, name, kind, status)
values ('00000000-0000-4000-9700-000000000091', 'products', 'Products', 'products', 'active');

insert into public.erp_product_references (organization_id, kind, key, name)
values ('00000000-0000-4000-9700-000000000091', 'category', 'pet-care', 'Pet care');

insert into public.erp_catalog_items (organization_id, catalog_id, type, name, category_key, status)
values (
  '00000000-0000-4000-9700-000000000091',
  (select id from public.erp_catalogs where organization_id = '00000000-0000-4000-9700-000000000091' and key = 'products'),
  'physical_product',
  'Assigned product',
  'pet-care',
  'active'
);

insert into public.erp_catalog_variants (organization_id, catalog_item_id, name, status, metadata)
values (
  '00000000-0000-4000-9700-000000000091',
  (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000091' and name = 'Assigned product'),
  'Assigned SKU',
  'active',
  '{"categoryKey":"pet-care"}'
);

select lives_ok(
  $$ update public.erp_product_references
        set status = 'archived'
      where organization_id = '00000000-0000-4000-9700-000000000091'
        and kind = 'category'
        and key = 'pet-care' $$,
  'an assigned category can be archived'
);

select is(
  (select category_key from public.erp_catalog_items
    where organization_id = '00000000-0000-4000-9700-000000000091'
      and name = 'Assigned product'),
  'pet-care',
  'archiving preserves existing product assignments'
);

select is(
  (select metadata ->> 'categoryKey' from public.erp_catalog_variants
    where organization_id = '00000000-0000-4000-9700-000000000091'
      and name = 'Assigned SKU'),
  'pet-care',
  'archiving preserves existing SKU assignments'
);

select throws_ok(
  $$ insert into public.erp_catalog_items (organization_id, catalog_id, type, name, category_key)
     values (
       '00000000-0000-4000-9700-000000000091',
       (select id from public.erp_catalogs where organization_id = '00000000-0000-4000-9700-000000000091' and key = 'products'),
       'physical_product',
       'New assignment',
       'pet-care'
     ) $$,
  '23503',
  'Product category must be active and in the same organization',
  'new assignments to an archived category are rejected'
);

select throws_ok(
  $$ insert into public.erp_catalog_variants (organization_id, catalog_item_id, name, status, metadata)
     values (
       '00000000-0000-4000-9700-000000000091',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000091' and name = 'Assigned product'),
       'New SKU assignment',
       'active',
       '{"categoryKey":"pet-care"}'
     ) $$,
  '23503',
  'SKU category must be active and in the same organization',
  'new SKU assignments to an archived category are rejected'
);

insert into public.erp_product_references (organization_id, kind, key, name)
values ('00000000-0000-4000-9700-000000000091', 'category', 'toys', 'Toys');

insert into public.erp_product_references (organization_id, kind, key, name, parent_id)
values (
  '00000000-0000-4000-9700-000000000091',
  'category',
  'cat-toys',
  'Cat toys',
  (select id from public.erp_product_references where organization_id = '00000000-0000-4000-9700-000000000091' and key = 'toys')
);

select throws_ok(
  $$ update public.erp_product_references
        set status = 'archived'
      where organization_id = '00000000-0000-4000-9700-000000000091'
        and kind = 'category'
        and key = 'toys' $$,
  '23514',
  'Move active child categories before archiving this category',
  'an active parent category cannot be archived while it has active children'
);

select is(
  (select status from public.erp_product_references
    where organization_id = '00000000-0000-4000-9700-000000000091'
      and kind = 'category'
      and key = 'toys'),
  'active',
  'failed parent archival leaves the category active'
);

select * from finish();
rollback;
