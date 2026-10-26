begin;

\ir helpers/rls_helpers.sql

select plan(52);

insert into auth.users (id, aud, role, email, encrypted_password, confirmed_at)
values
  ('00000000-0000-4000-8700-000000000051', 'authenticated', 'authenticated', 'erp-rls-owner@example.test', '', now()),
  ('00000000-0000-4000-8700-000000000052', 'authenticated', 'authenticated', 'erp-rls-admin@example.test', '', now()),
  ('00000000-0000-4000-8700-000000000053', 'authenticated', 'authenticated', 'erp-rls-agent@example.test', '', now()),
  ('00000000-0000-4000-8700-000000000054', 'authenticated', 'authenticated', 'erp-rls-viewer@example.test', '', now()),
  ('00000000-0000-4000-8700-000000000055', 'authenticated', 'authenticated', 'erp-rls-owner-b@example.test', '', now());

insert into public.organizations (id, name, slug)
values
  ('00000000-0000-4000-9700-000000000051', 'ERP RLS A', 'erp-rls-a'),
  ('00000000-0000-4000-9700-000000000052', 'ERP RLS B', 'erp-rls-b');

insert into public.organization_memberships (organization_id, user_id, role)
values
  ('00000000-0000-4000-9700-000000000051', '00000000-0000-4000-8700-000000000051', 'owner'),
  ('00000000-0000-4000-9700-000000000051', '00000000-0000-4000-8700-000000000052', 'admin'),
  ('00000000-0000-4000-9700-000000000051', '00000000-0000-4000-8700-000000000053', 'agent'),
  ('00000000-0000-4000-9700-000000000051', '00000000-0000-4000-8700-000000000054', 'viewer'),
  ('00000000-0000-4000-9700-000000000052', '00000000-0000-4000-8700-000000000055', 'owner');

select ok(
  (select security_gates_ready from public.erp_product_write_controls where scope = 'global'),
  'write controls report ready only after the operation-specific policies are installed'
);
select ok(
  not public.erp_product_writes_enabled('00000000-0000-4000-9700-000000000051'),
  'global and organization write controls remain disabled by default'
);
select ok(
  not has_table_privilege('authenticated', 'public.erp_catalog_items', 'delete'),
  'authenticated users have no physical product DELETE privilege'
);
select ok(
  not has_table_privilege('authenticated', 'public.erp_catalog_items', 'truncate'),
  'authenticated users have no product TRUNCATE privilege'
);
select ok(
  not has_table_privilege('authenticated', 'public.erp_product_cost_references', 'delete'),
  'authenticated users cannot physically delete purchase costs'
);
select ok(
  has_table_privilege('authenticated', 'public.erp_product_media_assignments', 'delete'),
  'authenticated writers can delete only the product-media association for detach'
);
select is(
  (select count(*)::integer
     from pg_policies
    where schemaname = 'public'
      and tablename in (
        'erp_catalogs', 'erp_catalog_items', 'erp_catalog_offers',
        'erp_catalog_variants', 'erp_price_books', 'erp_price_entries',
        'erp_product_references', 'erp_product_cost_references',
        'erp_product_media_assets', 'erp_product_media_assignments'
      )
      and lower(cmd) = 'all'),
  0,
  'Products tables have no broad FOR ALL policy'
);
select is(
  (select count(*)::integer
     from pg_policies
    where schemaname = 'public'
      and tablename = 'erp_product_cost_references'
      and lower(cmd) = 'select'
      and qual like '%catalog.cost.read%'),
  1,
  'cost SELECT is protected by catalog.cost.read'
);
select is(
  (select count(*)::integer
     from pg_policies
    where schemaname = 'public'
      and tablename = 'erp_product_cost_references'
      and lower(cmd) in ('insert', 'update')
      and coalesce(with_check, '') like '%catalog.cost.manage%'),
  2,
  'cost INSERT and UPDATE require catalog.cost.manage'
);

set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000051');
select ok(
  public.has_organization_permission('00000000-0000-4000-9700-000000000051', 'catalog.cost.read')
  and public.has_organization_permission('00000000-0000-4000-9700-000000000051', 'catalog.cost.manage'),
  'organization owners receive both cost permissions'
);
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000052');
select ok(
  public.has_organization_permission('00000000-0000-4000-9700-000000000051', 'catalog.cost.read')
  and public.has_organization_permission('00000000-0000-4000-9700-000000000051', 'catalog.cost.manage'),
  'organization admins receive both cost permissions'
);
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000053');
select ok(
  not public.has_organization_permission('00000000-0000-4000-9700-000000000051', 'catalog.cost.read')
  and not public.has_organization_permission('00000000-0000-4000-9700-000000000051', 'catalog.cost.manage'),
  'agents receive neither cost permission'
);
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000054');
select ok(
  not public.has_organization_permission('00000000-0000-4000-9700-000000000051', 'catalog.cost.read')
  and not public.has_organization_permission('00000000-0000-4000-9700-000000000051', 'catalog.cost.manage'),
  'viewers receive neither cost permission'
);
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000051');
select throws_ok(
  $$ insert into public.erp_product_references (organization_id, kind, key, name)
     values ('00000000-0000-4000-9700-000000000051', 'category', 'default-off', 'Default off') $$,
  '42501',
  null,
  'Products writes fail while global and organization controls are off'
);
select throws_ok(
  $$ insert into public.platform_files (
       organization_id, name, category, source, media_type, size, relation_type, relation_id, storage_path
     ) values (
       '00000000-0000-4000-9700-000000000051', 'default-off.jpg', 'product', 'upload',
       'image/jpeg', 1, 'product_media_library', '00000000-0000-4000-9700-000000000051',
       'organizations/00000000-0000-4000-9700-000000000051/product-media/default-off.jpg'
     ) $$,
  '42501',
  null,
  'Product-media Files writes fail while controls are off'
);

reset role;
update public.erp_product_write_controls
   set enabled = true, reason_code = 'test_fixture', updated_at = now()
 where scope = 'global';
insert into public.erp_product_write_controls (scope, organization_id, enabled, reason_code)
values
  ('organization', '00000000-0000-4000-9700-000000000051', true, 'test_fixture'),
  ('organization', '00000000-0000-4000-9700-000000000052', true, 'test_fixture');

set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000051');
select lives_ok(
  $$ insert into public.erp_catalogs (organization_id, key, name, kind, status)
     values ('00000000-0000-4000-9700-000000000051', 'products', 'Products', 'products', 'active') $$,
  'an authorized owner can create an organization catalog'
);
select lives_ok(
  $$ insert into public.erp_catalog_items (organization_id, catalog_id, type, name)
     values (
       '00000000-0000-4000-9700-000000000051',
       (select id from public.erp_catalogs where organization_id = '00000000-0000-4000-9700-000000000051' and key = 'products'),
       'physical_product',
       'RLS test product'
     ) $$,
  'an authorized owner can create a product with database-generated identifiers'
);
select lives_ok(
  $$ insert into public.erp_catalog_variants (organization_id, catalog_item_id, name)
     values (
       '00000000-0000-4000-9700-000000000051',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000051' and name = 'RLS test product'),
       'RLS test variant'
     ) $$,
  'an authorized owner can create a same-organization SKU variant'
);
select lives_ok(
  $$ insert into public.erp_catalog_offers (organization_id, catalog_item_id, key, name)
     values (
       '00000000-0000-4000-9700-000000000051',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000051' and name = 'RLS test product'),
       'standard',
       'Standard offer'
     ) $$,
  'an authorized owner can create a same-organization offer'
);
select lives_ok(
  $$ insert into public.erp_price_books (organization_id, key, name, currency)
     values ('00000000-0000-4000-9700-000000000051', 'retail', 'Retail', 'EUR') $$,
  'an authorized owner can create an organization price book'
);
select lives_ok(
  $$ insert into public.erp_price_entries (
       organization_id, price_book_id, catalog_item_id, offer_id, variant_id, amount, currency
     ) values (
       '00000000-0000-4000-9700-000000000051',
       (select id from public.erp_price_books where organization_id = '00000000-0000-4000-9700-000000000051' and key = 'retail'),
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000051' and name = 'RLS test product'),
       (select id from public.erp_catalog_offers where organization_id = '00000000-0000-4000-9700-000000000051' and key = 'standard'),
       (select id from public.erp_catalog_variants where organization_id = '00000000-0000-4000-9700-000000000051' and name = 'RLS test variant'),
       49.90,
       'EUR'
     ) $$,
  'an authorized owner can create a same-organization price entry'
);
select lives_ok(
  $$ insert into public.erp_product_cost_references (organization_id, catalog_item_id, variant_id, amount, currency)
     values (
       '00000000-0000-4000-9700-000000000051',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000051' and name = 'RLS test product'),
       (select id from public.erp_catalog_variants where organization_id = '00000000-0000-4000-9700-000000000051' and name = 'RLS test variant'),
       12.50,
       'EUR'
     ) $$,
  'an authorized owner can create a SKU-level purchase cost'
);
select throws_ok(
  $$ insert into public.platform_files (
       organization_id, name, category, source, media_type, size, relation_type, relation_id, storage_path
     ) values (
       '00000000-0000-4000-9700-000000000051', 'rls-test.jpg', 'product', 'upload',
       'image/jpeg', 1, 'product_media_library', '00000000-0000-4000-9700-000000000051',
       'organizations/00000000-0000-4000-9700-000000000051/product-media/rls-test.jpg'
     ) $$,
  '42501',
  null,
  'clients cannot create product-media file metadata outside Platform Files'
);
reset role;
select set_config('request.jwt.claim.role', 'service_role', true);
set local role service_role;
insert into public.platform_files (
  organization_id, name, category, source, media_type, size, relation_type, relation_id, storage_path
) values (
  '00000000-0000-4000-9700-000000000051', 'rls-test.jpg', 'product', 'upload',
  'image/jpeg', 1, 'product_media_library', '00000000-0000-4000-9700-000000000051',
  'organizations/00000000-0000-4000-9700-000000000051/product-media/rls-test.jpg'
);
reset role;
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000051');
select lives_ok(
  $$ insert into public.erp_product_media_assets (organization_id, file_id)
     values (
       '00000000-0000-4000-9700-000000000051',
       (select id from public.platform_files where organization_id = '00000000-0000-4000-9700-000000000051' and name = 'rls-test.jpg')
     ) $$,
  'an authorized owner can create an organization-scoped media asset'
);
select lives_ok(
  $$ insert into public.erp_product_media_assignments (organization_id, asset_id, catalog_item_id, alt_text)
     values (
       '00000000-0000-4000-9700-000000000051',
       (select id from public.erp_product_media_assets where organization_id = '00000000-0000-4000-9700-000000000051'),
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000051' and name = 'RLS test product'),
       'RLS test'
     ) $$,
  'an authorized owner can associate a media asset with a product'
);
select set_config(
  'test.erp_catalog_id',
  (select id::text from public.erp_catalogs where organization_id = '00000000-0000-4000-9700-000000000051' and key = 'products'),
  true
);
select set_config(
  'test.erp_item_id',
  (select id::text from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000051' and name = 'RLS test product'),
  true
);

select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000054');
select is(
  (select count(*)::integer from public.erp_catalog_items where name = 'RLS test product'),
  1,
  'a viewer can read products in the viewer organization'
);
select is(
  (select count(*)::integer from public.erp_product_cost_references),
  0,
  'a viewer cannot read purchase-cost rows'
);
select throws_ok(
  $$ insert into public.erp_product_references (organization_id, kind, key, name)
     values ('00000000-0000-4000-9700-000000000051', 'category', 'viewer-write', 'Viewer write') $$,
  '42501',
  null,
  'a viewer cannot write Product references'
);
select throws_ok(
  $$ delete from public.erp_product_references
      where organization_id = '00000000-0000-4000-9700-000000000051' $$,
  '42501',
  null,
  'a viewer cannot physically delete Product references'
);

select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000053');
select lives_ok(
  $$ insert into public.erp_product_references (organization_id, kind, key, name)
     values ('00000000-0000-4000-9700-000000000051', 'category', 'agent-write', 'Agent write') $$,
  'an agent retains catalog.write for ordinary Product changes'
);
select is(
  (select count(*)::integer from public.erp_product_cost_references),
  0,
  'an agent cannot read purchase-cost rows despite catalog.write'
);
select throws_ok(
  $$ insert into public.erp_product_cost_references (organization_id, catalog_item_id, amount, currency)
     values (
       '00000000-0000-4000-9700-000000000051',
       (select id from public.erp_catalog_items where organization_id = '00000000-0000-4000-9700-000000000051' and name = 'RLS test product'),
       99.00,
       'EUR'
     ) $$,
  '42501',
  null,
  'an agent cannot create purchase costs'
);
select lives_ok(
  $$ delete from public.erp_product_media_assignments
      where organization_id = '00000000-0000-4000-9700-000000000051' $$,
  'an agent can detach a media association without deleting the File'
);
select is(
  (select count(*)::integer
     from public.platform_files
    where organization_id = '00000000-0000-4000-9700-000000000051'
      and name = 'rls-test.jpg'),
  1,
  'detaching a media association preserves its reusable Platform File'
);

select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000055');
select is(
  (select count(*)::integer from public.erp_catalog_items where name = 'RLS test product'),
  0,
  'a different organization cannot read the product by direct query'
);
select throws_ok(
  $$ insert into public.erp_catalog_items (organization_id, catalog_id, type, name)
     values (
       '00000000-0000-4000-9700-000000000052',
       current_setting('test.erp_catalog_id')::uuid,
       'physical_product',
       'Cross-tenant product'
     ) $$,
  '23503',
  null,
  'a product cannot reference another organization catalog'
);
select throws_ok(
  $$ insert into public.erp_product_cost_references (organization_id, catalog_item_id, amount, currency)
     values (
       '00000000-0000-4000-9700-000000000052',
       current_setting('test.erp_item_id')::uuid,
       10.00,
       'EUR'
     ) $$,
  '23503',
  null,
  'a cost row cannot reference another organization product'
);
select is(
  (select count(*)::integer
     from public.platform_files
    where name = 'rls-test.jpg'),
  0,
  'another organization cannot read Product media metadata'
);

select pg_temp.set_authenticated_user('00000000-0000-4000-8700-000000000051');
select lives_ok(
  $$ update public.erp_product_cost_references
        set amount = 11.75, updated_at = '2000-01-01 00:00:00+00'
      where organization_id = '00000000-0000-4000-9700-000000000051' $$,
  'an owner with catalog.cost.manage can update a purchase cost'
);
select ok(
  (select updated_at > now() - interval '1 minute'
     from public.erp_product_cost_references
    where organization_id = '00000000-0000-4000-9700-000000000051'),
  'the database replaces client-supplied updated_at with its own mutation timestamp'
);
select ok(
  exists (
    select 1
      from public.platform_audit_events
     where organization_id = '00000000-0000-4000-9700-000000000051'
       and event_type = 'erp.product_cost_references.update'
       and metadata -> 'changed_fields' ? 'amount'
       and not (metadata::text like '%11.75%')
  ),
  'cost audit events record changed field names without cost values'
);

reset role;
select ok(
  exists (
    select 1 from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname = 'platform_files_storage_insert'
       and with_check like '%erp_product_writes_enabled%'
  ),
  'product-media Storage inserts are gated by Products write controls'
);
select ok(
  exists (
    select 1 from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname = 'platform_files_storage_update'
       and qual like '%<> ''product-media''%'
       and with_check like '%<> ''product-media''%'
  ),
  'product-media Storage objects cannot be updated by authenticated clients'
);
select ok(
  exists (
    select 1 from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname = 'platform_files_storage_delete'
       and qual like '%<> ''product-media''%'
  ),
  'authenticated users cannot delete product-media Storage objects'
);
select ok(
  exists (
    select 1
      from pg_trigger
     where tgrelid = 'storage.objects'::regclass
       and tgname = 'erp_product_media_write_control_guard'
       and not tgisinternal
  ),
  'a database trigger also gates Product media Storage mutations'
);
select ok(
  exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'platform_files'
       and policyname = 'platform_files_member_select'
       and qual like '%catalog.read%'
  ),
  'Product media File metadata reads require catalog.read'
);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '', true);
set local role service_role;
select lives_ok($$
  insert into public.platform_files (
    id, organization_id, name, category, source, media_type, size, status,
    relation_type, relation_id, storage_path, uploaded_by
  ) values (
    '00000000-0000-4000-9700-000000000099',
    '00000000-0000-4000-9700-000000000051',
    'service-upload.png',
    'other',
    'upload',
    'image/png',
    8,
    'active',
    'product_media_library',
    '00000000-0000-4000-9700-000000000051',
    'organizations/00000000-0000-4000-9700-000000000051/product-media/00000000-0000-4000-9700-000000000099/service-upload.png',
    '00000000-0000-4000-8700-000000000051'
  )
$$, 'service-role product media metadata writes audit the validated uploader');
reset role;
select is(
  (select count(*)::integer
     from public.platform_audit_events
    where organization_id = '00000000-0000-4000-9700-000000000051'
      and actor_user_id = '00000000-0000-4000-8700-000000000051'
      and event_type = 'erp.product_media.file.insert'),
  1,
  'service-role product media metadata audit retains the authenticated actor'
);

select set_config('request.jwt.claim.sub', '', true);
insert into public.platform_file_upload_sessions (
  id, organization_id, file_name, mime_type, byte_size, storage_path, status,
  created_by, purpose, resource_entity_type, resource_entity_id,
  idempotency_key, idempotency_fingerprint
) values (
  '00000000-0000-4000-9700-000000000099',
  '00000000-0000-4000-9700-000000000051',
  'service-upload.png',
  'image/png',
  8,
  'organizations/00000000-0000-4000-9700-000000000051/product-media/00000000-0000-4000-9700-000000000099/original.png',
  'pending',
  '00000000-0000-4000-8700-000000000051',
  'product_media',
  'catalog_item',
  '00000000-0000-4000-9700-000000000051',
  repeat('a', 64),
  'service-upload'
);
set local role service_role;
select lives_ok($$
  insert into storage.objects (bucket_id, name, owner, owner_id, metadata, user_metadata, version)
  values (
    'platform-files',
    'organizations/00000000-0000-4000-9700-000000000051/product-media/00000000-0000-4000-9700-000000000099/original.png',
    '00000000-0000-4000-8700-000000000051',
    '00000000-0000-4000-8700-000000000051',
    '{"mimetype":"image/png"}'::jsonb,
    '{}'::jsonb,
    'service-product-media-original'
  )
$$, 'signed product media Storage uploads audit the actor from their upload session');
reset role;
select is(
  (select count(*)::integer
     from public.platform_audit_events
    where organization_id = '00000000-0000-4000-9700-000000000051'
      and actor_user_id = '00000000-0000-4000-8700-000000000051'
      and event_type = 'erp.product_media.storage.insert'),
  1,
  'signed product media Storage audit retains the upload-session actor'
);

set local role service_role;
select lives_ok($$
  insert into storage.objects (bucket_id, name, owner, owner_id, metadata, user_metadata, version)
  values (
    'platform-files',
    'organizations/00000000-0000-4000-9700-000000000051/product-media/00000000-0000-4000-9700-000000000098/renditions/large.webp',
    '00000000-0000-4000-8700-000000000051',
    '00000000-0000-4000-8700-000000000051',
    '{"mimetype":"image/webp"}'::jsonb,
    '{"loopdev_actor_user_id":"00000000-0000-4000-8700-000000000051"}'::jsonb,
    'service-product-media-legacy-rendition'
  )
$$, 'legacy product media renditions audit the supplied service actor');
reset role;
select is(
  (select count(*)::integer
     from public.platform_audit_events
    where organization_id = '00000000-0000-4000-9700-000000000051'
      and actor_user_id = '00000000-0000-4000-8700-000000000051'
      and event_type = 'erp.product_media.storage.insert'),
  2,
  'legacy product media renditions retain their authenticated audit actor'
);

select * from finish();
rollback;
