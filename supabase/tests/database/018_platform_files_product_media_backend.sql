begin;

\ir helpers/rls_helpers.sql

select plan(11);

insert into auth.users (id, aud, role, email, encrypted_password, confirmed_at)
values (
  '00000000-0000-4000-8700-000000000081',
  'authenticated',
  'authenticated',
  'platform-files-owner@example.test',
  '',
  now()
);

insert into public.organizations (id, name, slug)
values ('00000000-0000-4000-9700-000000000081', 'Platform Files media test', 'platform-files-media-test');

insert into public.organization_memberships (organization_id, user_id, role)
values (
  '00000000-0000-4000-9700-000000000081',
  '00000000-0000-4000-8700-000000000081',
  'owner'
);

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
  'Platform Files product'
);

set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000081');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.platform_file_renditions'::regclass),
  'rendition metadata has row-level security enabled'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.begin_platform_product_media_upload(uuid,uuid,uuid,text,text,bigint,text)',
    'EXECUTE'
  ),
  'authenticated clients cannot create upload sessions outside the server'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.finalize_platform_product_media_upload(uuid,uuid,text,bigint,integer,integer,bigint,integer,integer)',
    'EXECUTE'
  ),
  'authenticated clients cannot finalize Files metadata directly'
);
select throws_ok(
  $$ insert into public.platform_file_upload_sessions (
       organization_id, file_name, mime_type, byte_size, storage_path, status, created_by,
       purpose, resource_entity_type, resource_entity_id, idempotency_key, idempotency_fingerprint
     ) values (
       '00000000-0000-4000-9700-000000000081', 'fake.png', 'image/png', 1,
       'organizations/00000000-0000-4000-9700-000000000081/product-media/fake/original.png',
       'pending', '00000000-0000-4000-8700-000000000081', 'product_media', 'catalog_item',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Platform Files product'),
       repeat('a', 64), 'forged'
     ) $$,
  '42501',
  null,
  'authenticated clients cannot forge product-media upload sessions'
);
select throws_ok(
  $$ insert into public.platform_files (
       organization_id, name, category, source, media_type, size, relation_type, relation_id, storage_path
     ) values (
       '00000000-0000-4000-9700-000000000081', 'fake.png', 'product', 'upload',
       'image/png', 1, 'product_media_library', '00000000-0000-4000-9700-000000000081',
       'organizations/00000000-0000-4000-9700-000000000081/product-media/fake.png'
     ) $$,
  '42501',
  null,
  'authenticated clients cannot register unvalidated product media'
);
select throws_ok(
  $$ insert into public.platform_file_renditions (
       organization_id, file_id, rendition, media_type, byte_size, width, height, storage_path
     ) values (
       '00000000-0000-4000-9700-000000000081',
       '00000000-0000-4000-8700-000000000082',
       'large', 'image/webp', 1, 1, 1,
       'organizations/00000000-0000-4000-9700-000000000081/product-media/test/renditions/large.webp'
     ) $$,
  '42501',
  null,
  'authenticated clients cannot forge rendition metadata'
);

reset role;
select set_config('request.jwt.claim.role', 'service_role', true);
set local role service_role;
select lives_ok(
  $$ select public.begin_platform_product_media_upload(
       '00000000-0000-4000-9700-000000000081',
       '00000000-0000-4000-8700-000000000081',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Platform Files product'),
       'new.png',
       'image/png',
       4,
       repeat('b', 64)
     ) $$,
  'the authorized server can create a scoped upload session'
);
select is(
  (
    select public.begin_platform_product_media_upload(
      '00000000-0000-4000-9700-000000000081',
      '00000000-0000-4000-8700-000000000081',
      (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Platform Files product'),
      'new.png',
      'image/png',
      4,
      repeat('b', 64)
    ) ->> 'uploadId'
  ),
  (
    select public.begin_platform_product_media_upload(
      '00000000-0000-4000-9700-000000000081',
      '00000000-0000-4000-8700-000000000081',
      (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Platform Files product'),
      'new.png',
      'image/png',
      4,
      repeat('b', 64)
    ) ->> 'uploadId'
  ),
  'retries with the same checksum and resource reuse one upload session'
);
reset role;
select is(
  (select count(*)::integer from public.platform_file_upload_sessions
    where organization_id = '00000000-0000-4000-9700-000000000081' and purpose = 'product_media'),
  1,
  'idempotent retries do not duplicate upload sessions'
);
reset role;
update public.erp_product_write_controls
   set enabled = false,
       reason_code = 'test_disabled',
       updated_at = now()
 where organization_id = '00000000-0000-4000-9700-000000000081';
set local role service_role;
select throws_ok(
  $$ select public.begin_platform_product_media_upload(
       '00000000-0000-4000-9700-000000000081',
       '00000000-0000-4000-8700-000000000081',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Platform Files product'),
       'disabled.png',
       'image/png',
       4,
       repeat('d', 64)
     ) $$,
  '42501',
  null,
  'the server respects the organization product-write safety control'
);
select throws_ok(
  $$ select public.begin_platform_product_media_upload(
       '00000000-0000-4000-9700-000000000081',
       '00000000-0000-4000-8700-000000000082',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000081' and name = 'Platform Files product'),
       'other.png',
       'image/png',
       4,
       repeat('c', 64)
     ) $$,
  '42501',
  null,
  'the server rejects an actor without active organization permission'
);

select * from finish();
rollback;
