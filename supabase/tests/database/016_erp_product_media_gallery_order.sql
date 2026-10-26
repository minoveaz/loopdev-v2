begin;

\ir helpers/rls_helpers.sql

select plan(21);

insert into auth.users (id, aud, role, email, encrypted_password, confirmed_at)
values
  ('00000000-0000-4000-8700-000000000061', 'authenticated', 'authenticated', 'media-order-owner@example.test', '', now()),
  ('00000000-0000-4000-8700-000000000062', 'authenticated', 'authenticated', 'media-order-viewer@example.test', '', now());

insert into public.organizations (id, name, slug)
values ('00000000-0000-4000-9700-000000000061', 'Media order test', 'media-order-test');

insert into public.organization_memberships (organization_id, user_id, role)
values
  ('00000000-0000-4000-9700-000000000061', '00000000-0000-4000-8700-000000000061', 'owner'),
  ('00000000-0000-4000-9700-000000000061', '00000000-0000-4000-8700-000000000062', 'viewer');

update public.erp_product_write_controls
   set enabled = true,
       security_gates_ready = true,
       reason_code = 'test_fixture',
       updated_at = now()
 where scope = 'global';

insert into public.erp_product_write_controls (scope, organization_id, enabled, reason_code)
values ('organization', '00000000-0000-4000-9700-000000000061', true, 'test_fixture');

set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000061');

select lives_ok(
  $$ insert into public.erp_catalogs (organization_id, key, name, kind, status)
     values ('00000000-0000-4000-9700-000000000061', 'products', 'Products', 'products', 'active') $$,
  'the media gallery fixture has an organization catalog'
);
select lives_ok(
  $$ insert into public.erp_catalog_items (organization_id, catalog_id, type, name)
     values (
       '00000000-0000-4000-9700-000000000061',
       (select id from public.erp_catalogs where organization_id = '00000000-0000-4000-9700-000000000061' and key = 'products'),
       'physical_product',
       'Media order product'
     ) $$,
  'the media gallery fixture has a product'
);
select lives_ok(
  $$ insert into public.erp_catalog_variants (organization_id, catalog_item_id, name)
     values (
       '00000000-0000-4000-9700-000000000061',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000061' and name = 'Media order product'),
       'Media order SKU'
     ) $$,
  'the media gallery fixture has a SKU'
);

reset role;
select set_config('request.jwt.claim.role', 'service_role', true);
set local role service_role;
insert into public.platform_files (
  organization_id, name, category, source, media_type, size, relation_type, relation_id, storage_path
) values
  ('00000000-0000-4000-9700-000000000061', 'media-one.jpg', 'product', 'upload', 'image/jpeg', 1,
   'product_media_library', '00000000-0000-4000-9700-000000000061',
   'organizations/00000000-0000-4000-9700-000000000061/product-media/media-one.jpg'),
  ('00000000-0000-4000-9700-000000000061', 'media-two.jpg', 'product', 'upload', 'image/jpeg', 1,
   'product_media_library', '00000000-0000-4000-9700-000000000061',
   'organizations/00000000-0000-4000-9700-000000000061/product-media/media-two.jpg');
reset role;
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000061');
select is(
  (select count(*)::integer from public.platform_files
    where organization_id = '00000000-0000-4000-9700-000000000061'
      and relation_type = 'product_media_library'),
  2,
  'the server fixture provides two reusable Platform Files'
);

insert into public.erp_product_media_assets (id, organization_id, file_id)
values
  ('00000000-0000-4000-9700-000000000061', '00000000-0000-4000-9700-000000000061',
   (select id from public.platform_files where organization_id = '00000000-0000-4000-9700-000000000061' and name = 'media-one.jpg')),
  ('00000000-0000-4000-9700-000000000062', '00000000-0000-4000-9700-000000000061',
   (select id from public.platform_files where organization_id = '00000000-0000-4000-9700-000000000061' and name = 'media-two.jpg'));

insert into public.erp_product_media_assignments (
  id, organization_id, asset_id, catalog_item_id, alt_text, position
)
values (
  '00000000-0000-4000-9700-000000000071',
  '00000000-0000-4000-9700-000000000061',
  '00000000-0000-4000-9700-000000000061',
  (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000061' and name = 'Media order product'),
  'Main product image',
  99
);

insert into public.erp_product_media_assignments (
  id, organization_id, asset_id, catalog_item_id, alt_text, position
)
values (
  '00000000-0000-4000-9700-000000000072',
  '00000000-0000-4000-9700-000000000061',
  '00000000-0000-4000-9700-000000000062',
  (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000061' and name = 'Media order product'),
  'Second product image',
  99
);

insert into public.erp_product_media_assignments (
  id, organization_id, asset_id, catalog_item_id, variant_id, alt_text
)
values (
  '00000000-0000-4000-9700-000000000073',
  '00000000-0000-4000-9700-000000000061',
  '00000000-0000-4000-9700-000000000061',
  (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000061' and name = 'Media order product'),
  (select id from public.erp_catalog_variants where organization_id = '00000000-0000-4000-9700-000000000061' and name = 'Media order SKU'),
  'SKU image'
);

select is(
  (select array_agg(position order by position)
     from public.erp_product_media_assignments
    where catalog_item_id = (select id from public.erp_catalog_items where name = 'Media order product')
      and variant_id is null),
  array[0, 1],
  'new assignments append to the product gallery instead of trusting client positions'
);
select is(
  (select array_agg(version order by position)
     from public.erp_product_media_assignments
    where catalog_item_id = (select id from public.erp_catalog_items where name = 'Media order product')
      and variant_id is null),
  array[1::bigint, 1::bigint],
  'new assignments start at version one'
);
select is(
  (select position
     from public.erp_product_media_assignments
    where id = '00000000-0000-4000-9700-000000000073'),
  0,
  'a SKU gallery has an independent position sequence'
);
select is(
  (select count(*)::integer
     from public.erp_product_media_assignments
    where asset_id = '00000000-0000-4000-9700-000000000061'),
  2,
  'one reusable asset can be assigned to both product and SKU galleries'
);
select is(
  (select count(*)::integer
     from public.platform_files
    where organization_id = '00000000-0000-4000-9700-000000000061'),
  2,
  'reusing media does not duplicate Platform Files'
);

select lives_ok(
  $$ select * from public.reorder_erp_product_media_assignments(
       '00000000-0000-4000-9700-000000000061',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000061' and name = 'Media order product'),
       null,
       array[
         '00000000-0000-4000-9700-000000000072'::uuid,
         '00000000-0000-4000-9700-000000000071'::uuid
       ],
       array[1::bigint, 1::bigint]
     ) $$,
  'an authorized owner can atomically reorder the complete gallery'
);
select is(
  (select array_agg(id order by position)
     from public.erp_product_media_assignments
    where catalog_item_id = (select id from public.erp_catalog_items where name = 'Media order product')
      and variant_id is null),
  array[
    '00000000-0000-4000-9700-000000000072'::uuid,
    '00000000-0000-4000-9700-000000000071'::uuid
  ],
  'the reorder persists the requested position order'
);
select is(
  (select array_agg(version order by position)
     from public.erp_product_media_assignments
    where catalog_item_id = (select id from public.erp_catalog_items where name = 'Media order product')
      and variant_id is null),
  array[2::bigint, 2::bigint],
  'reordered assignments increment their versions'
);
select throws_ok(
  $$ select * from public.reorder_erp_product_media_assignments(
       '00000000-0000-4000-9700-000000000061',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000061' and name = 'Media order product'),
       null,
       array['00000000-0000-4000-9700-000000000071'::uuid],
       array[2::bigint]
     ) $$,
  '40001',
  'MEDIA_ORDER_CONFLICT',
  'an incomplete assignment set is rejected without changing the gallery'
);
select throws_ok(
  $$ select * from public.reorder_erp_product_media_assignments(
       '00000000-0000-4000-9700-000000000061',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000061' and name = 'Media order product'),
       null,
       array[
         '00000000-0000-4000-9700-000000000071'::uuid,
         '00000000-0000-4000-9700-000000000072'::uuid
       ],
       array[1::bigint, 1::bigint]
     ) $$,
  '40001',
  'MEDIA_ORDER_CONFLICT',
  'stale assignment versions are rejected'
);
select throws_ok(
  $$ update public.erp_product_media_assignments
        set position = 0
      where id = '00000000-0000-4000-9700-000000000071' $$,
  '42501',
  null,
  'clients cannot bypass the atomic reorder command by updating positions directly'
);
select lives_ok(
  $$ update public.erp_product_media_assignments
        set alt_text = 'Updated contextual text'
      where id = '00000000-0000-4000-9700-000000000071' $$,
  'an authorized owner can update assignment-specific alt text'
);
select is(
  (select version
     from public.erp_product_media_assignments
    where id = '00000000-0000-4000-9700-000000000071'),
  3::bigint,
  'alt-text changes increment the assignment version'
);
select lives_ok(
  $$ delete from public.erp_product_media_assignments
      where id = '00000000-0000-4000-9700-000000000072' $$,
  'an authorized owner can detach an assignment'
);
select is(
  (select count(*)::integer
     from public.platform_files
    where organization_id = '00000000-0000-4000-9700-000000000061'),
  2,
  'detaching preserves both Platform Files'
);
select is(
  (select count(*)::integer
     from public.erp_product_media_assignments
    where id = '00000000-0000-4000-9700-000000000073'
      and position = 0),
  1,
  'detaching from the product gallery preserves the other SKU assignment and its order'
);

select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000062');
select throws_ok(
  $$ select * from public.reorder_erp_product_media_assignments(
       '00000000-0000-4000-9700-000000000061',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000061' and name = 'Media order product'),
       null,
       array['00000000-0000-4000-9700-000000000071'::uuid],
       array[3::bigint]
     ) $$,
  '42501',
  'Catalog write permission is required to reorder product media',
  'viewers cannot reorder product media'
);

select * from finish();
rollback;
